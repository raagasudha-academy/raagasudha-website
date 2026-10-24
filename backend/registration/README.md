# Raaga Sudha student registration backend

This folder deploys a small serverless registration API:

Website -> API Gateway HTTP API -> Lambda -> DynamoDB

## Resources

- DynamoDB table: `raagasudha-student-registrations`
- Lambda: `raagasudha-student-registration`
- HTTP API: `raagasudha-student-registration-api`

The table uses `registrationId` (String) as its partition key and PAY_PER_REQUEST billing.
Point-in-time recovery is enabled by the deployment script.

## Deploy

Prerequisites: AWS CLI authenticated to the target account, plus `zip`.

```bash
cd backend/registration
./deploy.sh
```

The script prints a `VITE_REGISTRATION_API_URL=...` value at the end.
Put that value in `.env.local` for local testing. For GitHub Pages, add the same value as a GitHub Actions variable or secret and expose it to the Vite build.

## Data handling

The Lambda deliberately does not log form request bodies because registrations can contain health and allergy information. Validation is performed again on the server before any record is written.

Repeated submissions with the same browser `requestId` resolve to the same registration reference and do not create a second DynamoDB item.
