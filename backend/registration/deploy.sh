#!/usr/bin/env bash
set -euo pipefail

TABLE_NAME="${TABLE_NAME:-raagasudha-student-registrations}"
FUNCTION_NAME="${FUNCTION_NAME:-raagasudha-student-registration}"
ROLE_NAME="${ROLE_NAME:-raagasudha-student-registration-lambda-role}"
API_NAME="${API_NAME:-raagasudha-student-registration-api}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}}"
REGION="${REGION:-eu-west-2}"

ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:5174,http://localhost:4173,https://raagasudha-academy.github.io,https://www.raagasudhamusic.co.uk,https://raagasudhamusic.co.uk}"

command -v aws >/dev/null || { echo "ERROR: aws CLI is required."; exit 1; }
command -v zip >/dev/null || { echo "ERROR: zip is required."; exit 1; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
PHOTO_BUCKET="${PHOTO_BUCKET:-raagasudha-registration-photos-${ACCOUNT_ID}-${REGION}}"
TABLE_ARN="arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLE_NAME}"
PHOTO_BUCKET_ARN="arn:aws:s3:::${PHOTO_BUCKET}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "Registration table: $TABLE_NAME"
echo "Private photo bucket: $PHOTO_BUCKET"
echo

# Existing table is reused in place. No destructive table replacement occurs.
if ! aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Creating DynamoDB table: $TABLE_NAME"
  aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=registrationId,AttributeType=S \
    --key-schema AttributeName=registrationId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" >/dev/null
  aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
else
  echo "Reusing existing DynamoDB table: $TABLE_NAME"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_NAME" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region "$REGION" >/dev/null || true

# Private object storage for new v2 student photographs.
if ! aws s3api head-bucket --bucket "$PHOTO_BUCKET" >/dev/null 2>&1; then
  echo "Creating private photograph bucket: $PHOTO_BUCKET"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$PHOTO_BUCKET" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket \
      --bucket "$PHOTO_BUCKET" \
      --create-bucket-configuration "LocationConstraint=$REGION" \
      --region "$REGION" >/dev/null
  fi
else
  echo "Reusing existing photograph bucket: $PHOTO_BUCKET"
fi

aws s3api put-public-access-block \
  --bucket "$PHOTO_BUCKET" \
  --public-access-block-configuration \
  'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true' \
  --region "$REGION" >/dev/null

aws s3api put-bucket-encryption \
  --bucket "$PHOTO_BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' \
  --region "$REGION" >/dev/null

cat > "$TMP_DIR/bucket-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "$PHOTO_BUCKET_ARN",
        "$PHOTO_BUCKET_ARN/*"
      ],
      "Condition": {"Bool": {"aws:SecureTransport": "false"}}
    }
  ]
}
JSON
aws s3api put-bucket-policy \
  --bucket "$PHOTO_BUCKET" \
  --policy "file://$TMP_DIR/bucket-policy.json" \
  --region "$REGION" >/dev/null

# Only the public registration origins may upload directly through a short-lived
# presigned PUT. Objects remain private; no public GET CORS rule is created.
python3 - "$ALLOWED_ORIGINS" "$TMP_DIR/photo-cors.json" <<'PY'
import json, sys
origins = [value.strip() for value in sys.argv[1].split(',') if value.strip()]
with open(sys.argv[2], 'w') as handle:
    json.dump({
        "CORSRules": [{
            "AllowedOrigins": origins,
            "AllowedMethods": ["PUT"],
            "AllowedHeaders": ["content-type", "x-amz-tagging"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 600,
        }]
    }, handle)
PY
aws s3api put-bucket-cors \
  --bucket "$PHOTO_BUCKET" \
  --cors-configuration "file://$TMP_DIR/photo-cors.json" \
  --region "$REGION" >/dev/null

# Abandoned multipart uploads are cleaned up, but completed intake photographs
# are retained until the reviewed discard/delete workflow removes them.
cat > "$TMP_DIR/lifecycle.json" <<'JSON'
{
  "Rules": [
    {
      "ID": "AbortIncompleteUploads",
      "Status": "Enabled",
      "Filter": {"Prefix": "intake/"},
      "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
    },
    {
      "ID": "ExpireUnsubmittedIntakePhotos",
      "Status": "Enabled",
      "Filter": {
        "And": {
          "Prefix": "intake/requests/",
          "Tags": [{"Key": "state", "Value": "unsubmitted"}]
        }
      },
      "Expiration": {"Days": 7}
    }
  ]
}
JSON
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$PHOTO_BUCKET" \
  --lifecycle-configuration "file://$TMP_DIR/lifecycle.json" \
  --region "$REGION" >/dev/null

cat > "$TMP_DIR/trust-policy.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
JSON

if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "Creating Lambda IAM role: $ROLE_NAME"
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "file://$TMP_DIR/trust-policy.json" >/dev/null
else
  echo "Lambda IAM role already exists: $ROLE_NAME"
fi

aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null

cat > "$TMP_DIR/backend-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "$TABLE_ARN"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectTagging"
      ],
      "Resource": "$PHOTO_BUCKET_ARN/*"
    }
  ]
}
JSON

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name RaagaSudhaRegistrationBackendAccess \
  --policy-document "file://$TMP_DIR/backend-policy.json" >/dev/null

cp "$SCRIPT_DIR/lambda_function.py" "$TMP_DIR/lambda_function.py"
cp "$SCRIPT_DIR/registration_core.py" "$TMP_DIR/registration_core.py"
(
  cd "$TMP_DIR"
  zip -q lambda.zip lambda_function.py registration_core.py
)

cat > "$TMP_DIR/lambda-env.json" <<JSON
{
  "Variables": {
    "TABLE_NAME": "$TABLE_NAME",
    "PHOTO_BUCKET": "$PHOTO_BUCKET",
    "ALLOWED_ORIGINS": "$ALLOWED_ORIGINS"
  }
}
JSON

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Updating Lambda: $FUNCTION_NAME"
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$TMP_DIR/lambda.zip" \
    --region "$REGION" >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --runtime python3.12 \
    --handler lambda_function.lambda_handler \
    --timeout 15 \
    --memory-size 256 \
    --environment "file://$TMP_DIR/lambda-env.json" \
    --region "$REGION" >/dev/null
else
  echo "Creating Lambda: $FUNCTION_NAME"
  for attempt in 1 2 3 4 5; do
    if aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime python3.12 \
      --role "$ROLE_ARN" \
      --handler lambda_function.lambda_handler \
      --zip-file "fileb://$TMP_DIR/lambda.zip" \
      --timeout 15 \
      --memory-size 256 \
      --environment "file://$TMP_DIR/lambda-env.json" \
      --region "$REGION" >/dev/null 2>&1; then
      break
    fi
    if [ "$attempt" = "5" ]; then
      echo "ERROR: Lambda creation failed after waiting for IAM role propagation."
      exit 1
    fi
    sleep 6
  done
fi

aws lambda wait function-active-v2 --function-name "$FUNCTION_NAME" --region "$REGION"
FUNCTION_ARN="$(aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Configuration.FunctionArn' --output text --region "$REGION")"

API_ID="$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$API_NAME'].ApiId | [0]" --output text)"

python3 - "$ALLOWED_ORIGINS" "$TMP_DIR/api-cors.json" <<'PY'
import json, sys
origins = [value.strip() for value in sys.argv[1].split(',') if value.strip()]
with open(sys.argv[2], 'w') as handle:
    json.dump({
        "AllowOrigins": origins,
        "AllowMethods": ["POST", "OPTIONS"],
        "AllowHeaders": ["content-type"],
        "MaxAge": 86400,
    }, handle)
PY

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  echo "Creating HTTP API: $API_NAME"
  API_ID="$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration "file://$TMP_DIR/api-cors.json" \
    --query ApiId \
    --output text \
    --region "$REGION")"
else
  echo "HTTP API already exists: $API_NAME ($API_ID)"
  aws apigatewayv2 update-api \
    --api-id "$API_ID" \
    --cors-configuration "file://$TMP_DIR/api-cors.json" \
    --region "$REGION" >/dev/null
fi

INTEGRATION_ID="$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" --query "Items[?IntegrationUri=='$FUNCTION_ARN'].IntegrationId | [0]" --output text)"
if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" = "None" ]; then
  INTEGRATION_ID="$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$FUNCTION_ARN" \
    --payload-format-version 2.0 \
    --timeout-in-millis 15000 \
    --query IntegrationId \
    --output text \
    --region "$REGION")"
fi

ensure_route() {
  local route_key="$1"
  local auth_type="$2"
  local route_id
  route_id="$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" --query "Items[?RouteKey=='$route_key'].RouteId | [0]" --output text)"
  if [ -z "$route_id" ] || [ "$route_id" = "None" ]; then
    aws apigatewayv2 create-route \
      --api-id "$API_ID" \
      --route-key "$route_key" \
      --target "integrations/$INTEGRATION_ID" \
      --authorization-type "$auth_type" \
      --region "$REGION" >/dev/null
  else
    aws apigatewayv2 update-route \
      --api-id "$API_ID" \
      --route-id "$route_id" \
      --target "integrations/$INTEGRATION_ID" \
      --authorization-type "$auth_type" \
      --region "$REGION" >/dev/null
  fi
}

# Public intake routes.
ensure_route 'POST /registration' NONE
ensure_route 'POST /registration/photo-upload' NONE

# Sadhana/server-to-server integration routes. These require SigV4 / AWS IAM.
ensure_route 'GET /admin/registrations' AWS_IAM
ensure_route 'GET /admin/registrations/{registrationId}' AWS_IAM
ensure_route 'PATCH /admin/registrations/{registrationId}' AWS_IAM
ensure_route 'DELETE /admin/registrations/{registrationId}' AWS_IAM
ensure_route 'GET /admin/registrations/{registrationId}/photos/{personId}' AWS_IAM

if ! aws apigatewayv2 get-stage --api-id "$API_ID" --stage-name '$default' --region "$REGION" >/dev/null 2>&1; then
  aws apigatewayv2 create-stage \
    --api-id "$API_ID" \
    --stage-name '$default' \
    --auto-deploy \
    --default-route-settings ThrottlingBurstLimit=5,ThrottlingRateLimit=2 \
    --region "$REGION" >/dev/null
else
  aws apigatewayv2 update-stage \
    --api-id "$API_ID" \
    --stage-name '$default' \
    --auto-deploy \
    --default-route-settings ThrottlingBurstLimit=5,ThrottlingRateLimit=2 \
    --region "$REGION" >/dev/null
fi

STATEMENT_ID="AllowApiGatewayRegistrationV2-${API_ID}"
SOURCE_ARN="arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*"
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "$STATEMENT_ID" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "$SOURCE_ARN" \
  --region "$REGION" >/dev/null 2>&1 || true

API_ENDPOINT="$(aws apigatewayv2 get-api --api-id "$API_ID" --query ApiEndpoint --output text --region "$REGION")"

echo
echo "Unified registration v2 backend prepared."
echo "Existing table retained: $TABLE_NAME"
echo "Private photo bucket:   $PHOTO_BUCKET"
echo "Lambda:                 $FUNCTION_NAME"
echo "Public endpoint:         ${API_ENDPOINT}/registration"
echo "Photo presign endpoint:  ${API_ENDPOINT}/registration/photo-upload"
echo "Admin API:               ${API_ENDPOINT}/admin/registrations (AWS_IAM only)"
echo
echo "Website setting remains:"
echo "VITE_REGISTRATION_API_URL=${API_ENDPOINT}/registration"
