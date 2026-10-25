# Unified registration v2 setup

## What changes

The existing `/registration` entry point is retained, but the form becomes a unified intake for:

- an adult registering themselves;
- a parent/legal guardian registering one or more children;
- an adult registering themselves and one or more children together.

The current DynamoDB table `raagasudha-student-registrations` remains in place. Existing `schemaVersion: 1` items are not rewritten. New submissions are stored as `schemaVersion: 2`.

## Safe local application

Apply the patch locally first, then run:

```bash
npm run test:registration
npm run build
npm run dev
```

Do not deploy the backend until the v2 form and migration audit have been reviewed.

## Read-only AWS audit before deployment

```bash
cd backend/registration
python3 migration_audit.py --table raagasudha-student-registrations --region us-east-1
```

This performs no writes.

## Backend deployment after approval

The existing deployment script has been extended non-destructively. It reuses the existing DynamoDB table, creates/reuses a private encrypted photograph bucket, updates the existing Lambda, and adds the new API routes.

```bash
cd backend/registration
AWS_REGION=us-east-1 ./deploy.sh
```

Public routes:

```text
POST /registration
POST /registration/photo-upload
```

Sadhana/server-to-server routes use API Gateway `AWS_IAM` authorisation:

```text
GET    /admin/registrations
GET    /admin/registrations/{registrationId}
PATCH  /admin/registrations/{registrationId}
DELETE /admin/registrations/{registrationId}?mode=delete
GET    /admin/registrations/{registrationId}/photos/{personId}
```

See `backend/registration/REGISTRATION_V2_CONTRACT.md` for the import contract.

## Frontend environment

The frontend continues using the existing variable:

```text
VITE_REGISTRATION_API_URL=https://tc22v9iexa.execute-api.us-east-1.amazonaws.com/registration
```

No AWS credentials, Sadhana IDs or permanent student identifiers are generated or stored in the browser.

## Production rollout order

1. Apply and test the frontend/backend patch locally.
2. Run the read-only migration audit.
3. Review a sample v1 record and confirm it remains unchanged.
4. Deploy the backend only after approval.
5. Test v1 compatibility and v2 submissions against the deployed endpoint.
6. Push the website frontend to `main` only after backend verification.
7. Run one adult, one child-family and one multi-child production smoke test.

The public submission remains an application only; Sadhana creates permanent family/student identifiers, optional class enrolment and portal access after administrator review.
