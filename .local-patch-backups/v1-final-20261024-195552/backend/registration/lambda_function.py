import hashlib
import json
import os
import re
from datetime import date, datetime, timezone

import boto3
from botocore.exceptions import ClientError

TABLE_NAME = os.environ["TABLE_NAME"]
ALLOWED_ORIGINS = {
    value.strip()
    for value in os.environ.get("ALLOWED_ORIGINS", "").split(",")
    if value.strip()
}

table = boto3.resource("dynamodb").Table(TABLE_NAME)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^[+0-9()\-\s]{7,25}$")
REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body),
    }


def clean_string(value, max_length):
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]


def parse_bool(value):
    return value is True


def age_on_today(date_of_birth):
    today = date.today()
    age = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


def validate(payload):
    errors = {}

    request_id = clean_string(payload.get("requestId"), 128)
    student_name = clean_string(payload.get("studentName"), 120)
    dob_raw = clean_string(payload.get("dateOfBirth"), 10)
    guardian_name = clean_string(payload.get("parentGuardianName"), 120)
    contact_number = clean_string(payload.get("contactNumber"), 25)
    email = clean_string(payload.get("email"), 254).lower()
    signed_by = clean_string(payload.get("signedBy"), 120)

    if not REQUEST_ID_RE.fullmatch(request_id):
        errors["requestId"] = "Invalid submission identifier."

    if len(student_name) < 2:
        errors["studentName"] = "Please enter the student name."

    parsed_dob = None
    try:
        parsed_dob = date.fromisoformat(dob_raw)
        if parsed_dob > date.today():
            errors["dateOfBirth"] = "Date of birth cannot be in the future."
        elif parsed_dob.year < date.today().year - 110:
            errors["dateOfBirth"] = "Please check the date of birth."
    except ValueError:
        errors["dateOfBirth"] = "Please enter a valid date of birth."

    is_minor = parsed_dob is not None and age_on_today(parsed_dob) < 18
    if is_minor and len(guardian_name) < 2:
        errors["parentGuardianName"] = "Please enter the parent or guardian name."

    if not PHONE_RE.fullmatch(contact_number):
        errors["contactNumber"] = "Please enter a valid contact number."

    if not EMAIL_RE.fullmatch(email):
        errors["email"] = "Please enter a valid email address."

    health = payload.get("healthCondition")
    if not isinstance(health, dict):
        health = {}
    has_condition = parse_bool(health.get("hasCondition"))
    health_details = clean_string(health.get("details"), 1500)
    if has_condition and len(health_details) < 2:
        errors["healthConditionDetails"] = "Please provide the relevant health information."

    allergies = payload.get("foodAllergies")
    if not isinstance(allergies, dict):
        allergies = {}
    has_allergies = parse_bool(allergies.get("hasAllergies"))
    allergy_details = clean_string(allergies.get("details"), 1500)
    if has_allergies and len(allergy_details) < 2:
        errors["foodAllergyDetails"] = "Please provide the relevant allergy information."

    enrolment_accepted = parse_bool(payload.get("enrolmentAccepted"))
    information_accurate = parse_bool(payload.get("informationAccurate"))

    if not enrolment_accepted:
        errors["enrolmentAccepted"] = "Please confirm that you wish to enrol."
    if not information_accurate:
        errors["informationAccurate"] = "Please confirm that the information is accurate."
    if len(signed_by) < 2:
        errors["signedBy"] = "Please type your full name."

    return errors, {
        "requestId": request_id,
        "studentName": student_name,
        "dateOfBirth": dob_raw,
        "isMinor": is_minor,
        "parentGuardianName": guardian_name,
        "contactNumber": contact_number,
        "email": email,
        "healthCondition": {
            "hasCondition": has_condition,
            "details": health_details if has_condition else "",
        },
        "foodAllergies": {
            "hasAllergies": has_allergies,
            "details": allergy_details if has_allergies else "",
        },
        "enrolmentAccepted": enrolment_accepted,
        "informationAccurate": information_accurate,
        "signedBy": signed_by,
    }


def registration_id_for(request_id, year):
    digest = hashlib.sha256(request_id.encode("utf-8")).hexdigest()[:6].upper()
    return f"RS-{year}-{digest}"


def lambda_handler(event, context):
    # Do not log request bodies here: registrations may contain health information.
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")

    if origin and ALLOWED_ORIGINS and origin not in ALLOWED_ORIGINS:
        return response(403, {"message": "Origin not allowed."})

    try:
        raw_body = event.get("body") or "{}"
        payload = json.loads(raw_body)
    except (TypeError, json.JSONDecodeError):
        return response(400, {"message": "Invalid request body."})

    if not isinstance(payload, dict):
        return response(400, {"message": "Invalid request body."})

    request_id = clean_string(payload.get("requestId"), 128)

    # Honeypot: return a normal-looking response but do not retain the submission.
    if clean_string(payload.get("website"), 200):
        year = datetime.now(timezone.utc).year
        fake_id = registration_id_for(request_id or "bot-submission", year)
        return response(201, {"registrationId": fake_id, "status": "SUBMITTED"})

    errors, cleaned = validate(payload)
    if errors:
        return response(
            400,
            {
                "message": "Please check the highlighted fields.",
                "fieldErrors": errors,
            },
        )

    now = datetime.now(timezone.utc)
    submitted_at = now.isoformat().replace("+00:00", "Z")
    registration_id = registration_id_for(cleaned["requestId"], now.year)

    item = {
        "registrationId": registration_id,
        "institution": "RAAGASUDHA",
        "status": "SUBMITTED",
        "student": {
            "name": cleaned["studentName"],
            "dateOfBirth": cleaned["dateOfBirth"],
            "isMinorAtSubmission": cleaned["isMinor"],
        },
        "parentGuardian": {
            "name": cleaned["parentGuardianName"],
        },
        "contact": {
            "phone": cleaned["contactNumber"],
            "email": cleaned["email"],
        },
        "health": {
            "conditions": cleaned["healthCondition"],
            "foodAllergies": cleaned["foodAllergies"],
        },
        "declaration": {
            "enrolmentAccepted": cleaned["enrolmentAccepted"],
            "informationAccurate": cleaned["informationAccurate"],
            "signedBy": cleaned["signedBy"],
            "acceptedAt": submitted_at,
            "version": "2026-10-24",
        },
        "requestId": cleaned["requestId"],
        "source": "RAAGASUDHA_WEBSITE",
        "submittedAt": submitted_at,
        "updatedAt": submitted_at,
        "schemaVersion": 1,
    }

    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(registrationId)",
        )
        return response(
            201,
            {
                "registrationId": registration_id,
                "status": "SUBMITTED",
            },
        )
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code")

        if code == "ConditionalCheckFailedException":
            # A retry with the same client requestId is idempotent.
            return response(
                200,
                {
                    "registrationId": registration_id,
                    "status": "SUBMITTED",
                    "duplicate": True,
                },
            )

        # Keep errors generic and avoid emitting registration data to logs.
        print(f"Registration write failed: {code or 'UnknownError'}")
        return response(
            500,
            {"message": "Registration could not be saved. Please try again."},
        )
