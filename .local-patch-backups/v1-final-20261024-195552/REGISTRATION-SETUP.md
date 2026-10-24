# Student registration feature

## Branch

Recommended branch:

```bash
git checkout -b feature/student-registration
```

## Local UI preview

The registration page is available at:

```text
/registration
```

You can view and validate the form without the AWS backend. Submitting requires `VITE_REGISTRATION_API_URL`.

## Backend

Deploy the AWS resources:

```bash
cd backend/registration
./deploy.sh
```

Copy the endpoint printed by the script into a root `.env.local` file:

```text
VITE_REGISTRATION_API_URL=https://...execute-api.../registration
```

Restart `npm run dev` after changing `.env.local`.

## Production GitHub Pages build

The GitHub Actions workflow must provide `VITE_REGISTRATION_API_URL` at build time. The supplied project update adds it from the GitHub repository variable named `VITE_REGISTRATION_API_URL`.

Repository Settings -> Secrets and variables -> Actions -> Variables -> New repository variable.

Name:

```text
VITE_REGISTRATION_API_URL
```

Value: the endpoint printed by `backend/registration/deploy.sh`.

## DynamoDB item shape

Each registration stores:

- registrationId
- institution and status
- student name / DOB / minor-at-submission flag
- parent or guardian name
- contact phone and email
- health conditions and food allergies
- declaration acknowledgements and typed signatory name
- submitted/updated timestamps
- requestId, source, and schemaVersion

No AWS credentials are placed in the React application.
