import hashlib
import re
from datetime import date, datetime, timezone

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
LEGACY_PHONE_RE = re.compile(r"^[+0-9()\-\s]{7,25}$")
E164_PHONE_RE = re.compile(r"^\+[1-9]\d{7,14}$")
REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{8,128}$")
PERSON_ID_RE = re.compile(r"^PERSON-[A-Za-z0-9-]{8,96}$")

LOCATION_IDS = {
    "LOC-NEWCASTLE",
    "LOC-DURHAM",
    "LOC-MIDDLESBROUGH",
    "LOC-ONLINE",
}
COURSE_IDS = {"COURSE-CARNATIC-VOCAL"}
REGISTRATION_TYPES = {"adult", "children", "adult-and-children"}
ALLERGY_STATUSES = {"none", "yes", "unknown"}
ALLERGENS = {
    "Peanuts", "Tree nuts", "Milk", "Eggs", "Wheat", "Soy",
    "Fish", "Shellfish", "Sesame", "Other",
}
REVIEW_STATUSES = {"pending", "under_review", "approved", "discarded"}
IMPORT_STATUSES = {"not-imported", "importing", "imported", "error"}
PERSON_ROLES = {"applicant", "guardian", "student"}


def strip_location_prefix(location_id):
    """Store location ids without their LOC- prefix in the database."""
    if isinstance(location_id, str) and location_id.startswith("LOC-"):
        return location_id[len("LOC-"):]
    return location_id


def add_location_prefix(location_id):
    """Restore the LOC- prefix when reading location ids back out of the database."""
    if isinstance(location_id, str) and location_id and not location_id.startswith("LOC-"):
        return f"LOC-{location_id}"
    return location_id


def clean_string(value, max_length=500):
    if not isinstance(value, str):
        return ""
    value = "".join(ch for ch in value if ch >= " " or ch in "\t\n")
    return value.strip()[:max_length]


def parse_bool(value):
    return value is True


def clean_international_phone(value):
    raw = clean_string(value, 40)
    return re.sub(r"[\s()\-]", "", raw)


def age_on_today(date_of_birth, today=None):
    today = today or date.today()
    age = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


def parse_date(value):
    try:
        return date.fromisoformat(clean_string(value, 10))
    except ValueError:
        return None


def iso_now(now=None):
    now = now or datetime.now(timezone.utc)
    return now.isoformat().replace("+00:00", "Z")


def registration_id_for(request_id, year):
    digest = hashlib.sha256(request_id.encode("utf-8")).hexdigest()[:6].upper()
    return f"RS-{year}-{digest}"


def request_storage_token(request_id):
    return hashlib.sha256(request_id.encode("utf-8")).hexdigest()[:24]


def expected_photo_prefix(request_id, person_id):
    return f"intake/requests/{request_storage_token(request_id)}/{person_id}/"


def _clean_address(value):
    value = value if isinstance(value, dict) else {}
    return {
        "line1": clean_string(value.get("line1"), 180),
        "line2": clean_string(value.get("line2"), 180),
        "town": clean_string(value.get("town"), 100),
        "county": clean_string(value.get("county"), 100),
        "postcode": clean_string(value.get("postcode"), 20).upper(),
        "country": clean_string(value.get("country"), 2).upper() or "GB",
    }


def _clean_photo(value, request_id, person_id, errors, path):
    if value in (None, ""):
        return None
    if not isinstance(value, dict):
        errors[f"{path}.photo"] = "Invalid photograph reference."
        return None

    storage_key = clean_string(value.get("storageKey"), 512)
    content_type = clean_string(value.get("contentType"), 80)
    file_name = clean_string(value.get("fileName"), 180)
    try:
        file_size = int(value.get("fileSize") or 0)
    except (TypeError, ValueError):
        file_size = 0

    if not storage_key.startswith(expected_photo_prefix(request_id, person_id)):
        errors[f"{path}.photo"] = "Invalid photograph storage reference."
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        errors[f"{path}.photo"] = "Invalid photograph type."
    if file_size < 1 or file_size > 5 * 1024 * 1024:
        errors[f"{path}.photo"] = "Invalid photograph size."

    return {
        "storageKey": storage_key,
        "contentType": content_type,
        "fileName": file_name,
        "fileSize": file_size,
        "uploadedAt": clean_string(value.get("uploadedAt"), 40),
    }


def validate_v1(payload):
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

    parsed_dob = parse_date(dob_raw)
    if parsed_dob is None:
        errors["dateOfBirth"] = "Please enter a valid date of birth."
    elif parsed_dob > date.today():
        errors["dateOfBirth"] = "Date of birth cannot be in the future."
    elif parsed_dob.year < date.today().year - 110:
        errors["dateOfBirth"] = "Please check the date of birth."

    is_minor = parsed_dob is not None and age_on_today(parsed_dob) < 18
    if is_minor and len(guardian_name) < 2:
        errors["parentGuardianName"] = "Please enter the parent or guardian name."
    if not LEGACY_PHONE_RE.fullmatch(contact_number):
        errors["contactNumber"] = "Please enter a valid contact number."
    if not EMAIL_RE.fullmatch(email):
        errors["email"] = "Please enter a valid email address."

    health = payload.get("healthCondition") if isinstance(payload.get("healthCondition"), dict) else {}
    has_condition = parse_bool(health.get("hasCondition"))
    health_details = clean_string(health.get("details"), 1500)
    if has_condition and len(health_details) < 2:
        errors["healthConditionDetails"] = "Please provide the relevant health information."

    allergies = payload.get("foodAllergies") if isinstance(payload.get("foodAllergies"), dict) else {}
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
        "healthCondition": {"hasCondition": has_condition, "details": health_details if has_condition else ""},
        "foodAllergies": {"hasAllergies": has_allergies, "details": allergy_details if has_allergies else ""},
        "enrolmentAccepted": enrolment_accepted,
        "informationAccurate": information_accurate,
        "signedBy": signed_by,
    }


def build_v1_item(cleaned, now=None):
    now = now or datetime.now(timezone.utc)
    submitted_at = iso_now(now)
    registration_id = registration_id_for(cleaned["requestId"], now.year)
    return {
        "registrationId": registration_id,
        "institution": "RAAGASUDHA",
        "status": "SUBMITTED",
        "student": {
            "name": cleaned["studentName"],
            "dateOfBirth": cleaned["dateOfBirth"],
            "isMinorAtSubmission": cleaned["isMinor"],
        },
        "parentGuardian": {"name": cleaned["parentGuardianName"]},
        "contact": {"phone": cleaned["contactNumber"], "email": cleaned["email"]},
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


def _clean_person(raw, errors, path):
    if not isinstance(raw, dict):
        errors[path] = "Invalid person record."
        return None
    person_id = clean_string(raw.get("personId"), 110)
    full_name = clean_string(raw.get("fullName"), 120)
    dob = clean_string(raw.get("dateOfBirth"), 10) or None
    gender = clean_string(raw.get("gender"), 40) or None
    email = clean_string(raw.get("email"), 254).lower()
    phone = clean_international_phone(raw.get("phone"))
    raw_roles = raw.get("roles") if isinstance(raw.get("roles"), list) else []
    normalised_roles = [clean_string(value, 30) for value in raw_roles if clean_string(value, 30)]
    if any(value not in PERSON_ROLES for value in normalised_roles):
        errors[f"{path}.roles"] = "Invalid person role."
    roles = sorted({value for value in normalised_roles if value in PERSON_ROLES})

    if not PERSON_ID_RE.fullmatch(person_id):
        errors[f"{path}.personId"] = "Invalid person identifier."
    if len(full_name) < 2:
        errors[f"{path}.fullName"] = "Please enter a full legal name."
    if dob:
        parsed = parse_date(dob)
        if parsed is None or parsed > date.today():
            errors[f"{path}.dateOfBirth"] = "Please enter a valid date of birth."
    if email and not EMAIL_RE.fullmatch(email):
        errors[f"{path}.email"] = "Please enter a valid email address."
    if phone and not E164_PHONE_RE.fullmatch(phone):
        errors[f"{path}.phone"] = "Enter a valid international phone number beginning with + and the country code."

    return {
        "personId": person_id,
        "fullName": full_name,
        "dateOfBirth": dob,
        "gender": gender,
        "email": email,
        "phone": phone,
        "address": _clean_address(raw.get("address")),
        "roles": roles,
    }


def _clean_allergy(raw, errors, path):
    raw = raw if isinstance(raw, dict) else {}
    status = clean_string(raw.get("status"), 20)
    if status not in ALLERGY_STATUSES:
        errors[f"{path}.status"] = "Please choose an allergy status."
        status = "unknown"

    raw_allergens = raw.get("allergens") if isinstance(raw.get("allergens"), list) else []
    allergens = []
    for value in raw_allergens:
        value = clean_string(value, 60)
        if value in ALLERGENS and value not in allergens:
            allergens.append(value)

    other = clean_string(raw.get("otherAllergens"), 800)
    reaction = clean_string(raw.get("reactionDetails"), 1500)
    emergency = clean_string(raw.get("emergencyInstructions"), 1500)
    medication = parse_bool(raw.get("carriesEmergencyMedication"))

    if status == "yes" and not allergens and not other:
        errors[f"{path}.allergens"] = "Please identify at least one allergen or provide another allergen."
    if status != "yes":
        allergens, other, reaction, emergency, medication = [], "", "", "", False

    return {
        "status": status,
        "allergens": allergens,
        "otherAllergens": other,
        "reactionDetails": reaction,
        "emergencyInstructions": emergency,
        "carriesEmergencyMedication": medication,
    }


def validate_v2(payload):
    errors = {}
    request_id = clean_string(payload.get("requestId"), 128)
    registration_type = clean_string(payload.get("registrationType"), 40)
    primary_id = clean_string(payload.get("primaryContactPersonId"), 110)
    preferred_location = clean_string(payload.get("preferredLocationId"), 80)

    if not REQUEST_ID_RE.fullmatch(request_id):
        errors["requestId"] = "Invalid submission identifier."
    if registration_type not in REGISTRATION_TYPES:
        errors["registrationType"] = "Please choose a valid registration type."
    if not PERSON_ID_RE.fullmatch(primary_id):
        errors["primaryContactPersonId"] = "Invalid primary contact identifier."
    if preferred_location not in LOCATION_IDS:
        errors["preferredLocationId"] = "Please choose a valid academy location."

    raw_people = payload.get("people") if isinstance(payload.get("people"), list) else []
    if not 1 <= len(raw_people) <= 12:
        errors["people"] = "Registration must contain between 1 and 12 people."

    people = []
    people_by_id = {}
    for index, raw_person in enumerate(raw_people[:12]):
        person = _clean_person(raw_person, errors, f"people.{index}")
        if not person:
            continue
        if person["personId"] in people_by_id:
            errors[f"people.{index}.personId"] = "Person identifiers must be unique."
        people.append(person)
        people_by_id[person["personId"]] = person

    primary = people_by_id.get(primary_id)
    if not primary:
        errors["primaryContactPersonId"] = "Primary contact must exist in this submission."
    else:
        if not EMAIL_RE.fullmatch(primary["email"]):
            errors["primary.email"] = "Primary contact email is required."
        if not E164_PHONE_RE.fullmatch(primary["phone"]):
            errors["primary.phone"] = "Enter a valid international phone number beginning with + and the country code."

    has_children = registration_type in {"children", "adult-and-children"}
    adult_is_student = registration_type in {"adult", "adult-and-children"}

    if primary:
        if has_children and "guardian" not in primary["roles"]:
            errors["primary.roles"] = "Child registration requires a parent or guardian."
        if adult_is_student:
            if "student" not in primary["roles"]:
                errors["primary.roles"] = "Adult applicant must also be a student."
            parsed = parse_date(primary["dateOfBirth"] or "")
            if parsed is None:
                errors["primary.dateOfBirth"] = "Adult student date of birth is required."
            elif age_on_today(parsed) < 18:
                errors["primary.dateOfBirth"] = "Independent adult registration requires age 18 or over."

    raw_relationships = payload.get("relationships") if isinstance(payload.get("relationships"), list) else []
    relationships = []
    for index, raw in enumerate(raw_relationships[:24]):
        if not isinstance(raw, dict):
            errors[f"relationships.{index}"] = "Invalid family relationship."
            continue
        guardian_id = clean_string(raw.get("guardianPersonId"), 110)
        student_id = clean_string(raw.get("studentPersonId"), 110)
        relationship = clean_string(raw.get("relationship"), 60)
        if guardian_id not in people_by_id or "guardian" not in people_by_id[guardian_id].get("roles", []):
            errors[f"relationships.{index}.guardianPersonId"] = "Relationship must reference a guardian in this submission."
        if student_id not in people_by_id:
            errors[f"relationships.{index}.studentPersonId"] = "Relationship must reference a student in this submission."
        if len(relationship) < 2:
            errors[f"relationships.{index}.relationship"] = "Relationship is required."
        relationships.append({
            "guardianPersonId": guardian_id,
            "studentPersonId": student_id,
            "relationship": relationship,
            "verificationStatus": "unverified",
        })

    raw_students = payload.get("students") if isinstance(payload.get("students"), list) else []
    if not 1 <= len(raw_students) <= 10:
        errors["students"] = "Registration must contain between 1 and 10 students."

    students = []
    seen_students = set()
    for index, raw in enumerate(raw_students[:10]):
        path = f"students.{index}"
        if not isinstance(raw, dict):
            errors[path] = "Invalid student record."
            continue
        person_id = clean_string(raw.get("personId"), 110)
        student_type = clean_string(raw.get("studentType"), 20)
        person = people_by_id.get(person_id)
        if not person or "student" not in person.get("roles", []):
            errors[f"{path}.personId"] = "Student must reference a student person in this submission."
        if person_id in seen_students:
            errors[f"{path}.personId"] = "Student identifiers must be unique."
        seen_students.add(person_id)
        if student_type not in {"adult", "child"}:
            errors[f"{path}.studentType"] = "Invalid student type."
        if student_type == "child":
            parsed = parse_date(person.get("dateOfBirth") if person else "")
            if parsed is None:
                errors[f"{path}.dateOfBirth"] = "Child date of birth is required."
            if not any(rel["studentPersonId"] == person_id for rel in relationships):
                errors[f"{path}.guardian"] = "Each child must be linked to a guardian in this submission."

        contact_raw = raw.get("contactPreferences") if isinstance(raw.get("contactPreferences"), dict) else {}
        contact = {}
        for field in ("emailSource", "phoneSource", "addressSource"):
            source = clean_string(contact_raw.get(field), 20)
            if source not in {"guardian", "student"}:
                errors[f"{path}.contactPreferences.{field}"] = "Contact source must be guardian or student."
            contact[field] = source
        guardian_person_id = clean_string(contact_raw.get("guardianPersonId"), 110) or None
        if student_type == "child" and "guardian" in contact.values():
            guardian = people_by_id.get(guardian_person_id)
            if not guardian or "guardian" not in guardian.get("roles", []):
                errors[f"{path}.contactPreferences.guardianPersonId"] = "Inherited contact details must reference a guardian in this submission."
        if student_type == "child" and person:
            if contact.get("emailSource") == "student" and not EMAIL_RE.fullmatch(person.get("email") or ""):
                errors[f"{path}.email"] = "Student email is required when it is not inherited."
            if contact.get("phoneSource") == "student" and not E164_PHONE_RE.fullmatch(person.get("phone") or ""):
                errors[f"{path}.phone"] = "Student mobile is required when it is not inherited."
            if contact.get("addressSource") == "student":
                address = person.get("address") or {}
                if not any(address.get(key) for key in ("line1", "line2", "town", "county", "postcode")):
                    errors[f"{path}.address"] = "Student address is required when it is not inherited."
        contact["guardianPersonId"] = guardian_person_id

        location_id = clean_string(raw.get("preferredLocationId"), 80)
        class_id = clean_string(raw.get("preferredClassId"), 80) or None
        if location_id not in LOCATION_IDS:
            errors[f"{path}.preferredLocationId"] = "Please choose a valid academy location."
        if class_id and class_id not in COURSE_IDS:
            errors[f"{path}.preferredClassId"] = "Please choose a valid course."

        request_enrolment = parse_bool(raw.get("classEnrolmentRequested"))
        start_date = clean_string(raw.get("proposedStartDate"), 10) or None
        if request_enrolment:
            parsed_start = parse_date(start_date or "")
            if parsed_start is None or parsed_start < date.today():
                errors[f"{path}.proposedStartDate"] = "A valid future proposed start date is required."
        else:
            start_date = None

        allergy = _clean_allergy(raw.get("foodAllergies"), errors, f"{path}.foodAllergies")
        photo = _clean_photo(raw.get("photo"), request_id, person_id, errors, path)

        emergency_override = raw.get("emergencyContactOverride")
        cleaned_emergency = None
        if emergency_override is not None:
            if not isinstance(emergency_override, dict):
                errors[f"{path}.emergencyContactOverride"] = "Invalid emergency contact override."
            else:
                emergency_name = clean_string(emergency_override.get("name"), 120)
                emergency_phone = clean_international_phone(emergency_override.get("phone"))
                if len(emergency_name) < 2:
                    errors[f"{path}.emergencyContactOverride.name"] = "Emergency contact name is required."
                if not E164_PHONE_RE.fullmatch(emergency_phone):
                    errors[f"{path}.emergencyContactOverride.phone"] = "Enter a valid international phone number beginning with + and the country code."
                cleaned_emergency = {"name": emergency_name, "phone": emergency_phone}

        media_override = raw.get("mediaConsentOverride")
        if media_override not in (None, True, False):
            errors[f"{path}.mediaConsentOverride"] = "Invalid media consent override."
            media_override = None

        students.append({
            "personId": person_id,
            "studentType": student_type,
            "contactPreferences": contact,
            "preferredLocationId": location_id,
            "preferredClassId": class_id,
            "classEnrolmentRequested": request_enrolment,
            "proposedStartDate": start_date,
            "photo": photo,
            "foodAllergies": allergy,
            "healthNotes": clean_string(raw.get("healthNotes"), 2000),
            "notes": clean_string(raw.get("notes"), 2000),
            "emergencyContactOverride": cleaned_emergency,
            "mediaConsentOverride": media_override,
        })

    expected_student_ids = [student["personId"] for student in students]
    supplied_student_ids = payload.get("studentPersonIds") if isinstance(payload.get("studentPersonIds"), list) else []
    supplied_student_ids = [clean_string(value, 110) for value in supplied_student_ids]
    if set(supplied_student_ids) != set(expected_student_ids):
        errors["studentPersonIds"] = "Student identifier list does not match the student records."

    adult_student_ids = [student["personId"] for student in students if student["studentType"] == "adult"]
    if registration_type == "adult" and len(students) != 1:
        errors["students"] = "Adult registration must contain exactly one student."
    if adult_is_student and adult_student_ids != [primary_id]:
        errors["students"] = "The adult student must reuse the primary adult person record."
    if registration_type == "children" and any(student["studentType"] != "child" for student in students):
        errors["students"] = "Child registration may only contain child students."
    if registration_type == "adult-and-children":
        if sum(student["studentType"] == "adult" for student in students) != 1 or not any(student["studentType"] == "child" for student in students):
            errors["students"] = "Combined registration requires one adult student and at least one child."

    emergency_raw = payload.get("emergencyContact") if isinstance(payload.get("emergencyContact"), dict) else {}
    emergency_name = clean_string(emergency_raw.get("name"), 120)
    emergency_phone = clean_international_phone(emergency_raw.get("phone"))
    if len(emergency_name) < 2:
        errors["emergencyContact.name"] = "Emergency contact name is required."
    if not E164_PHONE_RE.fullmatch(emergency_phone):
        errors["emergencyContact.phone"] = "Enter a valid international phone number beginning with + and the country code."

    privacy_raw = payload.get("privacyAcknowledgement") if isinstance(payload.get("privacyAcknowledgement"), dict) else {}
    privacy_accepted = parse_bool(privacy_raw.get("accepted"))
    privacy_version = clean_string(privacy_raw.get("noticeVersion"), 40)
    if not privacy_accepted:
        errors["privacyAccepted"] = "Privacy acknowledgement is required."
    if not privacy_version:
        errors["privacyAccepted"] = "Privacy notice version is required."

    media_raw = payload.get("mediaConsent") if isinstance(payload.get("mediaConsent"), dict) else {}
    if media_raw.get("granted") not in (True, False):
        errors["mediaConsent"] = "Media consent choice is required."
    media_granted = media_raw.get("granted") is True
    media_version = clean_string(media_raw.get("version"), 40)
    if not media_version:
        errors["mediaConsent"] = "Media consent text version is required."

    declaration_raw = payload.get("declaration") if isinstance(payload.get("declaration"), dict) else {}
    accurate = parse_bool(declaration_raw.get("informationAccurate"))
    signed_by = clean_string(declaration_raw.get("signedBy"), 120)
    declaration_version = clean_string(declaration_raw.get("version"), 40)
    if not accurate:
        errors["informationAccurate"] = "Please confirm the information is accurate."
    if len(signed_by) < 2:
        errors["signedBy"] = "Please type your full name."
    if not declaration_version:
        errors["signedBy"] = "Declaration version is required."

    return errors, {
        "requestId": request_id,
        "registrationType": registration_type,
        "primaryContactPersonId": primary_id,
        "applicantPersonIds": [primary_id],
        "studentPersonIds": expected_student_ids,
        "preferredLocationId": preferred_location,
        "people": people,
        "relationships": relationships,
        "students": students,
        "emergencyContact": {"name": emergency_name, "phone": emergency_phone},
        "privacyAcknowledgement": {"accepted": privacy_accepted, "noticeVersion": privacy_version},
        "mediaConsent": {"granted": media_granted, "version": media_version},
        "registrationNotes": clean_string(payload.get("registrationNotes"), 2500),
        "declaration": {
            "informationAccurate": accurate,
            "signedBy": signed_by,
            "version": declaration_version,
        },
    }


def build_v2_item(cleaned, now=None):
    now = now or datetime.now(timezone.utc)
    submitted_at = iso_now(now)
    registration_id = registration_id_for(cleaned["requestId"], now.year)
    return {
        "registrationId": registration_id,
        "schemaVersion": 2,
        "institution": "RAAGASUDHA",
        "source": "RAAGASUDHA_WEBSITE",
        "status": "SUBMITTED",
        "registrationType": cleaned["registrationType"],
        "reviewStatus": "pending",
        "submittedAt": submitted_at,
        "updatedAt": submitted_at,
        "requestId": cleaned["requestId"],
        "primaryContactPersonId": cleaned["primaryContactPersonId"],
        "applicantPersonIds": cleaned["applicantPersonIds"],
        "studentPersonIds": cleaned["studentPersonIds"],
        "preferredLocationId": strip_location_prefix(cleaned["preferredLocationId"]),
        "people": cleaned["people"],
        "relationships": cleaned["relationships"],
        "students": [
            {**student, "preferredLocationId": strip_location_prefix(student["preferredLocationId"])}
            for student in cleaned["students"]
        ],
        "emergencyContact": cleaned["emergencyContact"],
        "privacyAcknowledgement": {
            **cleaned["privacyAcknowledgement"],
            "recordedAt": submitted_at,
        },
        "mediaConsent": {
            **cleaned["mediaConsent"],
            "recordedAt": submitted_at,
        },
        "registrationNotes": cleaned["registrationNotes"],
        "declaration": {
            **cleaned["declaration"],
            "acceptedAt": submitted_at,
        },
        "review": {
            "status": "pending",
            "reviewedBy": None,
            "reviewedAt": None,
        },
        "sadhanaImport": {
            "status": "not-imported",
            "familyId": None,
            "studentIds": {},
            "importedAt": None,
            "lastAttemptAt": None,
            "errorCode": None,
        },
    }


def restore_location_prefixes(item):
    """Return a copy of a stored registration item with LOC- prefixes restored
    on preferredLocationId fields, for API responses that return the full item."""
    if not isinstance(item, dict):
        return item
    restored = dict(item)
    if "preferredLocationId" in restored:
        restored["preferredLocationId"] = add_location_prefix(restored.get("preferredLocationId"))
    students = restored.get("students")
    if isinstance(students, list):
        restored["students"] = [
            {**student, "preferredLocationId": add_location_prefix(student.get("preferredLocationId"))}
            if isinstance(student, dict)
            else student
            for student in students
        ]
    return restored


def registration_summary(item):
    schema_version = int(item.get("schemaVersion") or 1)
    if schema_version == 1:
        return {
            "registrationId": item.get("registrationId"),
            "schemaVersion": 1,
            "registrationType": "legacy-single-student",
            "reviewStatus": item.get("reviewStatus") or "legacy",
            "submittedAt": item.get("submittedAt"),
            "preferredLocationId": add_location_prefix(item.get("preferredLocationId")),
            "primaryName": (item.get("parentGuardian") or {}).get("name") or (item.get("student") or {}).get("name"),
            "studentNames": [(item.get("student") or {}).get("name")],
            "studentCount": 1,
            "importStatus": (item.get("sadhanaImport") or {}).get("status") or "not-imported",
        }

    people = {person.get("personId"): person for person in item.get("people") or []}
    return {
        "registrationId": item.get("registrationId"),
        "schemaVersion": schema_version,
        "registrationType": item.get("registrationType"),
        "reviewStatus": item.get("reviewStatus") or (item.get("review") or {}).get("status") or "pending",
        "submittedAt": item.get("submittedAt"),
        "preferredLocationId": add_location_prefix(item.get("preferredLocationId")),
        "primaryName": (people.get(item.get("primaryContactPersonId")) or {}).get("fullName"),
        "studentNames": [
            (people.get(person_id) or {}).get("fullName")
            for person_id in item.get("studentPersonIds") or []
        ],
        "studentCount": len(item.get("studentPersonIds") or []),
        "importStatus": (item.get("sadhanaImport") or {}).get("status") or "not-imported",
    }


def can_permanently_delete(item):
    import_status = (item.get("sadhanaImport") or {}).get("status")
    if import_status == "imported":
        return False, "Imported registrations cannot be intake-deleted automatically."
    review_status = item.get("reviewStatus") or (item.get("review") or {}).get("status") or "legacy"
    if review_status == "approved":
        return False, "Approved registrations require a retention review before permanent deletion."
    return True, None
