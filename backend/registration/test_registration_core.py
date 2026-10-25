import os
import sys
import unittest
from copy import deepcopy
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from registration_core import (  # noqa: E402
    build_v1_item,
    build_v2_item,
    can_permanently_delete,
    expected_photo_prefix,
    registration_id_for,
    registration_summary,
    validate_v1,
    validate_v2,
)


PRIMARY_ID = "PERSON-11111111-1111-4111-8111-111111111111"
CHILD1_ID = "PERSON-22222222-2222-4222-8222-222222222222"
CHILD2_ID = "PERSON-33333333-3333-4333-8333-333333333333"
SECONDARY_ID = "PERSON-44444444-4444-4444-8444-444444444444"
REQUEST_ID = "test-request-12345678"


def person(person_id, name, roles, dob=None, email="", phone=""):
    return {
        "personId": person_id,
        "fullName": name,
        "dateOfBirth": dob,
        "gender": None,
        "email": email,
        "phone": phone,
        "address": {
            "line1": "1 Music Street",
            "line2": "",
            "town": "Newcastle",
            "county": "Tyne and Wear",
            "postcode": "NE1 1AA",
            "country": "GB",
        },
        "roles": roles,
    }


def allergy(status="none"):
    return {
        "status": status,
        "allergens": [],
        "otherAllergens": "",
        "reactionDetails": "",
        "emergencyInstructions": "",
        "carriesEmergencyMedication": False,
    }


def student(person_id, student_type="child", allergy_status="none"):
    return {
        "personId": person_id,
        "studentType": student_type,
        "contactPreferences": {
            "emailSource": "guardian" if student_type == "child" else "student",
            "phoneSource": "guardian" if student_type == "child" else "student",
            "addressSource": "guardian" if student_type == "child" else "student",
            "guardianPersonId": PRIMARY_ID if student_type == "child" else None,
        },
        "preferredLocationId": "LOC-NEWCASTLE",
        "preferredClassId": "COURSE-CARNATIC-VOCAL",
        "classEnrolmentRequested": False,
        "proposedStartDate": None,
        "photo": None,
        "foodAllergies": allergy(allergy_status),
        "healthNotes": "",
        "notes": "",
        "emergencyContactOverride": None,
        "mediaConsentOverride": None,
    }


def base_submission(registration_type="children"):
    primary_roles = ["applicant", "guardian"]
    people = [person(PRIMARY_ID, "Primary Guardian", primary_roles, email="parent@example.com", phone="+447700900001")]
    students = [student(CHILD1_ID)]
    people.append(person(CHILD1_ID, "Child One", ["student"], dob="2015-06-01"))
    relationships = [{
        "guardianPersonId": PRIMARY_ID,
        "studentPersonId": CHILD1_ID,
        "relationship": "parent",
        "verificationStatus": "unverified",
    }]

    if registration_type == "adult":
        people = [person(PRIMARY_ID, "Adult Student", ["applicant", "student"], dob="1990-01-01", email="adult@example.com", phone="+447700900002")]
        students = [student(PRIMARY_ID, "adult")]
        relationships = []
    elif registration_type == "adult-and-children":
        people[0] = person(PRIMARY_ID, "Adult Parent Student", ["applicant", "guardian", "student"], dob="1987-03-04", email="family@example.com", phone="+447700900003")
        students.insert(0, student(PRIMARY_ID, "adult"))

    return {
        "schemaVersion": 2,
        "requestId": REQUEST_ID,
        "registrationType": registration_type,
        "primaryContactPersonId": PRIMARY_ID,
        "applicantPersonIds": [PRIMARY_ID],
        "studentPersonIds": [value["personId"] for value in students],
        "preferredLocationId": "LOC-NEWCASTLE",
        "people": people,
        "relationships": relationships,
        "students": students,
        "emergencyContact": {"name": "Emergency Person", "phone": "+447700900999"},
        "privacyAcknowledgement": {"accepted": True, "noticeVersion": "2026-10-25"},
        "mediaConsent": {"granted": False, "version": "2026-10-25"},
        "registrationNotes": "",
        "declaration": {
            "informationAccurate": True,
            "signedBy": "Primary Guardian",
            "version": "2026-10-25",
        },
    }


class RegistrationCoreAcceptanceTests(unittest.TestCase):
    def test_01_independent_adult_registration(self):
        payload = base_submission("adult")
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(cleaned["studentPersonIds"], [PRIMARY_ID])

    def test_02_parent_registering_one_child(self):
        errors, cleaned = validate_v2(base_submission("children"))
        self.assertEqual(errors, {})
        self.assertEqual(len(cleaned["students"]), 1)

    def test_03_parent_registering_multiple_children(self):
        payload = base_submission("children")
        payload["people"].append(person(CHILD2_ID, "Child Two", ["student"], dob="2017-07-02"))
        payload["students"].append(student(CHILD2_ID))
        payload["studentPersonIds"].append(CHILD2_ID)
        payload["relationships"].append({
            "guardianPersonId": PRIMARY_ID,
            "studentPersonId": CHILD2_ID,
            "relationship": "parent",
        })
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(len(cleaned["students"]), 2)

    def test_04_adult_and_two_children(self):
        payload = base_submission("adult-and-children")
        payload["people"].append(person(CHILD2_ID, "Child Two", ["student"], dob="2018-01-02"))
        payload["students"].append(student(CHILD2_ID))
        payload["studentPersonIds"].append(CHILD2_ID)
        payload["relationships"].append({
            "guardianPersonId": PRIMARY_ID,
            "studentPersonId": CHILD2_ID,
            "relationship": "parent",
        })
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual([s["studentType"] for s in cleaned["students"]].count("adult"), 1)
        self.assertEqual([s["studentType"] for s in cleaned["students"]].count("child"), 2)

    def test_05_contact_inheritance_is_independent(self):
        payload = base_submission("children")
        child = payload["students"][0]
        child["contactPreferences"]["emailSource"] = "student"
        child["contactPreferences"]["phoneSource"] = "guardian"
        child["contactPreferences"]["addressSource"] = "guardian"
        payload["people"][1]["email"] = "child@example.com"
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(cleaned["students"][0]["contactPreferences"]["emailSource"], "student")
        self.assertEqual(cleaned["students"][0]["contactPreferences"]["phoneSource"], "guardian")

    def test_06_different_address_for_one_child_is_preserved(self):
        payload = base_submission("children")
        payload["students"][0]["contactPreferences"]["addressSource"] = "student"
        payload["people"][1]["address"]["line1"] = "99 Different Road"
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        child_person = next(p for p in cleaned["people"] if p["personId"] == CHILD1_ID)
        self.assertEqual(child_person["address"]["line1"], "99 Different Road")

    def test_07_per_student_class_and_photo_details(self):
        payload = base_submission("children")
        photo_key = expected_photo_prefix(REQUEST_ID, CHILD1_ID) + "photo.jpg"
        payload["students"][0]["photo"] = {
            "storageKey": photo_key,
            "contentType": "image/jpeg",
            "fileName": "child.jpg",
            "fileSize": 12345,
            "uploadedAt": "2026-10-25T10:00:00Z",
        }
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(cleaned["students"][0]["photo"]["storageKey"], photo_key)
        self.assertEqual(cleaned["students"][0]["preferredClassId"], "COURSE-CARNATIC-VOCAL")

    def test_08_per_student_food_allergy_information(self):
        payload = base_submission("children")
        payload["students"][0]["foodAllergies"] = {
            "status": "yes",
            "allergens": ["Peanuts"],
            "otherAllergens": "",
            "reactionDetails": "Severe reaction",
            "emergencyInstructions": "Follow care plan",
            "carriesEmergencyMedication": True,
        }
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(cleaned["students"][0]["foodAllergies"]["status"], "yes")
        self.assertTrue(cleaned["students"][0]["foodAllergies"]["carriesEmergencyMedication"])

    def test_09_missing_required_fields_are_rejected(self):
        payload = base_submission("children")
        payload["people"][0]["email"] = ""
        payload["students"][0]["foodAllergies"]["status"] = ""
        errors, _ = validate_v2(payload)
        self.assertIn("primary.email", errors)
        self.assertIn("students.0.foodAllergies.status", errors)

    def test_10_legacy_submission_remains_readable(self):
        legacy = {
            "requestId": "legacy-request-1234",
            "studentName": "Legacy Student",
            "dateOfBirth": "2014-01-01",
            "parentGuardianName": "Legacy Parent",
            "contactNumber": "+447700900000",
            "email": "legacy@example.com",
            "healthCondition": {"hasCondition": False, "details": ""},
            "foodAllergies": {"hasAllergies": False, "details": ""},
            "enrolmentAccepted": True,
            "informationAccurate": True,
            "signedBy": "Legacy Parent",
        }
        errors, cleaned = validate_v1(legacy)
        self.assertEqual(errors, {})
        item = build_v1_item(cleaned)
        summary = registration_summary(item)
        self.assertEqual(summary["schemaVersion"], 1)
        self.assertEqual(summary["studentNames"], ["Legacy Student"])

    def test_11_submission_build_round_trip_preserves_identifiers(self):
        errors, cleaned = validate_v2(base_submission("children"))
        self.assertEqual(errors, {})
        item = build_v2_item(cleaned)
        self.assertEqual(item["primaryContactPersonId"], PRIMARY_ID)
        self.assertEqual(item["studentPersonIds"], [CHILD1_ID])
        self.assertEqual(item["schemaVersion"], 2)

    def test_12_retry_identifier_is_idempotent(self):
        self.assertEqual(
            registration_id_for(REQUEST_ID, 2026),
            registration_id_for(REQUEST_ID, 2026),
        )

    def test_13_admin_routes_are_iam_protected(self):
        deploy_path = os.path.join(os.path.dirname(__file__), "deploy.sh")
        with open(deploy_path, "r", encoding="utf-8") as handle:
            deploy_script = handle.read()
        self.assertIn("GET /admin/registrations' AWS_IAM", deploy_script)
        self.assertIn("PATCH /admin/registrations/{registrationId}' AWS_IAM", deploy_script)

    def test_14_imported_submission_cannot_be_intake_deleted(self):
        errors, cleaned = validate_v2(base_submission("children"))
        self.assertEqual(errors, {})
        item = build_v2_item(cleaned)
        item["sadhanaImport"]["status"] = "imported"
        allowed, _ = can_permanently_delete(item)
        self.assertFalse(allowed)

    def test_15_approved_import_retains_source_identifiers(self):
        errors, cleaned = validate_v2(base_submission("children"))
        self.assertEqual(errors, {})
        item = build_v2_item(cleaned)
        item["reviewStatus"] = "approved"
        item["sadhanaImport"] = {
            "status": "imported",
            "familyId": "FAMILY-123",
            "studentIds": {CHILD1_ID: "STUDENT-456"},
            "importedAt": "2026-10-25T12:00:00Z",
            "lastAttemptAt": "2026-10-25T12:00:00Z",
            "errorCode": None,
        }
        self.assertEqual(item["registrationId"], registration_id_for(REQUEST_ID, date.today().year))
        self.assertIn(CHILD1_ID, item["sadhanaImport"]["studentIds"])




    def test_v2_rejects_domestic_phone_without_country_code(self):
        payload = base_submission("children")
        payload["people"][0]["phone"] = "07700 900123"
        errors, _ = validate_v2(payload)
        self.assertIn("people.0.phone", errors)

    def test_v2_normalises_formatted_international_phone(self):
        payload = base_submission("children")
        payload["people"][0]["phone"] = "+44 (7700) 900-123"
        payload["emergencyContact"]["phone"] = "+44 7700 900 999"
        errors, cleaned = validate_v2(payload)
        self.assertEqual(errors, {})
        self.assertEqual(cleaned["people"][0]["phone"], "+447700900123")
        self.assertEqual(cleaned["emergencyContact"]["phone"], "+447700900999")


if __name__ == "__main__":
    unittest.main()
