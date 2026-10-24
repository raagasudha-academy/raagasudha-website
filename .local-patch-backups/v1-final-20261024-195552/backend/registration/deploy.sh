#!/usr/bin/env bash
set -euo pipefail

TABLE_NAME="${TABLE_NAME:-raagasudha-student-registrations}"
FUNCTION_NAME="${FUNCTION_NAME:-raagasudha-student-registration}"
ROLE_NAME="${ROLE_NAME:-raagasudha-student-registration-lambda-role}"
API_NAME="${API_NAME:-raagasudha-student-registration-api}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}}"
REGION="${REGION:-eu-west-2}"

ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:4173,https://raagasudha-academy.github.io}"

command -v aws >/dev/null || { echo "ERROR: aws CLI is required."; exit 1; }
command -v zip >/dev/null || { echo "ERROR: zip is required."; exit 1; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
TABLE_ARN="arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLE_NAME}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo

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
  echo "DynamoDB table already exists: $TABLE_NAME"
fi

aws dynamodb update-continuous-backups \
  --table-name "$TABLE_NAME" \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region "$REGION" >/dev/null || true

cat > "$TMP_DIR/trust-policy.json" <<JSON
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

cat > "$TMP_DIR/dynamodb-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem"],
      "Resource": "$TABLE_ARN"
    }
  ]
}
JSON

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name RaagaSudhaRegistrationTableAccess \
  --policy-document "file://$TMP_DIR/dynamodb-policy.json" >/dev/null

cp "$SCRIPT_DIR/lambda_function.py" "$TMP_DIR/lambda_function.py"
(
  cd "$TMP_DIR"
  zip -q lambda.zip lambda_function.py
)

cat > "$TMP_DIR/lambda-env.json" <<JSON
{
  "Variables": {
    "TABLE_NAME": "$TABLE_NAME",
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
    --timeout 10 \
    --memory-size 256 \
    --environment "file://$TMP_DIR/lambda-env.json" \
    --region "$REGION" >/dev/null
else
  echo "Creating Lambda: $FUNCTION_NAME"
  # IAM role propagation can take a few seconds after first creation.
  for attempt in 1 2 3 4 5; do
    if aws lambda create-function \
      --function-name "$FUNCTION_NAME" \
      --runtime python3.12 \
      --role "$ROLE_ARN" \
      --handler lambda_function.lambda_handler \
      --zip-file "fileb://$TMP_DIR/lambda.zip" \
      --timeout 10 \
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

cat > "$TMP_DIR/cors.json" <<'JSON'
{
  "AllowOrigins": [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://raagasudha-academy.github.io"
  ],
  "AllowMethods": ["POST", "OPTIONS"],
  "AllowHeaders": ["content-type"],
  "MaxAge": 86400
}
JSON

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  echo "Creating HTTP API: $API_NAME"
  API_ID="$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration "file://$TMP_DIR/cors.json" \
    --query ApiId \
    --output text \
    --region "$REGION")"
else
  echo "HTTP API already exists: $API_NAME ($API_ID)"
  aws apigatewayv2 update-api \
    --api-id "$API_ID" \
    --cors-configuration "file://$TMP_DIR/cors.json" \
    --region "$REGION" >/dev/null
fi

INTEGRATION_ID="$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" --query "Items[?IntegrationUri=='$FUNCTION_ARN'].IntegrationId | [0]" --output text)"

if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" = "None" ]; then
  INTEGRATION_ID="$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$FUNCTION_ARN" \
    --payload-format-version 2.0 \
    --timeout-in-millis 10000 \
    --query IntegrationId \
    --output text \
    --region "$REGION")"
fi

ROUTE_ID="$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" --query "Items[?RouteKey=='POST /registration'].RouteId | [0]" --output text)"

if [ -z "$ROUTE_ID" ] || [ "$ROUTE_ID" = "None" ]; then
  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key 'POST /registration' \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" >/dev/null
fi

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

STATEMENT_ID="AllowApiGatewayRegistration-${API_ID}"
SOURCE_ARN="arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/POST/registration"
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "$STATEMENT_ID" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "$SOURCE_ARN" \
  --region "$REGION" >/dev/null 2>&1 || true

API_ENDPOINT="$(aws apigatewayv2 get-api --api-id "$API_ID" --query ApiEndpoint --output text --region "$REGION")"

echo
echo "Registration backend deployed."
echo "Table:    $TABLE_NAME"
echo "Lambda:   $FUNCTION_NAME"
echo "API:      $API_NAME"
echo "Endpoint: ${API_ENDPOINT}/registration"
echo
echo "Set this in the website project:"
echo "VITE_REGISTRATION_API_URL=${API_ENDPOINT}/registration"
