# Raaga Sudha unified registration backend

This folder extends the existing registration service in place:

`Website -> API Gateway HTTP API -> Lambda -> existing DynamoDB table`

New v2 photograph flow:

`Website -> presigned upload request -> private S3 PUT`

Sadhana integration:

`Sadhana backend -> AWS_IAM protected admin routes -> registration Lambda`

## Existing resources retained

- DynamoDB table: `raagasudha-student-registrations`
- Partition key: `registrationId` (String)
- Lambda: `raagasudha-student-registration`
- HTTP API: `raagasudha-student-registration-api`

The deployment script reuses the existing table and enables/retains point-in-time recovery. It does **not** replace or delete legacy records.

Legacy cached clients can still submit the original v1 payload. New website registrations send `schemaVersion: 2`.

## New v2 capabilities

- adult registration;
- parent/guardian + multiple children;
- adult + children in one application;
- stable `personId` values and explicit guardian-child relationships;
- independent child contact/address inheritance;
- per-student location/course/start-date preferences;
- required explicit per-student food-allergy state;
- optional per-student private photograph;
- emergency contacts and explicit media/privacy consent;
- review/import lifecycle fields;
- AWS_IAM protected Sadhana integration API;
- discard vs permanent intake deletion safeguards.

See `REGISTRATION_V2_CONTRACT.md` for the Sadhana contract.

## Sensitive data protections

- Request bodies are not logged.
- DynamoDB uses AWS encryption at rest and point-in-time recovery.
- Photograph objects use a private S3 bucket with public access blocked and default encryption enabled.
- The bucket policy rejects non-TLS access.
- Photograph upload uses short-lived presigned PUT URLs.
- Unsubmitted/orphaned photograph uploads expire after 7 days; accepted uploads are retained as submitted intake files.
- Admin applicant/read/photo routes use API Gateway `AWS_IAM` authorisation.
- List responses exclude allergy, medical and photo details.
- Permanent intake deletion is refused after import and for approved submissions.

## Read-only migration audit

Before deploying v2, inspect the existing table without changing it:

```bash
cd backend/registration
python3 migration_audit.py --table raagasudha-student-registrations --region us-east-1
```

The script reports schema-version counts only. No backfill is required for v2 because the Lambda continues to read/accept v1 records without rewriting them.

## Tests

From the repository root:

```bash
npm run test:registration
```

This runs frontend model tests and backend acceptance tests.

Backend only:

```bash
python3 -m unittest discover -s backend/registration -p 'test_*.py'
```

## Deployment

**Do not run this until the patch has been reviewed and approved.**

```bash
cd backend/registration
AWS_REGION=us-east-1 ./deploy.sh
```

The script preserves the existing DynamoDB table, creates/reuses the private photograph bucket, updates the Lambda, and adds the new public photo-presign route plus AWS_IAM protected admin routes.

The website setting remains:

```text
VITE_REGISTRATION_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/registration
```

No Sadhana family ID, student roll number, Cognito account or portal access is created by the public registration endpoint.
