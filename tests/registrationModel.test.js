import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyRegistrationType,
  buildRegistrationPayload,
  emptyStudent,
  initialRegistrationForm,
  normalisePhone,
  validateRegistration,
} from '../src/registration/registrationModel.js'

function validPrimary(form) {
  form.primary.fullName = 'Primary Adult'
  form.primary.email = 'adult@example.com'
  form.primary.phone = '+447700900123'
  form.primary.preferredLocationId = 'NEWCASTLE'
  form.emergencyContact = { name: 'Emergency Person', phone: '+447700900999' }
  form.privacyAccepted = true
  form.mediaConsent = 'declined'
  form.informationAccurate = true
  form.signedBy = 'Primary Adult'
  return form
}

function validChildForm() {
  let form = validPrimary(initialRegistrationForm())
  form = applyRegistrationType(form, 'children')
  form.primary.relationshipToChildren = 'parent'
  form.children[0].fullName = 'Child One'
  form.children[0].dateOfBirth = '2015-01-01'
  form.children[0].preferredLocationId = 'NEWCASTLE'
  form.children[0].foodAllergies.status = 'none'
  return form
}

test('registration type creates stable child card identifiers', () => {
  const form = applyRegistrationType(initialRegistrationForm(), 'children')
  assert.equal(form.children.length, 1)
  assert.match(form.children[0].personId, /^PERSON-/)
})

test('adult student reuses the adult person id rather than duplicating the person', () => {
  const form = applyRegistrationType(initialRegistrationForm(), 'adult')
  assert.equal(form.adultStudent.personId, form.primary.personId)
})

test('child allergy answer is explicitly required', () => {
  const form = validChildForm()
  form.children[0].foodAllergies.status = ''
  const errors = validateRegistration(form)
  assert.ok(errors['children.0.foodAllergies.status'])
})

test('yes allergy requires a named or free-text allergen', () => {
  const form = validChildForm()
  form.children[0].foodAllergies.status = 'yes'
  const errors = validateRegistration(form)
  assert.ok(errors['children.0.foodAllergies.allergens'])
})

test('contact inheritance is represented by source fields and does not copy guardian values', () => {
  const form = validChildForm()
  form.children[0].contactPreferences.emailSource = 'guardian'
  form.children[0].ownEmail = ''
  const payload = buildRegistrationPayload({ form, requestId: 'client-test-request-1234' })
  const childPerson = payload.people.find((person) => person.personId === form.children[0].personId)
  assert.equal(childPerson.email, '')
  assert.equal(payload.students[0].contactPreferences.emailSource, 'guardian')
  assert.equal(payload.students[0].contactPreferences.guardianPersonId, form.primary.personId)
})

test('a child can independently use own email while inheriting phone and address', () => {
  const form = validChildForm()
  const child = form.children[0]
  child.contactPreferences.emailSource = 'student'
  child.ownEmail = 'child@example.com'
  child.contactPreferences.phoneSource = 'guardian'
  child.contactPreferences.addressSource = 'guardian'
  const payload = buildRegistrationPayload({ form, requestId: 'client-test-request-5678' })
  const childPerson = payload.people.find((person) => person.personId === child.personId)
  assert.equal(childPerson.email, 'child@example.com')
  assert.equal(childPerson.phone, '')
  assert.equal(childPerson.address.line1, '')
})

test('multiple children may keep different location and course preferences', () => {
  const form = validChildForm()
  const second = emptyStudent({ studentType: 'child', preferredLocationId: 'DURHAM' })
  second.fullName = 'Child Two'
  second.dateOfBirth = '2017-01-01'
  second.foodAllergies.status = 'unknown'
  second.preferredClassId = 'COURSE-CARNATIC-VOCAL'
  form.children.push(second)
  const errors = validateRegistration(form)
  assert.deepEqual(errors, {})
  const payload = buildRegistrationPayload({ form, requestId: 'client-test-request-9012' })
  assert.equal(payload.students.length, 2)
  assert.equal(payload.students[1].preferredLocationId, 'DURHAM')
})

test('combined registration produces one adult person plus child people, not a duplicated adult', () => {
  let form = validPrimary(initialRegistrationForm())
  form.primary.dateOfBirth = '1988-02-01'
  form = applyRegistrationType(form, 'adult-and-children')
  form.primary.relationshipToChildren = 'parent'
  form.adultStudent.preferredLocationId = 'NEWCASTLE'
  form.adultStudent.foodAllergies.status = 'none'
  form.children[0].fullName = 'Child One'
  form.children[0].dateOfBirth = '2016-03-01'
  form.children[0].preferredLocationId = 'DURHAM'
  form.children[0].foodAllergies.status = 'none'
  const errors = validateRegistration(form)
  assert.deepEqual(errors, {})
  const payload = buildRegistrationPayload({ form, requestId: 'client-test-request-3456' })
  assert.equal(payload.people.filter((person) => person.personId === form.primary.personId).length, 1)
  assert.ok(payload.people.find((person) => person.personId === form.primary.personId).roles.includes('student'))
  assert.equal(payload.students.length, 2)
})


test('phone validation requires international country-code format', () => {
  const form = validChildForm()
  form.primary.phone = '07700 900123'
  const errors = validateRegistration(form)
  assert.ok(errors['primary.phone'])
  form.primary.phone = '+44 7700 900123'
  assert.equal(validateRegistration(form)['primary.phone'], undefined)
})

test('phone numbers are normalised to E.164-style storage', () => {
  assert.equal(normalisePhone('+44 (7700) 900-123'), '+447700900123')
  const form = validChildForm()
  form.primary.phone = '+44 (7700) 900-123'
  form.emergencyContact.phone = '+44 7700 900 999'
  const payload = buildRegistrationPayload({ form, requestId: 'client-test-request-phone' })
  assert.equal(payload.people[0].phone, '+447700900123')
  assert.equal(payload.emergencyContact.phone, '+447700900999')
})
