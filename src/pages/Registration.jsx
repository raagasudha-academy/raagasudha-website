import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ACADEMY_COURSES, ACADEMY_LOCATIONS, courseById, locationById } from '../data/academyCatalog'
import {
  ALLERGEN_OPTIONS,
  applyRegistrationType,
  buildRegistrationPayload,
  createRequestId,
  emptyStudent,
  initialRegistrationForm,
  validateRegistration,
} from '../registration/registrationModel'
import { submitRegistration, uploadStudentPhoto } from '../services/registrationApi'

const STEPS = [
  'Registration type',
  'Adult / guardian',
  'Students',
  'Emergency & consent',
  'Review',
]

const childTypes = new Set(['children', 'adult-and-children'])
const adultStudentTypes = new Set(['adult', 'adult-and-children'])

function ErrorText({ error }) {
  if (!error) return null
  return <small className="field-error">{error}</small>
}

function AddressFields({ value, onChange, prefix = '' }) {
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue })
  return (
    <div className="registration-address-grid">
      <label className="registration-field registration-field-wide-grid">
        <span>Address line 1</span>
        <input
          type="text"
          autoComplete={`${prefix}address-line1`.trim()}
          value={value.line1}
          onChange={(event) => update('line1', event.target.value)}
        />
      </label>
      <label className="registration-field registration-field-wide-grid">
        <span>Address line 2</span>
        <input
          type="text"
          autoComplete={`${prefix}address-line2`.trim()}
          value={value.line2}
          onChange={(event) => update('line2', event.target.value)}
        />
      </label>
      <label className="registration-field">
        <span>Town / city</span>
        <input
          type="text"
          autoComplete={`${prefix}address-level2`.trim()}
          value={value.town}
          onChange={(event) => update('town', event.target.value)}
        />
      </label>
      <label className="registration-field">
        <span>County</span>
        <input
          type="text"
          autoComplete={`${prefix}address-level1`.trim()}
          value={value.county}
          onChange={(event) => update('county', event.target.value)}
        />
      </label>
      <label className="registration-field">
        <span>Postcode</span>
        <input
          type="text"
          autoComplete={`${prefix}postal-code`.trim()}
          value={value.postcode}
          onChange={(event) => update('postcode', event.target.value)}
        />
      </label>
    </div>
  )
}

function LocationSelect({ value, onChange, error, label = 'Preferred academy location *' }) {
  return (
    <label className="registration-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)}>
        <option value="">Choose a location</option>
        {ACADEMY_LOCATIONS.map((location) => (
          <option key={location.id} value={location.id}>{location.name}</option>
        ))}
      </select>
      <ErrorText error={error} />
    </label>
  )
}

function StudentCard({
  student,
  index,
  isAdult,
  primary,
  onChange,
  onRemove,
  errors,
  clearUploadedPhoto,
}) {
  const path = isAdult ? 'adultStudent' : `children.${index}`
  const set = (key, value) => onChange({ ...student, [key]: value })
  const setContactSource = (key, value) =>
    set('contactPreferences', { ...student.contactPreferences, [key]: value })
  const setAllergy = (key, value) =>
    set('foodAllergies', { ...student.foodAllergies, [key]: value })

  const toggleAllergen = (allergen) => {
    const current = new Set(student.foodAllergies.allergens)
    if (current.has(allergen)) current.delete(allergen)
    else current.add(allergen)
    setAllergy('allergens', [...current])
  }

  const photoLabel = student.photoFile ? student.photoFile.name : 'No photograph selected'

  return (
    <article className="registration-student-card">
      <div className="registration-student-card-header">
        <div>
          <p className="registration-mini-eyebrow">{isAdult ? 'Adult student' : `Child ${index + 1}`}</p>
          <h3>{isAdult ? (primary.fullName || 'Your student details') : (student.fullName || `Child ${index + 1}`)}</h3>
        </div>
        {!isAdult && index > 0 && (
          <button type="button" className="registration-remove-button" onClick={onRemove}>
            Remove child
          </button>
        )}
      </div>

      {isAdult ? (
        <div className="registration-readonly-person">
          <div><span>Name</span><strong>{primary.fullName || 'Not entered yet'}</strong></div>
          <div><span>Date of birth</span><strong>{primary.dateOfBirth || 'Not entered yet'}</strong></div>
          <p>Your identity and contact details are captured once in the adult section; the fields below are student-specific.</p>
        </div>
      ) : (
        <>
          <div className="registration-grid two-columns">
            <label className="registration-field">
              <span>Full legal name *</span>
              <input
                type="text"
                value={student.fullName}
                onChange={(event) => set('fullName', event.target.value)}
                aria-invalid={Boolean(errors[`${path}.fullName`])}
              />
              <ErrorText error={errors[`${path}.fullName`]} />
            </label>
            <label className="registration-field">
              <span>Date of birth *</span>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={student.dateOfBirth}
                onChange={(event) => set('dateOfBirth', event.target.value)}
                aria-invalid={Boolean(errors[`${path}.dateOfBirth`])}
              />
              <ErrorText error={errors[`${path}.dateOfBirth`]} />
            </label>
            <label className="registration-field">
              <span>Gender</span>
              <select value={student.gender} onChange={(event) => set('gender', event.target.value)}>
                <option value="">Prefer not to say / not specified</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="self-described">Self-described</option>
              </select>
            </label>
          </div>

          <div className="registration-subsection">
            <div className="registration-subsection-heading">
              <h4>Contact inheritance</h4>
              <p>Each detail can independently use the primary parent/guardian contact or the child’s own details.</p>
            </div>

            <div className="registration-inheritance-row">
              <label className="registration-checkbox compact">
                <input
                  type="checkbox"
                  checked={student.contactPreferences.emailSource === 'guardian'}
                  onChange={(event) => setContactSource('emailSource', event.target.checked ? 'guardian' : 'student')}
                />
                <span>Use parent/guardian email</span>
              </label>
              {student.contactPreferences.emailSource === 'student' && (
                <label className="registration-field inheritance-value">
                  <span>Child email</span>
                  <input type="email" value={student.ownEmail} onChange={(event) => set('ownEmail', event.target.value)} />
                  <ErrorText error={errors[`${path}.ownEmail`]} />
                </label>
              )}
            </div>

            <div className="registration-inheritance-row">
              <label className="registration-checkbox compact">
                <input
                  type="checkbox"
                  checked={student.contactPreferences.phoneSource === 'guardian'}
                  onChange={(event) => setContactSource('phoneSource', event.target.checked ? 'guardian' : 'student')}
                />
                <span>Use parent/guardian mobile</span>
              </label>
              {student.contactPreferences.phoneSource === 'student' && (
                <label className="registration-field inheritance-value">
                  <span>Child mobile</span>
                  <input type="tel" inputMode="tel" placeholder="e.g. +44 7700 900000" value={student.ownPhone} onChange={(event) => set('ownPhone', event.target.value)} />
                  <small className="field-help">Use international format: + country code and number.</small>
                  <ErrorText error={errors[`${path}.ownPhone`]} />
                </label>
              )}
            </div>

            <div className="registration-inheritance-row registration-inheritance-address">
              <label className="registration-checkbox compact">
                <input
                  type="checkbox"
                  checked={student.contactPreferences.addressSource === 'guardian'}
                  onChange={(event) => setContactSource('addressSource', event.target.checked ? 'guardian' : 'student')}
                />
                <span>Use parent/guardian home address</span>
              </label>
              {student.contactPreferences.addressSource === 'student' && (
                <div className="inheritance-value address-value">
                  <AddressFields
                    value={student.ownAddress}
                    onChange={(address) => set('ownAddress', address)}
                  />
                  <ErrorText error={errors[`${path}.ownAddress.line1`]} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="registration-subsection">
        <div className="registration-subsection-heading">
          <h4>Class preferences</h4>
          <p>A preference is not an approved class enrolment. Final enrolment is completed through Sadhana after review.</p>
        </div>
        <div className="registration-grid two-columns">
          <LocationSelect
            value={student.preferredLocationId}
            onChange={(value) => set('preferredLocationId', value)}
            error={errors[`${path}.preferredLocationId`]}
          />
          <label className="registration-field">
            <span>Preferred course / class</span>
            <select value={student.preferredClassId} onChange={(event) => set('preferredClassId', event.target.value)}>
              <option value="">No preference yet</option>
              {ACADEMY_COURSES.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <ErrorText error={errors[`${path}.preferredClassId`]} />
          </label>
        </div>

        <label className="registration-checkbox registration-request-place">
          <input
            type="checkbox"
            checked={student.classEnrolmentRequested}
            onChange={(event) => set('classEnrolmentRequested', event.target.checked)}
          />
          <span>I would like Raaga Sudha to consider a class place for this student.</span>
        </label>

        {student.classEnrolmentRequested && (
          <label className="registration-field registration-date-field">
            <span>Preferred start date *</span>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={student.proposedStartDate}
              onChange={(event) => set('proposedStartDate', event.target.value)}
            />
            <ErrorText error={errors[`${path}.proposedStartDate`]} />
          </label>
        )}
      </div>

      <div className="registration-subsection registration-allergy-section">
        <div className="registration-subsection-heading">
          <h4>Food allergy information *</h4>
          <p>This must be answered separately for every student. We do not assume that a blank answer means “no”.</p>
        </div>
        <div className="registration-choice-row registration-choice-row-wide">
          {[
            ['none', 'No known food allergies'],
            ['yes', 'Yes'],
            ['unknown', 'Not known / not confirmed'],
          ].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name={`${student.personId}-allergy-status`}
                value={value}
                checked={student.foodAllergies.status === value}
                onChange={() => setAllergy('status', value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <ErrorText error={errors[`${path}.foodAllergies.status`]} />

        {student.foodAllergies.status === 'yes' && (
          <div className="registration-allergy-details">
            <fieldset className="registration-question">
              <legend>Known allergens *</legend>
              <div className="registration-check-grid">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <label className="registration-checkbox compact" key={allergen}>
                    <input
                      type="checkbox"
                      checked={student.foodAllergies.allergens.includes(allergen)}
                      onChange={() => toggleAllergen(allergen)}
                    />
                    <span>{allergen}</span>
                  </label>
                ))}
              </div>
              <ErrorText error={errors[`${path}.foodAllergies.allergens`]} />
            </fieldset>

            <div className="registration-grid two-columns">
              <label className="registration-field">
                <span>Other allergen description</span>
                <input
                  type="text"
                  value={student.foodAllergies.otherAllergens}
                  onChange={(event) => setAllergy('otherAllergens', event.target.value)}
                />
              </label>
              <label className="registration-checkbox registration-medication-check">
                <input
                  type="checkbox"
                  checked={student.foodAllergies.carriesEmergencyMedication}
                  onChange={(event) => setAllergy('carriesEmergencyMedication', event.target.checked)}
                />
                <span>Student carries prescribed emergency allergy medication</span>
              </label>
            </div>

            <label className="registration-field registration-field-wide">
              <span>Reaction and severity information</span>
              <textarea
                rows="3"
                value={student.foodAllergies.reactionDetails}
                onChange={(event) => setAllergy('reactionDetails', event.target.value)}
              />
            </label>
            <label className="registration-field registration-field-wide">
              <span>Emergency instructions or precautions</span>
              <textarea
                rows="3"
                value={student.foodAllergies.emergencyInstructions}
                onChange={(event) => setAllergy('emergencyInstructions', event.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="registration-subsection">
        <div className="registration-subsection-heading">
          <h4>Photograph and student notes</h4>
          <p>Photographs are optional and stored privately. Uploading a photo does not grant photography/media consent.</p>
        </div>
        <label className="registration-upload-field">
          <span>Student photograph</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              clearUploadedPhoto(student.personId)
              set('photoFile', event.target.files?.[0] || null)
            }}
          />
          <small>{photoLabel} · JPEG, PNG or WebP · maximum 5 MB</small>
          <ErrorText error={errors[`${path}.photoFile`]} />
        </label>

        <label className="registration-field registration-field-wide">
          <span>Other health / support information</span>
          <textarea
            rows="3"
            value={student.healthNotes}
            onChange={(event) => set('healthNotes', event.target.value)}
            placeholder="Optional. Include only information relevant to supporting the student safely."
          />
        </label>
        <label className="registration-field registration-field-wide">
          <span>Student-specific notes</span>
          <textarea rows="3" value={student.notes} onChange={(event) => set('notes', event.target.value)} />
        </label>
      </div>

      <details className="registration-override-details">
        <summary>Optional: different emergency contact or photography/media consent</summary>
        <div className="registration-subsection compact-section">
          <label className="registration-checkbox">
            <input
              type="checkbox"
              checked={student.emergencyContactOverride.enabled}
              onChange={(event) =>
                set('emergencyContactOverride', {
                  ...student.emergencyContactOverride,
                  enabled: event.target.checked,
                })
              }
            />
            <span>Use a different emergency contact for this student</span>
          </label>
          {student.emergencyContactOverride.enabled && (
            <div className="registration-grid two-columns registration-override-grid">
              <label className="registration-field">
                <span>Emergency contact name *</span>
                <input
                  type="text"
                  value={student.emergencyContactOverride.name}
                  onChange={(event) => set('emergencyContactOverride', {
                    ...student.emergencyContactOverride,
                    name: event.target.value,
                  })}
                />
                <ErrorText error={errors[`${path}.emergencyContactOverride.name`]} />
              </label>
              <label className="registration-field">
                <span>Emergency contact telephone *</span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. +44 7700 900000"
                  value={student.emergencyContactOverride.phone}
                  onChange={(event) => set('emergencyContactOverride', {
                    ...student.emergencyContactOverride,
                    phone: event.target.value,
                  })}
                />
                <small className="field-help">Use international format: + country code and number.</small>
                <ErrorText error={errors[`${path}.emergencyContactOverride.phone`]} />
              </label>
            </div>
          )}
          <label className="registration-field registration-media-override">
            <span>Photography/media consent for this student</span>
            <select value={student.mediaConsentOverride} onChange={(event) => set('mediaConsentOverride', event.target.value)}>
              <option value="inherit">Same as the main registration choice</option>
              <option value="granted">Yes — allow photography/media for this student</option>
              <option value="declined">No — do not allow photography/media for this student</option>
            </select>
            <small className="field-help">
              By default, this student uses the photography/media choice you make for the whole registration. Change this only if this student needs a different choice.
            </small>
          </label>
        </div>
      </details>
    </article>
  )
}

function ReviewPerson({ title, person, onEdit }) {
  return (
    <article className="registration-review-card">
      <div className="registration-review-heading">
        <h3>{title}</h3>
        <button type="button" onClick={onEdit}>Edit</button>
      </div>
      <dl>
        <div><dt>Name</dt><dd>{person.fullName || '—'}</dd></div>
        <div><dt>Email</dt><dd>{person.email || '—'}</dd></div>
        <div><dt>Mobile</dt><dd>{person.phone || '—'}</dd></div>
        <div><dt>Preferred location</dt><dd>{locationById[person.preferredLocationId]?.name || '—'}</dd></div>
      </dl>
    </article>
  )
}

function ReviewStudent({ student, title, onEdit }) {
  return (
    <article className="registration-review-card">
      <div className="registration-review-heading">
        <h3>{title}</h3>
        <button type="button" onClick={onEdit}>Edit</button>
      </div>
      <dl>
        <div><dt>Name</dt><dd>{student.fullName || title}</dd></div>
        <div><dt>Location</dt><dd>{locationById[student.preferredLocationId]?.name || '—'}</dd></div>
        <div><dt>Course</dt><dd>{courseById[student.preferredClassId]?.name || 'No preference yet'}</dd></div>
        <div><dt>Food allergy status</dt><dd>{student.foodAllergies.status || 'Not answered'}</dd></div>
        <div><dt>Photograph</dt><dd>{student.photoFile ? student.photoFile.name : 'Not supplied'}</dd></div>
      </dl>
    </article>
  )
}

function Registration() {
  const [form, setForm] = useState(initialRegistrationForm)
  const [requestId, setRequestId] = useState(createRequestId)
  const [step, setStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [uploadedPhotos, setUploadedPhotos] = useState({})

  const hasChildren = childTypes.has(form.registrationType)
  const adultIsStudent = adultStudentTypes.has(form.registrationType)

  const allStudents = useMemo(() => {
    const students = []
    if (adultIsStudent && form.adultStudent) {
      students.push({
        ...form.adultStudent,
        fullName: form.primary.fullName,
        dateOfBirth: form.primary.dateOfBirth,
      })
    }
    students.push(...form.children)
    return students
  }, [adultIsStudent, form.adultStudent, form.children, form.primary.dateOfBirth, form.primary.fullName])

  const clearError = (path) => {
    setFieldErrors((current) => {
      if (!current[path]) return current
      const next = { ...current }
      delete next[path]
      return next
    })
  }

  const updatePrimary = (key, value) => {
    setForm((current) => {
      const primary = { ...current.primary, [key]: value }
      let adultStudent = current.adultStudent
      let children = current.children

      if (key === 'preferredLocationId') {
        if (adultStudent && !adultStudent.preferredLocationId) {
          adultStudent = { ...adultStudent, preferredLocationId: value }
        }
        children = children.map((child) =>
          child.preferredLocationId ? child : { ...child, preferredLocationId: value }
        )
      }

      return { ...current, primary, adultStudent, children }
    })
    clearError(`primary.${key}`)
  }

  const changeRegistrationType = (registrationType) => {
    setForm((current) => applyRegistrationType(current, registrationType))
    clearError('registrationType')
  }

  const updateChild = (personId, updated) => {
    setForm((current) => ({
      ...current,
      children: current.children.map((child) => child.personId === personId ? updated : child),
    }))
  }

  const addChild = () => {
    setForm((current) => ({
      ...current,
      children: [
        ...current.children,
        emptyStudent({
          studentType: 'child',
          preferredLocationId: current.primary.preferredLocationId,
        }),
      ],
    }))
  }

  const removeChild = (personId) => {
    setForm((current) => ({
      ...current,
      children: current.children.filter((child) => child.personId !== personId),
    }))
    setUploadedPhotos((current) => {
      const next = { ...current }
      delete next[personId]
      return next
    })
  }

  const clearUploadedPhoto = (personId) => {
    setUploadedPhotos((current) => {
      if (!current[personId]) return current
      const next = { ...current }
      delete next[personId]
      return next
    })
  }

  const errorsForStep = (errors, targetStep) => {
    const keys = Object.keys(errors)
    if (targetStep === 0) return keys.filter((key) => key === 'registrationType')
    if (targetStep === 1) return keys.filter((key) => key.startsWith('primary.') || key.startsWith('secondaryGuardian.'))
    if (targetStep === 2) return keys.filter((key) => key === 'children' || key.startsWith('children.') || key.startsWith('adultStudent.'))
    if (targetStep === 3) {
      return keys.filter((key) =>
        key.startsWith('emergencyContact.') ||
        ['privacyAccepted', 'mediaConsent', 'informationAccurate', 'signedBy'].includes(key)
      )
    }
    return keys
  }

  const goNext = () => {
    const errors = validateRegistration(form)
    const blocking = errorsForStep(errors, step)
    if (blocking.length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setFieldErrors({})
    setStep((current) => Math.max(current - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setSubmitError('')
    const errors = validateRegistration(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      const firstStepWithError = [0, 1, 2, 3].find((candidate) => errorsForStep(errors, candidate).length)
      if (firstStepWithError !== undefined) setStep(firstStepWithError)
      return
    }

    setSubmitting(true)
    try {
      const photoRefs = { ...uploadedPhotos }
      for (const student of allStudents) {
        if (student.photoFile && !photoRefs[student.personId]) {
          photoRefs[student.personId] = await uploadStudentPhoto({
            requestId,
            personId: student.personId,
            file: student.photoFile,
          })
        }
      }
      setUploadedPhotos(photoRefs)

      const payload = buildRegistrationPayload({
        form,
        requestId,
        uploadedPhotos: photoRefs,
      })
      const result = await submitRegistration(payload)
      setSuccess(result)
    } catch (error) {
      if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors)
      }
      setSubmitError(error.message || 'Registration could not be submitted.')
    } finally {
      setSubmitting(false)
    }
  }

  const startAnother = () => {
    setForm(initialRegistrationForm())
    setRequestId(createRequestId())
    setStep(0)
    setFieldErrors({})
    setSubmitError('')
    setSubmitting(false)
    setSuccess(null)
    setUploadedPhotos({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (success) {
    return (
      <section className="registration-success section">
        <div className="registration-success-card">
          <span className="registration-success-mark" aria-hidden="true">✓</span>
          <p className="eyebrow">Registration received</p>
          <h2>Thank you. We have received your registration.</h2>
          <p>
            This is an application for review. No permanent Sadhana student ID,
            family number, login or class enrolment has been created yet.
          </p>
          <div className="registration-reference">
            <span>Registration reference</span>
            <strong>{success.registrationId}</strong>
          </div>
          <div className="registration-success-actions">
            <Link className="button button-primary" to="/classes">Explore Classes</Link>
            <button className="registration-link-button" type="button" onClick={startAnother}>
              Submit another registration
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="registration-intro section">
        <div className="registration-intro-heading">
          <p className="eyebrow">Join Raaga Sudha</p>
          <h1>New Registration</h1>
          <p className="registration-intro-lead">
            Register yourself, one or more children, or your family together in one application.
          </p>
        </div>
        <div className="registration-intro-copy">
          <p className="registration-intro-kicker">Before you begin</p>
          <p>Fields marked with an asterisk are required. You can review and edit everything before submitting.</p>
          <p>Food allergy details and photographs are handled as sensitive/private information and are not shown in public pages.</p>
        </div>
      </section>

      <section className="registration-form-section">
        <div className="registration-form">
          <nav className="registration-stepper" aria-label="Registration progress">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === step ? 'active' : index < step ? 'complete' : ''}
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
              >
                <span>{index < step ? '✓' : index + 1}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </nav>

          {step === 0 && (
            <div className="registration-card registration-type-card">
              <div className="registration-card-heading">
                <span>01</span>
                <div><p>New registration</p><h2>Who are you registering?</h2></div>
              </div>
              <div className="registration-type-options">
                {[
                  ['adult', 'Myself', 'I am an adult registering as a student.'],
                  ['children', 'My child / children', 'I am a parent or legal guardian registering one or more children.'],
                  ['adult-and-children', 'Myself and my child / children', 'I am registering as a student and also registering one or more children.'],
                ].map(([value, title, copy]) => (
                  <label className={form.registrationType === value ? 'selected' : ''} key={value}>
                    <input
                      type="radio"
                      name="registrationType"
                      value={value}
                      checked={form.registrationType === value}
                      onChange={() => changeRegistrationType(value)}
                    />
                    <span className="registration-type-check" aria-hidden="true">✓</span>
                    <strong>{title}</strong>
                    <small>{copy}</small>
                  </label>
                ))}
              </div>
              <ErrorText error={fieldErrors.registrationType} />
            </div>
          )}

          {step === 1 && (
            <>
              <div className="registration-card">
                <div className="registration-card-heading">
                  <span>02</span>
                  <div>
                    <p>{adultIsStudent ? 'Adult applicant' : 'Primary parent / guardian'}</p>
                    <h2>Your details</h2>
                  </div>
                </div>
                <div className="registration-grid two-columns">
                  <label className="registration-field">
                    <span>Full legal name *</span>
                    <input type="text" autoComplete="name" value={form.primary.fullName} onChange={(event) => updatePrimary('fullName', event.target.value)} />
                    <ErrorText error={fieldErrors['primary.fullName']} />
                  </label>
                  <label className="registration-field">
                    <span>Date of birth {adultIsStudent ? '*' : ''}</span>
                    <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.primary.dateOfBirth} onChange={(event) => updatePrimary('dateOfBirth', event.target.value)} />
                    <ErrorText error={fieldErrors['primary.dateOfBirth']} />
                  </label>
                  <label className="registration-field">
                    <span>Gender</span>
                    <select value={form.primary.gender} onChange={(event) => updatePrimary('gender', event.target.value)}>
                      <option value="">Prefer not to say / not specified</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="self-described">Self-described</option>
                    </select>
                  </label>
                  <LocationSelect
                    value={form.primary.preferredLocationId}
                    onChange={(value) => updatePrimary('preferredLocationId', value)}
                    error={fieldErrors['primary.preferredLocationId']}
                  />
                  <label className="registration-field">
                    <span>Email address *</span>
                    <input type="email" autoComplete="email" value={form.primary.email} onChange={(event) => updatePrimary('email', event.target.value)} />
                    <ErrorText error={fieldErrors['primary.email']} />
                  </label>
                  <label className="registration-field">
                    <span>Mobile phone *</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. +44 7700 900000" value={form.primary.phone} onChange={(event) => updatePrimary('phone', event.target.value)} />
                    <small className="field-help">Use international format: + country code and number.</small>
                    <ErrorText error={fieldErrors['primary.phone']} />
                  </label>
                </div>

                {hasChildren && (
                  <label className="registration-field registration-field-wide registration-narrow-field">
                    <span>Relationship to child / children *</span>
                    <select value={form.primary.relationshipToChildren} onChange={(event) => updatePrimary('relationshipToChildren', event.target.value)}>
                      <option value="">Choose relationship</option>
                      <option value="parent">Parent</option>
                      <option value="legal-guardian">Legal guardian</option>
                    </select>
                    <ErrorText error={fieldErrors['primary.relationshipToChildren']} />
                  </label>
                )}

                <div className="registration-subsection">
                  <div className="registration-subsection-heading">
                    <h4>Home address</h4>
                    <p>Optional. Children can independently inherit this address or supply a different one.</p>
                  </div>
                  <AddressFields value={form.primary.address} onChange={(address) => updatePrimary('address', address)} />
                </div>
              </div>

              {hasChildren && (
                <div className="registration-card registration-card-soft">
                  <div className="registration-card-heading compact-heading">
                    <span>+</span>
                    <div><p>Optional</p><h2>Additional parent / guardian</h2></div>
                  </div>
                  <label className="registration-checkbox">
                    <input
                      type="checkbox"
                      checked={form.secondaryGuardian.enabled}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        secondaryGuardian: { ...current.secondaryGuardian, enabled: event.target.checked },
                      }))}
                    />
                    <span>Add a second parent or guardian to this application</span>
                  </label>
                  {form.secondaryGuardian.enabled && (
                    <div className="registration-grid two-columns registration-secondary-grid">
                      {[
                        ['fullName', 'Full name *', 'text'],
                        ['relationshipToChild', 'Relationship to child *', 'text'],
                        ['email', 'Email address', 'email'],
                        ['phone', 'Mobile phone', 'tel'],
                      ].map(([key, label, type]) => (
                        <label className="registration-field" key={key}>
                          <span>{label}</span>
                          <input
                            type={type}
                            inputMode={type === 'tel' ? 'tel' : undefined}
                            placeholder={type === 'tel' ? 'e.g. +44 7700 900000' : undefined}
                            value={form.secondaryGuardian[key]}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              secondaryGuardian: { ...current.secondaryGuardian, [key]: event.target.value },
                            }))}
                          />
                          {type === 'tel' && <small className="field-help">Use international format: + country code and number.</small>}
                          <ErrorText error={fieldErrors[`secondaryGuardian.${key}`]} />
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="registration-security-note">
                    Listing an additional guardian does not automatically grant access to a child in Sadhana. Guardian access is verified separately.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="registration-students-stack">
              <div className="registration-section-title">
                <p className="eyebrow">Student information</p>
                <h2>Tell us about each student.</h2>
                <p>Each student keeps their own class preference, contact inheritance, food allergy information and optional photograph.</p>
              </div>

              {adultIsStudent && form.adultStudent && (
                <StudentCard
                  student={form.adultStudent}
                  isAdult
                  primary={form.primary}
                  onChange={(updated) => setForm((current) => ({ ...current, adultStudent: updated }))}
                  errors={fieldErrors}
                  clearUploadedPhoto={clearUploadedPhoto}
                />
              )}

              {form.children.map((child, index) => (
                <StudentCard
                  key={child.personId}
                  student={child}
                  index={index}
                  primary={form.primary}
                  onChange={(updated) => updateChild(child.personId, updated)}
                  onRemove={() => removeChild(child.personId)}
                  errors={fieldErrors}
                  clearUploadedPhoto={clearUploadedPhoto}
                />
              ))}

              {hasChildren && (
                <button type="button" className="registration-add-child" onClick={addChild}>
                  <span>+</span> Add Another Child
                </button>
              )}
              <ErrorText error={fieldErrors.children} />
            </div>
          )}

          {step === 3 && (
            <>
              <div className="registration-card">
                <div className="registration-card-heading">
                  <span>04</span>
                  <div><p>Emergency contact</p><h2>Who should we contact in an emergency?</h2></div>
                </div>
                <div className="registration-grid two-columns">
                  <label className="registration-field">
                    <span>Emergency contact name *</span>
                    <input
                      type="text"
                      value={form.emergencyContact.name}
                      onChange={(event) => setForm((current) => ({ ...current, emergencyContact: { ...current.emergencyContact, name: event.target.value } }))}
                    />
                    <ErrorText error={fieldErrors['emergencyContact.name']} />
                  </label>
                  <label className="registration-field">
                    <span>Emergency contact telephone *</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="e.g. +44 7700 900000"
                      value={form.emergencyContact.phone}
                      onChange={(event) => setForm((current) => ({ ...current, emergencyContact: { ...current.emergencyContact, phone: event.target.value } }))}
                    />
                    <small className="field-help">Use international format: + country code and number.</small>
                    <ErrorText error={fieldErrors['emergencyContact.phone']} />
                  </label>
                </div>
              </div>

              <div className="registration-card registration-card-soft">
                <div className="registration-card-heading">
                  <span>05</span>
                  <div><p>Privacy & consent</p><h2>Confirm your choices.</h2></div>
                </div>
                <div className="registration-declarations">
                  <label className="registration-checkbox">
                    <input
                      type="checkbox"
                      checked={form.privacyAccepted}
                      onChange={(event) => setForm((current) => ({ ...current, privacyAccepted: event.target.checked }))}
                    />
                    <span>
                      I acknowledge the Raaga Sudha{' '}
                      <a href={`${import.meta.env.BASE_URL}governance/DataProtection.pdf`} target="_blank" rel="noreferrer">
                        Data Protection Policy
                      </a>{' '}
                      and understand how registration information will be used. *
                    </span>
                  </label>
                  <ErrorText error={fieldErrors.privacyAccepted} />

                  <fieldset className="registration-question registration-media-consent">
                    <legend>Photography / media consent *</legend>
                    <p>This choice is separate from uploading a student photograph.</p>
                    <div className="registration-choice-row">
                      <label>
                        <input type="radio" name="mediaConsent" checked={form.mediaConsent === 'granted'} onChange={() => setForm((current) => ({ ...current, mediaConsent: 'granted' }))} />
                        <span>Grant consent</span>
                      </label>
                      <label>
                        <input type="radio" name="mediaConsent" checked={form.mediaConsent === 'declined'} onChange={() => setForm((current) => ({ ...current, mediaConsent: 'declined' }))} />
                        <span>Decline consent</span>
                      </label>
                    </div>
                    <ErrorText error={fieldErrors.mediaConsent} />
                  </fieldset>

                  <label className="registration-field registration-field-wide">
                    <span>Additional registration notes</span>
                    <textarea rows="4" value={form.registrationNotes} onChange={(event) => setForm((current) => ({ ...current, registrationNotes: event.target.value }))} />
                  </label>

                  <label className="registration-checkbox registration-accuracy-check">
                    <input
                      type="checkbox"
                      checked={form.informationAccurate}
                      onChange={(event) => setForm((current) => ({ ...current, informationAccurate: event.target.checked }))}
                    />
                    <span>I confirm that the information in this application is accurate. *</span>
                  </label>
                  <ErrorText error={fieldErrors.informationAccurate} />

                  <label className="registration-field registration-field-wide registration-signature">
                    <span>Your full name *</span>
                    <input type="text" value={form.signedBy} onChange={(event) => setForm((current) => ({ ...current, signedBy: event.target.value }))} />
                    <small className="field-help">Typing your full name records who submitted this registration.</small>
                    <ErrorText error={fieldErrors.signedBy} />
                  </label>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="registration-review-section">
              <div className="registration-section-title">
                <p className="eyebrow">Review</p>
                <h2>Check everything before submitting.</h2>
                <p>You can return to any section to make changes.</p>
              </div>

              <ReviewPerson
                title={adultIsStudent ? 'Adult applicant / student' : 'Primary parent / guardian'}
                person={form.primary}
                onEdit={() => setStep(1)}
              />

              {adultIsStudent && form.adultStudent && (
                <ReviewStudent
                  title={form.primary.fullName || 'Adult student'}
                  student={{ ...form.adultStudent, fullName: form.primary.fullName }}
                  onEdit={() => setStep(2)}
                />
              )}
              {form.children.map((child, index) => (
                <ReviewStudent key={child.personId} student={child} title={child.fullName || `Child ${index + 1}`} onEdit={() => setStep(2)} />
              ))}

              <article className="registration-review-card">
                <div className="registration-review-heading"><h3>Consent & submission</h3><button type="button" onClick={() => setStep(3)}>Edit</button></div>
                <dl>
                  <div><dt>Privacy notice</dt><dd>{form.privacyAccepted ? 'Acknowledged' : 'Not acknowledged'}</dd></div>
                  <div><dt>Media consent</dt><dd>{form.mediaConsent === 'granted' ? 'Granted' : 'Declined'}</dd></div>
                  <div><dt>Emergency contact</dt><dd>{form.emergencyContact.name} · {form.emergencyContact.phone}</dd></div>
                </dl>
              </article>

              <p className="registration-final-note">
                Submitting creates a pending Raaga Sudha application only. Permanent family/student numbers, Sadhana accounts and active class enrolments are created later through the administrator approval process.
              </p>
            </div>
          )}

          <label className="registration-honeypot" aria-hidden="true">
            Website
            <input
              type="text"
              tabIndex="-1"
              autoComplete="off"
              value={form.website}
              onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            />
          </label>

          {submitError && (
            <div className="registration-submit-error" role="alert">
              <strong>We could not submit the registration.</strong>
              <span>{submitError}</span>
            </div>
          )}

          <div className="registration-navigation">
            {step > 0 ? (
              <button type="button" className="registration-back-button" onClick={goBack} disabled={submitting}>Back</button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <button type="button" className="registration-next-button" onClick={goNext}>Continue</button>
            ) : (
              <button type="button" className="registration-submit-button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting securely…' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Registration
