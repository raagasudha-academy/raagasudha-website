import { ACADEMY_COURSES, ACADEMY_LOCATIONS } from '../data/academyCatalog.js'

const LOCATION_IDS = new Set(ACADEMY_LOCATIONS.map((item) => item.id))
const COURSE_IDS = new Set(ACADEMY_COURSES.map((item) => item.id))

export const ALLERGEN_OPTIONS = [
  'Peanuts',
  'Tree nuts',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Other',
]

export function createPersonId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `PERSON-${crypto.randomUUID()}`
  }
  return `PERSON-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function emptyAddress() {
  return {
    line1: '',
    line2: '',
    town: '',
    county: '',
    postcode: '',
    country: 'GB',
  }
}

export function emptyAllergy() {
  return {
    status: '',
    allergens: [],
    otherAllergens: '',
    reactionDetails: '',
    emergencyInstructions: '',
    carriesEmergencyMedication: false,
  }
}

export function emptyStudent({ studentType = 'child', preferredLocationId = '' } = {}) {
  return {
    personId: createPersonId(),
    studentType,
    fullName: '',
    dateOfBirth: '',
    gender: '',
    ownEmail: '',
    ownPhone: '',
    ownAddress: emptyAddress(),
    contactPreferences: {
      emailSource: studentType === 'adult' ? 'student' : 'guardian',
      phoneSource: studentType === 'adult' ? 'student' : 'guardian',
      addressSource: studentType === 'adult' ? 'student' : 'guardian',
    },
    preferredLocationId,
    preferredClassId: '',
    classEnrolmentRequested: false,
    proposedStartDate: '',
    photoFile: null,
    foodAllergies: emptyAllergy(),
    healthNotes: '',
    notes: '',
    emergencyContactOverride: {
      enabled: false,
      name: '',
      phone: '',
    },
    mediaConsentOverride: 'inherit',
  }
}

export function initialRegistrationForm() {
  return {
    registrationType: '',
    primary: {
      personId: createPersonId(),
      fullName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phone: '',
      address: emptyAddress(),
      preferredLocationId: '',
      relationshipToChildren: '',
    },
    secondaryGuardian: {
      enabled: false,
      personId: createPersonId(),
      fullName: '',
      relationshipToChild: '',
      email: '',
      phone: '',
    },
    adultStudent: null,
    children: [],
    emergencyContact: {
      name: '',
      phone: '',
    },
    privacyAccepted: false,
    mediaConsent: '',
    registrationNotes: '',
    informationAccurate: false,
    signedBy: '',
    website: '',
  }
}

export function applyRegistrationType(current, registrationType) {
  const next = {
    ...current,
    registrationType,
  }

  const needsAdultStudent = registrationType === 'adult' || registrationType === 'adult-and-children'
  const needsChildren = registrationType === 'children' || registrationType === 'adult-and-children'

  if (needsAdultStudent && !next.adultStudent) {
    next.adultStudent = emptyStudent({
      studentType: 'adult',
      preferredLocationId: current.primary.preferredLocationId,
    })
    next.adultStudent.personId = current.primary.personId
  }

  if (!needsAdultStudent) next.adultStudent = null

  if (needsChildren && next.children.length === 0) {
    next.children = [
      emptyStudent({
        studentType: 'child',
        preferredLocationId: current.primary.preferredLocationId,
      }),
    ]
  }

  if (!needsChildren) {
    next.children = []
    next.secondaryGuardian = {
      ...next.secondaryGuardian,
      enabled: false,
    }
  }

  return next
}

export function calculateAge(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null
  const birth = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDifference = today.getMonth() - birth.getMonth()
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1
  }
  return age
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function normalisePhone(value) {
  return String(value || '').trim().replace(/[\s()\-]/g, '')
}

function validPhone(value) {
  return /^\+[1-9]\d{7,14}$/.test(normalisePhone(value))
}

const PHONE_ERROR = 'Enter a valid international phone number beginning with + and the country code, e.g. +44 7700 900000.'

function addressHasAnyValue(address) {
  return ['line1', 'line2', 'town', 'county', 'postcode'].some((key) => address?.[key]?.trim())
}

function validateAllergy(allergy, path, errors) {
  if (!['none', 'yes', 'unknown'].includes(allergy?.status)) {
    errors[`${path}.status`] = 'Please choose an allergy status.'
    return
  }

  if (allergy.status === 'yes') {
    const hasNamedAllergen = Array.isArray(allergy.allergens) && allergy.allergens.length > 0
    const hasOther = Boolean(allergy.otherAllergens?.trim())
    if (!hasNamedAllergen && !hasOther) {
      errors[`${path}.allergens`] = 'Please identify at least one known allergen or enter another allergen.'
    }
  }
}

function validateStudent(student, form, path, errors, todayString) {
  if (!student.fullName.trim()) errors[`${path}.fullName`] = 'Please enter the student’s full legal name.'
  if (!student.dateOfBirth) errors[`${path}.dateOfBirth`] = 'Please enter the student’s date of birth.'
  if (student.dateOfBirth && student.dateOfBirth > todayString) {
    errors[`${path}.dateOfBirth`] = 'Date of birth cannot be in the future.'
  }
  if (!LOCATION_IDS.has(student.preferredLocationId)) {
    errors[`${path}.preferredLocationId`] = 'Please choose a preferred academy location.'
  }
  if (student.preferredClassId && !COURSE_IDS.has(student.preferredClassId)) {
    errors[`${path}.preferredClassId`] = 'Please choose a valid course.'
  }
  if (student.classEnrolmentRequested && !student.proposedStartDate) {
    errors[`${path}.proposedStartDate`] = 'Please choose a proposed start date.'
  }
  if (student.proposedStartDate && student.proposedStartDate < todayString) {
    errors[`${path}.proposedStartDate`] = 'Proposed start date cannot be in the past.'
  }

  if (student.studentType === 'child') {
    if (student.contactPreferences.emailSource === 'student' && !validEmail(student.ownEmail)) {
      errors[`${path}.ownEmail`] = 'Please enter a valid student email address or use the parent/guardian email.'
    }
    if (student.contactPreferences.phoneSource === 'student' && !validPhone(student.ownPhone)) {
      errors[`${path}.ownPhone`] = 'Enter a valid international student mobile number (for example +44 7700 900000), or use the parent/guardian mobile.'
    }
    if (student.contactPreferences.addressSource === 'student' && !addressHasAnyValue(student.ownAddress)) {
      errors[`${path}.ownAddress.line1`] = 'Please enter the student’s address or use the parent/guardian address.'
    }
  }

  if (student.photoFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(student.photoFile.type)) {
      errors[`${path}.photoFile`] = 'Photograph must be JPEG, PNG or WebP.'
    } else if (student.photoFile.size > 5 * 1024 * 1024) {
      errors[`${path}.photoFile`] = 'Photograph must be 5 MB or smaller.'
    }
  }

  validateAllergy(student.foodAllergies, `${path}.foodAllergies`, errors)

  if (student.emergencyContactOverride.enabled) {
    if (!student.emergencyContactOverride.name.trim()) {
      errors[`${path}.emergencyContactOverride.name`] = 'Please enter the emergency contact name.'
    }
    if (!validPhone(student.emergencyContactOverride.phone)) {
      errors[`${path}.emergencyContactOverride.phone`] = PHONE_ERROR
    }
  }
}

export function validateRegistration(form) {
  const errors = {}
  const todayString = new Date().toISOString().slice(0, 10)
  const hasChildren = form.registrationType === 'children' || form.registrationType === 'adult-and-children'
  const adultIsStudent = form.registrationType === 'adult' || form.registrationType === 'adult-and-children'

  if (!['adult', 'children', 'adult-and-children'].includes(form.registrationType)) {
    errors.registrationType = 'Please choose who you are registering.'
    return errors
  }

  if (!form.primary.fullName.trim()) errors['primary.fullName'] = 'Please enter your full legal name.'
  if (!validEmail(form.primary.email)) errors['primary.email'] = 'Please enter a valid email address.'
  if (!validPhone(form.primary.phone)) errors['primary.phone'] = PHONE_ERROR
  if (!LOCATION_IDS.has(form.primary.preferredLocationId)) {
    errors['primary.preferredLocationId'] = 'Please choose a preferred academy location.'
  }

  if (adultIsStudent) {
    if (!form.primary.dateOfBirth) {
      errors['primary.dateOfBirth'] = 'Date of birth is required for an adult student.'
    } else if (form.primary.dateOfBirth > todayString) {
      errors['primary.dateOfBirth'] = 'Date of birth cannot be in the future.'
    } else {
      const age = calculateAge(form.primary.dateOfBirth)
      if (age !== null && age < 18) {
        errors['primary.dateOfBirth'] = 'Independent adult registration requires the student to be 18 or over.'
      }
    }
  } else if (form.primary.dateOfBirth && form.primary.dateOfBirth > todayString) {
    errors['primary.dateOfBirth'] = 'Date of birth cannot be in the future.'
  }

  if (hasChildren && !['parent', 'legal-guardian'].includes(form.primary.relationshipToChildren)) {
    errors['primary.relationshipToChildren'] = 'Please confirm whether you are the parent or legal guardian.'
  }

  if (form.secondaryGuardian.enabled) {
    if (!form.secondaryGuardian.fullName.trim()) {
      errors['secondaryGuardian.fullName'] = 'Please enter the additional guardian’s full name.'
    }
    if (!form.secondaryGuardian.relationshipToChild.trim()) {
      errors['secondaryGuardian.relationshipToChild'] = 'Please enter their relationship to the child.'
    }
    if (form.secondaryGuardian.email && !validEmail(form.secondaryGuardian.email)) {
      errors['secondaryGuardian.email'] = 'Please enter a valid email address.'
    }
    if (form.secondaryGuardian.phone && !validPhone(form.secondaryGuardian.phone)) {
      errors['secondaryGuardian.phone'] = PHONE_ERROR
    }
  }

  if (adultIsStudent) {
    const adultStudent = {
      ...form.adultStudent,
      fullName: form.primary.fullName,
      dateOfBirth: form.primary.dateOfBirth,
    }
    validateStudent(adultStudent, form, 'adultStudent', errors, todayString)
  }

  if (hasChildren) {
    if (form.children.length === 0) {
      errors.children = 'Please add at least one child.'
    }
    form.children.forEach((student, index) => {
      validateStudent(student, form, `children.${index}`, errors, todayString)
    })
  }

  if (!form.emergencyContact.name.trim()) {
    errors['emergencyContact.name'] = 'Please enter an emergency contact name.'
  }
  if (!validPhone(form.emergencyContact.phone)) {
    errors['emergencyContact.phone'] = PHONE_ERROR
  }
  if (!form.privacyAccepted) errors.privacyAccepted = 'Please acknowledge the privacy notice.'
  if (!['granted', 'declined'].includes(form.mediaConsent)) {
    errors.mediaConsent = 'Please record your photography/media consent choice.'
  }
  if (!form.informationAccurate) {
    errors.informationAccurate = 'Please confirm that the information provided is accurate.'
  }
  if (!form.signedBy.trim()) errors.signedBy = 'Please type your full name.'

  return errors
}

function normaliseAddress(address) {
  return {
    line1: address?.line1?.trim() || '',
    line2: address?.line2?.trim() || '',
    town: address?.town?.trim() || '',
    county: address?.county?.trim() || '',
    postcode: address?.postcode?.trim().toUpperCase() || '',
    country: address?.country || 'GB',
  }
}

function allergyPayload(allergy) {
  if (allergy.status !== 'yes') {
    return {
      status: allergy.status,
      allergens: [],
      otherAllergens: '',
      reactionDetails: '',
      emergencyInstructions: '',
      carriesEmergencyMedication: false,
    }
  }
  return {
    status: 'yes',
    allergens: [...new Set(allergy.allergens || [])],
    otherAllergens: allergy.otherAllergens.trim(),
    reactionDetails: allergy.reactionDetails.trim(),
    emergencyInstructions: allergy.emergencyInstructions.trim(),
    carriesEmergencyMedication: Boolean(allergy.carriesEmergencyMedication),
  }
}

function studentPayload(student, photoRef, guardianPersonId) {
  return {
    personId: student.personId,
    studentType: student.studentType,
    contactPreferences: {
      emailSource: student.studentType === 'adult' ? 'student' : student.contactPreferences.emailSource,
      phoneSource: student.studentType === 'adult' ? 'student' : student.contactPreferences.phoneSource,
      addressSource: student.studentType === 'adult' ? 'student' : student.contactPreferences.addressSource,
      guardianPersonId: student.studentType === 'child' ? guardianPersonId : null,
    },
    preferredLocationId: student.preferredLocationId,
    preferredClassId: student.preferredClassId || null,
    classEnrolmentRequested: Boolean(student.classEnrolmentRequested),
    proposedStartDate: student.classEnrolmentRequested ? student.proposedStartDate || null : null,
    photo: photoRef || null,
    foodAllergies: allergyPayload(student.foodAllergies),
    healthNotes: student.healthNotes.trim(),
    notes: student.notes.trim(),
    emergencyContactOverride: student.emergencyContactOverride.enabled
      ? {
          name: student.emergencyContactOverride.name.trim(),
          phone: normalisePhone(student.emergencyContactOverride.phone),
        }
      : null,
    mediaConsentOverride:
      student.mediaConsentOverride === 'inherit' ? null : student.mediaConsentOverride === 'granted',
  }
}

export function buildRegistrationPayload({ form, requestId, uploadedPhotos = {} }) {
  const hasChildren = form.registrationType === 'children' || form.registrationType === 'adult-and-children'
  const adultIsStudent = form.registrationType === 'adult' || form.registrationType === 'adult-and-children'

  const primaryRoles = ['applicant']
  if (hasChildren) primaryRoles.push('guardian')
  if (adultIsStudent) primaryRoles.push('student')

  const people = [
    {
      personId: form.primary.personId,
      fullName: form.primary.fullName.trim(),
      dateOfBirth: form.primary.dateOfBirth || null,
      gender: form.primary.gender || null,
      email: form.primary.email.trim().toLowerCase(),
      phone: normalisePhone(form.primary.phone),
      address: normaliseAddress(form.primary.address),
      roles: primaryRoles,
    },
  ]

  const relationships = []
  const students = []

  if (form.secondaryGuardian.enabled && hasChildren) {
    people.push({
      personId: form.secondaryGuardian.personId,
      fullName: form.secondaryGuardian.fullName.trim(),
      dateOfBirth: null,
      gender: null,
      email: form.secondaryGuardian.email.trim().toLowerCase(),
      phone: normalisePhone(form.secondaryGuardian.phone),
      address: emptyAddress(),
      roles: ['guardian'],
    })
  }

  if (adultIsStudent) {
    const adultStudent = {
      ...form.adultStudent,
      personId: form.primary.personId,
      studentType: 'adult',
      fullName: form.primary.fullName,
      dateOfBirth: form.primary.dateOfBirth,
    }
    students.push(studentPayload(adultStudent, uploadedPhotos[adultStudent.personId], form.primary.personId))
  }

  if (hasChildren) {
    form.children.forEach((child) => {
      people.push({
        personId: child.personId,
        fullName: child.fullName.trim(),
        dateOfBirth: child.dateOfBirth,
        gender: child.gender || null,
        email:
          child.contactPreferences.emailSource === 'student'
            ? child.ownEmail.trim().toLowerCase()
            : '',
        phone:
          child.contactPreferences.phoneSource === 'student'
            ? normalisePhone(child.ownPhone)
            : '',
        address:
          child.contactPreferences.addressSource === 'student'
            ? normaliseAddress(child.ownAddress)
            : emptyAddress(),
        roles: ['student'],
      })

      relationships.push({
        guardianPersonId: form.primary.personId,
        studentPersonId: child.personId,
        relationship: form.primary.relationshipToChildren,
        verificationStatus: 'unverified',
      })

      if (form.secondaryGuardian.enabled) {
        relationships.push({
          guardianPersonId: form.secondaryGuardian.personId,
          studentPersonId: child.personId,
          relationship: form.secondaryGuardian.relationshipToChild.trim(),
          verificationStatus: 'unverified',
        })
      }

      students.push(studentPayload(child, uploadedPhotos[child.personId], form.primary.personId))
    })
  }

  const studentPersonIds = students.map((student) => student.personId)

  return {
    schemaVersion: 2,
    requestId,
    registrationType: form.registrationType,
    primaryContactPersonId: form.primary.personId,
    applicantPersonIds: [form.primary.personId],
    studentPersonIds,
    preferredLocationId: form.primary.preferredLocationId,
    people,
    relationships,
    students,
    emergencyContact: {
      name: form.emergencyContact.name.trim(),
      phone: normalisePhone(form.emergencyContact.phone),
    },
    privacyAcknowledgement: {
      accepted: Boolean(form.privacyAccepted),
      noticeVersion: '2026-10-25',
    },
    mediaConsent: {
      granted: form.mediaConsent === 'granted',
      version: '2026-10-25',
    },
    registrationNotes: form.registrationNotes.trim(),
    declaration: {
      informationAccurate: Boolean(form.informationAccurate),
      signedBy: form.signedBy.trim(),
      version: '2026-10-25',
    },
    website: form.website,
  }
}
