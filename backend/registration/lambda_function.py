import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError

from registration_core import (
    IMPORT_STATUSES,
    PERSON_ID_RE,
    REQUEST_ID_RE,
    REVIEW_STATUSES,
    build_v1_item,
    build_v2_item,
    can_permanently_delete,
    clean_string,
    expected_photo_prefix,
    registration_id_for,
    registration_summary,
    validate_v1,
    validate_v2,
)

TABLE_NAME = os.environ["TABLE_NAME"]
PHOTO_BUCKET = os.environ.get("PHOTO_BUCKET", "")
ALLOWED_ORIGINS = {
    value.strip()
    for value in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if value.strip()
}

ALLOWED_PHOTO_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_PHOTO_BYTES = 5 * 1024 * 1024

table = boto3.resource("dynamodb").Table(TABLE_NAME)
s3 = boto3.client("s3")


def _json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def response(status_code, body=None):
    result = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    }
    if status_code == 204:
        result["body"] = ""
    else:
        result["body"] = json.dumps(body or {}, default=_json_default)
    return result


def _origin(event):
    headers = event.get("headers") or {}
    return headers.get("origin") or headers.get("Origin")


def _public_origin_allowed(event):
    origin = _origin(event)
    return not origin or not ALLOWED_ORIGINS or origin in ALLOWED_ORIGINS


def _body(event):
    try:
        value = json.loads(event.get("body") or "{}")
    except (TypeError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def _route_key(event):
    route_key = event.get("routeKey")
    if route_key:
        return route_key
    request_context = event.get("requestContext") or {}
    http = request_context.get("http") or {}
    method = http.get("method") or "POST"
    path = event.get("rawPath") or http.get("path") or "/registration"
    return f"{method} {path}"


def _honeypot_response(payload):
    if not clean_string(payload.get("website"), 200):
        return None
    request_id = clean_string(payload.get("requestId"), 128) or "bot-submission"
    year = datetime.now(timezone.utc).year
    return response(
        201,
        {
            "registrationId": registration_id_for(request_id, year),
            "status": "SUBMITTED",
        },
    )



def _photo_magic_matches(content_type, head):
    if content_type == "image/jpeg":
        return head.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return head.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP"
    return False


def _validate_uploaded_photos(cleaned):
    errors = {}
    if not PHOTO_BUCKET:
        if any(student.get("photo") for student in cleaned.get("students", [])):
            errors["photos"] = "Photograph storage is not configured."
        return errors

    for index, student in enumerate(cleaned.get("students", [])):
        photo = student.get("photo")
        if not isinstance(photo, dict) or not photo.get("storageKey"):
            continue
        key = photo["storageKey"]
        declared_type = photo.get("contentType")
        try:
            metadata = s3.head_object(Bucket=PHOTO_BUCKET, Key=key)
            content_length = int(metadata.get("ContentLength") or 0)
            if content_length > MAX_PHOTO_BYTES:
                errors[f"students.{index}.photo"] = "Photograph is larger than 5 MB."
                continue
            if metadata.get("ContentType") != declared_type:
                errors[f"students.{index}.photo"] = "Photograph content type does not match the upload."
                continue
            obj = s3.get_object(Bucket=PHOTO_BUCKET, Key=key, Range="bytes=0-31")
            head = obj["Body"].read(32)
            if not _photo_magic_matches(declared_type, head):
                errors[f"students.{index}.photo"] = "Photograph file contents are not a supported image."
                continue
            # Replace client-supplied upload metadata with trusted S3 metadata.
            photo["fileSize"] = content_length
            photo["contentType"] = metadata.get("ContentType")
            last_modified = metadata.get("LastModified")
            if last_modified:
                photo["uploadedAt"] = last_modified.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            s3.put_object_tagging(
                Bucket=PHOTO_BUCKET,
                Key=key,
                Tagging={"TagSet": [{"Key": "state", "Value": "submitted"}]},
            )
        except ClientError:
            errors[f"students.{index}.photo"] = "Photograph upload could not be verified."
    return errors

def handle_registration_submit(event):
    if not _public_origin_allowed(event):
        return response(403, {"message": "Origin not allowed."})

    payload = _body(event)
    if payload is None:
        return response(400, {"message": "Invalid request body."})

    bot_response = _honeypot_response(payload)
    if bot_response:
        return bot_response

    schema_version = payload.get("schemaVersion")
    if schema_version == 2:
        errors, cleaned = validate_v2(payload)
        builder = build_v2_item
    else:
        # Backward compatible with the original single-student form and cached clients.
        errors, cleaned = validate_v1(payload)
        builder = build_v1_item

    if not errors and schema_version == 2:
        errors.update(_validate_uploaded_photos(cleaned))

    if errors:
        return response(
            400,
            {
                "message": "Please check the highlighted fields.",
                "fieldErrors": errors,
            },
        )

    item = builder(cleaned)
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(registrationId)",
        )
        return response(
            201,
            {
                "registrationId": item["registrationId"],
                "status": "SUBMITTED",
                "schemaVersion": item.get("schemaVersion", 1),
            },
        )
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")
        if code == "ConditionalCheckFailedException":
            return response(
                200,
                {
                    "registrationId": item["registrationId"],
                    "status": "SUBMITTED",
                    "schemaVersion": item.get("schemaVersion", 1),
                    "duplicate": True,
                },
            )

        # Never print the request body or item; health/allergy data may be present.
        print(f"Registration write failed: {code or 'UnknownError'}")
        return response(
            500,
            {"message": "Registration could not be saved. Please try again."},
        )


def handle_photo_upload(event):
    if not _public_origin_allowed(event):
        return response(403, {"message": "Origin not allowed."})
    if not PHOTO_BUCKET:
        return response(503, {"message": "Photograph upload is not configured."})

    payload = _body(event)
    if payload is None:
        return response(400, {"message": "Invalid request body."})

    request_id = clean_string(payload.get("requestId"), 128)
    person_id = clean_string(payload.get("personId"), 110)
    content_type = clean_string(payload.get("contentType"), 80)
    file_name = clean_string(payload.get("fileName"), 180)
    try:
        file_size = int(payload.get("fileSize") or 0)
    except (TypeError, ValueError):
        file_size = 0

    if not REQUEST_ID_RE.fullmatch(request_id):
        return response(400, {"message": "Invalid submission identifier."})
    if not PERSON_ID_RE.fullmatch(person_id):
        return response(400, {"message": "Invalid student identifier."})
    extension = ALLOWED_PHOTO_TYPES.get(content_type)
    if not extension:
        return response(400, {"message": "Photograph must be JPEG, PNG or WebP."})
    if file_size < 1 or file_size > MAX_PHOTO_BYTES:
        return response(400, {"message": "Photograph must be 5 MB or smaller."})

    storage_key = f"{expected_photo_prefix(request_id, person_id)}{uuid4().hex}.{extension}"
    try:
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": PHOTO_BUCKET,
                "Key": storage_key,
                "ContentType": content_type,
                "Tagging": "state=unsubmitted",
            },
            ExpiresIn=600,
        )
    except ClientError:
        return response(500, {"message": "Photograph upload could not be prepared."})

    return response(
        200,
        {
            "uploadUrl": upload_url,
            "storageKey": storage_key,
            "expiresIn": 600,
        },
    )


def _scan_registration_summaries(event):
    query = event.get("queryStringParameters") or {}
    wanted_status = clean_string(query.get("status"), 30)
    wanted_location = clean_string(query.get("locationId"), 80)
    date_from = clean_string(query.get("from"), 30)
    date_to = clean_string(query.get("to"), 30)
    try:
        limit = max(1, min(int(query.get("limit") or 100), 250))
    except ValueError:
        limit = 100

    # This route is AWS_IAM protected. The list response deliberately excludes
    # allergy, medical, photograph and detailed contact fields.
    scan_kwargs = {
        "ProjectionExpression": (
            "registrationId,schemaVersion,registrationType,reviewStatus,submittedAt,"
            "preferredLocationId,primaryContactPersonId,studentPersonIds,people,"
            "parentGuardian,student,sadhanaImport,#s,review"
        ),
        "ExpressionAttributeNames": {"#s": "status"},
    }
    summaries = []
    last_key = None
    scanned = 0
    while True:
        if last_key:
            scan_kwargs["ExclusiveStartKey"] = last_key
        result = table.scan(**scan_kwargs)
        batch = [registration_summary(item) for item in result.get("Items", [])]
        scanned += len(batch)
        summaries.extend(batch)
        last_key = result.get("LastEvaluatedKey")
        if not last_key or scanned >= 1000:
            break

    if wanted_status:
        summaries = [item for item in summaries if item.get("reviewStatus") == wanted_status]
    if wanted_location:
        summaries = [item for item in summaries if item.get("preferredLocationId") == wanted_location]
    if date_from:
        summaries = [item for item in summaries if (item.get("submittedAt") or "") >= date_from]
    if date_to:
        summaries = [item for item in summaries if (item.get("submittedAt") or "") <= date_to]

    summaries.sort(key=lambda item: item.get("submittedAt") or "", reverse=True)
    return response(200, {"registrations": summaries[:limit]})


def _get_registration(registration_id):
    result = table.get_item(Key={"registrationId": registration_id}, ConsistentRead=True)
    return result.get("Item")


def handle_admin_get_one(event):
    registration_id = clean_string((event.get("pathParameters") or {}).get("registrationId"), 80)
    item = _get_registration(registration_id)
    if not item:
        return response(404, {"message": "Registration not found."})
    return response(200, {"registration": item})


def handle_admin_update(event):
    registration_id = clean_string((event.get("pathParameters") or {}).get("registrationId"), 80)
    payload = _body(event)
    if payload is None:
        return response(400, {"message": "Invalid request body."})

    item = _get_registration(registration_id)
    if not item:
        return response(404, {"message": "Registration not found."})

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    if "reviewStatus" in payload:
        review_status = clean_string(payload.get("reviewStatus"), 30)
        if review_status not in REVIEW_STATUSES:
            return response(400, {"message": "Invalid review status."})
        reviewer = clean_string(payload.get("reviewer"), 160)
        item["reviewStatus"] = review_status
        item["review"] = {
            "status": review_status,
            "reviewedBy": reviewer or None,
            "reviewedAt": now,
        }

    if "sadhanaImport" in payload:
        requested = payload.get("sadhanaImport")
        if not isinstance(requested, dict):
            return response(400, {"message": "Invalid import status."})
        import_status = clean_string(requested.get("status"), 30)
        if import_status not in IMPORT_STATUSES:
            return response(400, {"message": "Invalid import status."})

        existing = item.get("sadhanaImport") if isinstance(item.get("sadhanaImport"), dict) else {}
        student_ids = requested.get("studentIds") if isinstance(requested.get("studentIds"), dict) else existing.get("studentIds") or {}
        valid_person_ids = set(item.get("studentPersonIds") or [])
        if valid_person_ids and any(person_id not in valid_person_ids for person_id in student_ids):
            return response(400, {"message": "Import mapping contains an unknown student person identifier."})

        item["sadhanaImport"] = {
            "status": import_status,
            "familyId": clean_string(requested.get("familyId"), 120) or existing.get("familyId"),
            "studentIds": {clean_string(k, 110): clean_string(v, 120) for k, v in student_ids.items()},
            "importedAt": now if import_status == "imported" else existing.get("importedAt"),
            "lastAttemptAt": now,
            "errorCode": clean_string(requested.get("errorCode"), 120) or None,
        }

    item["updatedAt"] = now
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_exists(registrationId)",
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return response(404, {"message": "Registration not found."})
        return response(500, {"message": "Registration could not be updated."})

    return response(200, {"registration": item})


def handle_admin_photo(event):
    if not PHOTO_BUCKET:
        return response(503, {"message": "Photograph storage is not configured."})
    params = event.get("pathParameters") or {}
    registration_id = clean_string(params.get("registrationId"), 80)
    person_id = clean_string(params.get("personId"), 110)
    item = _get_registration(registration_id)
    if not item:
        return response(404, {"message": "Registration not found."})

    photo = None
    for student in item.get("students") or []:
        if student.get("personId") == person_id:
            photo = student.get("photo")
            break
    if not isinstance(photo, dict) or not photo.get("storageKey"):
        return response(404, {"message": "Student photograph not found."})

    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": PHOTO_BUCKET, "Key": photo["storageKey"]},
            ExpiresIn=300,
        )
    except ClientError:
        return response(500, {"message": "Photograph could not be retrieved."})
    return response(200, {"downloadUrl": url, "expiresIn": 300})


def handle_admin_delete(event):
    registration_id = clean_string((event.get("pathParameters") or {}).get("registrationId"), 80)
    query = event.get("queryStringParameters") or {}
    if query.get("mode") != "delete":
        return response(400, {"message": "Permanent deletion requires mode=delete."})

    item = _get_registration(registration_id)
    if not item:
        return response(404, {"message": "Registration not found."})

    allowed, reason = can_permanently_delete(item)
    if not allowed:
        return response(409, {"message": reason})

    photo_keys = []
    for student in item.get("students") or []:
        photo = student.get("photo") if isinstance(student, dict) else None
        if isinstance(photo, dict) and photo.get("storageKey"):
            photo_keys.append(photo["storageKey"])

    try:
        table.delete_item(
            Key={"registrationId": registration_id},
            ConditionExpression="attribute_exists(registrationId)",
        )
        for key in photo_keys:
            if PHOTO_BUCKET:
                s3.delete_object(Bucket=PHOTO_BUCKET, Key=key)
    except ClientError:
        return response(500, {"message": "Registration could not be permanently deleted."})

    return response(204)


def lambda_handler(event, context):
    # Do not log event/request bodies here: registrations may contain health data.
    route = _route_key(event)

    if route == "POST /registration":
        return handle_registration_submit(event)
    if route == "POST /registration/photo-upload":
        return handle_photo_upload(event)

    # All /admin routes are configured with API Gateway AWS_IAM authorisation.
    if route == "GET /admin/registrations":
        return _scan_registration_summaries(event)
    if route == "GET /admin/registrations/{registrationId}":
        return handle_admin_get_one(event)
    if route == "PATCH /admin/registrations/{registrationId}":
        return handle_admin_update(event)
    if route == "DELETE /admin/registrations/{registrationId}":
        return handle_admin_delete(event)
    if route == "GET /admin/registrations/{registrationId}/photos/{personId}":
        return handle_admin_photo(event)

    return response(404, {"message": "Not found."})
