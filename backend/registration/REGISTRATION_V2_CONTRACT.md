# Raaga Sudha Registration v2 — Sadhana Integration Contract

## Scope

The public Raaga Sudha website is an **intake source only**. A submitted application does not create a permanent Sadhana family, student number, roll number, Cognito account, portal permission, or active class enrolment.

The existing DynamoDB table `raagasudha-student-registrations` remains the source of intake records. Legacy `schemaVersion: 1` records remain unchanged and readable. New unified submissions use `schemaVersion: 2`.

## Stable external keys

Sadhana must retain these source identifiers on import:

- `registrationId` — stable external application key.
- `personId` — stable external person/student key within the application.

A Sadhana import should use conditional writes / uniqueness checks on those source keys. Re-running an import for the same `registrationId` + `personId` must update/reconcile the same student rather than create a duplicate.

## v2 item shape

A v2 DynamoDB item contains:

- submission metadata: `registrationId`, `requestId`, `schemaVersion`, `registrationType`, `submittedAt`, `updatedAt`;
- lifecycle: `reviewStatus`, `review`, `sadhanaImport`;
- people: `people[]`, with one person allowed to have multiple roles (for example `guardian` + `student`);
- family links: `relationships[]`, always initially `verificationStatus: unverified`;
- student intake: `students[]`, keyed by each student's `personId`;
- per-student contact inheritance sources, class preferences, food allergy record, optional health/support notes and optional private photograph reference;
- submission-level emergency contact, privacy acknowledgement, media consent and declaration.

Inherited guardian contact details are **not copied** into a child's own email/phone/address fields. `students[].contactPreferences` records the source and guardian reference.

## Review/import lifecycle

Review status values:

- `pending`
- `under_review`
- `approved`
- `discarded`

Import status values:

- `not-imported`
- `importing`
- `imported`
- `error`

Review status and import status are deliberately independent. An approved application can remain `not-imported` or move to `error` and be retried without creating duplicate Sadhana records.

## Private admin API

All routes below are configured with API Gateway `AWS_IAM` authorisation and are intended for Sadhana/server-to-server use. The public website has no list/read endpoint for applicants.

### List registrations

`GET /admin/registrations`

Optional query parameters:

- `status`
- `locationId`
- `from`
- `to`
- `limit`

The list response is a summary and deliberately excludes health/allergy detail and photograph URLs.

### Retrieve one full registration

`GET /admin/registrations/{registrationId}`

Returns the full versioned intake item to an authorised caller.

### Update review/import state

`PATCH /admin/registrations/{registrationId}`

Example review body:

```json
{
  "reviewStatus": "approved",
  "reviewer": "sadhana-admin-user-id"
}
```

Example import body:

```json
{
  "sadhanaImport": {
    "status": "imported",
    "familyId": "FAMILY-123",
    "studentIds": {
      "PERSON-...": "STUDENT-456"
    }
  }
}
```

The mapping keys must be `personId` values already present in the source registration.

### Retrieve a student photograph

`GET /admin/registrations/{registrationId}/photos/{personId}`

Returns a short-lived presigned GET URL only when that student's private photo reference exists.

### Discard

Use the review update endpoint with:

```json
{
  "reviewStatus": "discarded",
  "reviewer": "sadhana-admin-user-id"
}
```

This keeps the intake record for audit/retention purposes and does not create a Sadhana student.

### Discard and permanently delete intake data

`DELETE /admin/registrations/{registrationId}?mode=delete`

Permanent deletion removes the intake DynamoDB item and intake-only photographs. It is rejected when the registration has already been imported, or when its review state is approved, so deleting an intake record cannot automatically delete an approved Sadhana student.

## Photograph storage

New photographs are stored in a dedicated private S3 bucket. Public access is blocked, default encryption at rest is enabled, insecure transport is denied, and the browser can upload only through a short-lived presigned PUT URL.

The public upload handshake is:

1. `POST /registration/photo-upload` with `requestId`, `personId`, file type/size.
2. API validates JPEG/PNG/WebP and maximum 5 MB.
3. API returns a 10-minute presigned private S3 PUT URL and opaque storage key.
4. Browser uploads directly to S3 with an `unsubmitted` object tag.
5. Final registration POST verifies the real object size, content type and image signature, then marks the object `submitted`.
6. Unsubmitted/orphaned intake uploads expire automatically after 7 days; submitted images remain private until the reviewed retention/delete workflow removes them.

No public image URL is stored in DynamoDB.

## Legacy compatibility

`schemaVersion: 1` records are not rewritten by this upgrade. The private list/read layer recognises and returns them. Their missing information is not invented; legacy allergy/health values remain exactly as collected by the original form.

No backfill is required for the public v2 launch. Run `migration_audit.py` before deployment to inventory schema versions and confirm legacy counts. Any later data backfill should be a separately reviewed operation.
