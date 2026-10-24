import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { submitRegistration } from '../services/registrationApi'

const initialForm = {
  studentName: '',
  dateOfBirth: '',
  parentGuardianName: '',
  contactNumber: '',
  email: '',
  hasHealthCondition: 'no',
  healthConditionDetails: '',
  hasFoodAllergies: 'no',
  foodAllergyDetails: '',
  enrolmentAccepted: false,
  informationAccurate: false,
  signedBy: '',
  website: '',
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null

  const birth = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
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

function createRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function Registration() {
  const [form, setForm] = useState(initialForm)
  const [requestId, setRequestId] = useState(createRequestId)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth])
  const isMinor = age !== null && age < 18

  const updateField = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setFieldErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const validate = () => {
    const errors = {}
    const today = new Date().toISOString().slice(0, 10)

    if (!form.studentName.trim()) errors.studentName = 'Please enter the student name.'
    if (!form.dateOfBirth) errors.dateOfBirth = 'Please enter the date of birth.'
    if (form.dateOfBirth && form.dateOfBirth > today) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.'
    }
    if (isMinor && !form.parentGuardianName.trim()) {
      errors.parentGuardianName = 'Please enter the parent or guardian name.'
    }
    if (!form.contactNumber.trim()) errors.contactNumber = 'Please enter a contact number.'
    if (!form.email.trim()) errors.email = 'Please enter an email address.'
    if (form.hasHealthCondition === 'yes' && !form.healthConditionDetails.trim()) {
      errors.healthConditionDetails = 'Please provide the relevant health information.'
    }
    if (form.hasFoodAllergies === 'yes' && !form.foodAllergyDetails.trim()) {
      errors.foodAllergyDetails = 'Please provide the relevant allergy information.'
    }
    if (!form.enrolmentAccepted) {
      errors.enrolmentAccepted = 'Please confirm that you wish to enrol.'
    }
    if (!form.informationAccurate) {
      errors.informationAccurate = 'Please confirm that the information is accurate.'
    }
    if (!form.signedBy.trim()) errors.signedBy = 'Please type your full name.'

    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')

    const errors = validate()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      const firstFieldName = Object.keys(errors)[0]
      window.setTimeout(() => {
        document.querySelector(`[name="${firstFieldName}"]`)?.focus()
      }, 0)
      return
    }

    setSubmitting(true)

    try {
      const result = await submitRegistration({
        requestId,
        studentName: form.studentName.trim(),
        dateOfBirth: form.dateOfBirth,
        parentGuardianName: form.parentGuardianName.trim(),
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim(),
        healthCondition: {
          hasCondition: form.hasHealthCondition === 'yes',
          details:
            form.hasHealthCondition === 'yes'
              ? form.healthConditionDetails.trim()
              : '',
        },
        foodAllergies: {
          hasAllergies: form.hasFoodAllergies === 'yes',
          details:
            form.hasFoodAllergies === 'yes'
              ? form.foodAllergyDetails.trim()
              : '',
        },
        enrolmentAccepted: form.enrolmentAccepted,
        informationAccurate: form.informationAccurate,
        signedBy: form.signedBy.trim(),
        website: form.website,
      })

      setSuccess(result)
    } catch (error) {
      if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors)
      }
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startAnother = () => {
    setForm(initialForm)
    setFieldErrors({})
    setSubmitError('')
    setSuccess(null)
    setRequestId(createRequestId())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (success) {
    return (
      <>
        <section className="registration-success section">
          <div className="registration-success-card">
            <span className="registration-success-mark" aria-hidden="true">✓</span>
            <p className="eyebrow">Registration received</p>
            <h2>Thank you. We have received your registration.</h2>
            <p>
              Keep this reference for your records. A member of the Raaga Sudha
              team will contact you about the next steps.
            </p>

            <div className="registration-reference">
              <span>Registration reference</span>
              <strong>{success.registrationId}</strong>
            </div>

            <div className="registration-success-actions">
              <Link className="button button-primary" to="/classes">
                Explore Classes
              </Link>
              <button className="registration-link-button" type="button" onClick={startAnother}>
                Submit another registration
              </button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="registration-intro section">
        <div className="registration-intro-heading">
          <p className="eyebrow">Join Raaga Sudha</p>
          <h1>Student Registration</h1>
          <p className="registration-intro-lead">
            Tell us a little about the student so we can help them begin their
            musical journey with Raaga Sudha Music Academy.
          </p>
        </div>

        <div className="registration-intro-copy">
          <p className="registration-intro-kicker">Before you begin</p>
          <p>
            The form normally takes only a few minutes. Fields marked with an
            asterisk are required.
          </p>
          <p>
            Health and allergy information is collected only to help us support
            the student's safety and wellbeing during Raaga Sudha activities.
          </p>
        </div>
      </section>

      <section className="registration-form-section">
        <form className="registration-form" onSubmit={handleSubmit} noValidate>
          <div className="registration-card">
            <div className="registration-card-heading">
              <span>01</span>
              <div>
                <p>Student details</p>
                <h2>Who is joining us?</h2>
              </div>
            </div>

            <div className="registration-grid two-columns">
              <label className="registration-field">
                <span>Student name *</span>
                <input
                  type="text"
                  name="studentName"
                  autoComplete="name"
                  value={form.studentName}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.studentName)}
                  aria-describedby={fieldErrors.studentName ? 'studentName-error' : undefined}
                />
                {fieldErrors.studentName && (
                  <small className="field-error" id="studentName-error">{fieldErrors.studentName}</small>
                )}
              </label>

              <label className="registration-field">
                <span>Date of birth *</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={updateField}
                  max={new Date().toISOString().slice(0, 10)}
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                  aria-describedby={fieldErrors.dateOfBirth ? 'dateOfBirth-error' : undefined}
                />
                {fieldErrors.dateOfBirth && (
                  <small className="field-error" id="dateOfBirth-error">{fieldErrors.dateOfBirth}</small>
                )}
              </label>
            </div>

            <label className="registration-field registration-field-wide">
              <span>
                Parent / guardian name {isMinor ? '*' : ''}
              </span>
              <input
                type="text"
                name="parentGuardianName"
                autoComplete="name"
                value={form.parentGuardianName}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.parentGuardianName)}
                aria-describedby={fieldErrors.parentGuardianName ? 'parentGuardianName-error' : 'guardian-help'}
              />
              <small className="field-help" id="guardian-help">
                {isMinor
                  ? 'Required because the student is under 18.'
                  : 'Optional for students aged 18 or over.'}
              </small>
              {fieldErrors.parentGuardianName && (
                <small className="field-error" id="parentGuardianName-error">{fieldErrors.parentGuardianName}</small>
              )}
            </label>
          </div>

          <div className="registration-card">
            <div className="registration-card-heading">
              <span>02</span>
              <div>
                <p>Contact details</p>
                <h2>How can we reach you?</h2>
              </div>
            </div>

            <div className="registration-grid two-columns">
              <label className="registration-field">
                <span>Contact number *</span>
                <input
                  type="tel"
                  name="contactNumber"
                  autoComplete="tel"
                  placeholder="e.g. +44 7700 900000"
                  value={form.contactNumber}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.contactNumber)}
                  aria-describedby={fieldErrors.contactNumber ? 'contactNumber-error' : undefined}
                />
                {fieldErrors.contactNumber && (
                  <small className="field-error" id="contactNumber-error">{fieldErrors.contactNumber}</small>
                )}
              </label>

              <label className="registration-field">
                <span>Email address *</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && (
                  <small className="field-error" id="email-error">{fieldErrors.email}</small>
                )}
              </label>
            </div>
          </div>

          <div className="registration-card registration-card-soft">
            <div className="registration-card-heading">
              <span>03</span>
              <div>
                <p>Health & safety</p>
                <h2>Help us support the student.</h2>
              </div>
            </div>

            <fieldset className="registration-question">
              <legend>Health conditions we should be aware of</legend>
              <div className="registration-choice-row">
                <label>
                  <input
                    type="radio"
                    name="hasHealthCondition"
                    value="no"
                    checked={form.hasHealthCondition === 'no'}
                    onChange={updateField}
                  />
                  <span>None</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="hasHealthCondition"
                    value="yes"
                    checked={form.hasHealthCondition === 'yes'}
                    onChange={updateField}
                  />
                  <span>Yes</span>
                </label>
              </div>

              {form.hasHealthCondition === 'yes' && (
                <label className="registration-field registration-details-field">
                  <span>Please provide relevant details *</span>
                  <textarea
                    name="healthConditionDetails"
                    rows="4"
                    value={form.healthConditionDetails}
                    onChange={updateField}
                    aria-invalid={Boolean(fieldErrors.healthConditionDetails)}
                    aria-describedby={fieldErrors.healthConditionDetails ? 'healthConditionDetails-error' : undefined}
                  />
                  {fieldErrors.healthConditionDetails && (
                    <small className="field-error" id="healthConditionDetails-error">{fieldErrors.healthConditionDetails}</small>
                  )}
                </label>
              )}
            </fieldset>

            <fieldset className="registration-question">
              <legend>Food allergies</legend>
              <div className="registration-choice-row">
                <label>
                  <input
                    type="radio"
                    name="hasFoodAllergies"
                    value="no"
                    checked={form.hasFoodAllergies === 'no'}
                    onChange={updateField}
                  />
                  <span>None</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="hasFoodAllergies"
                    value="yes"
                    checked={form.hasFoodAllergies === 'yes'}
                    onChange={updateField}
                  />
                  <span>Yes</span>
                </label>
              </div>

              {form.hasFoodAllergies === 'yes' && (
                <label className="registration-field registration-details-field">
                  <span>Please provide relevant details *</span>
                  <textarea
                    name="foodAllergyDetails"
                    rows="4"
                    value={form.foodAllergyDetails}
                    onChange={updateField}
                    aria-invalid={Boolean(fieldErrors.foodAllergyDetails)}
                    aria-describedby={fieldErrors.foodAllergyDetails ? 'foodAllergyDetails-error' : undefined}
                  />
                  {fieldErrors.foodAllergyDetails && (
                    <small className="field-error" id="foodAllergyDetails-error">{fieldErrors.foodAllergyDetails}</small>
                  )}
                </label>
              )}
            </fieldset>

            <p className="registration-privacy-note">
              Personal information is handled in accordance with our{' '}
              <a
                href={`${import.meta.env.BASE_URL}governance/DataProtection.pdf`}
                target="_blank"
                rel="noreferrer"
              >
                Data Protection Policy
              </a>.
            </p>
          </div>

          <div className="registration-card">
            <div className="registration-card-heading">
              <span>04</span>
              <div>
                <p>Declaration</p>
                <h2>Confirm the registration.</h2>
              </div>
            </div>

            <div className="registration-declarations">
              <label className="registration-checkbox">
                <input
                  type="checkbox"
                  name="enrolmentAccepted"
                  checked={form.enrolmentAccepted}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.enrolmentAccepted)}
                />
                <span>
                  I confirm that I would like myself / the student named above to
                  enrol with Raaga Sudha Music Academy.
                </span>
              </label>
              {fieldErrors.enrolmentAccepted && (
                <small className="field-error">{fieldErrors.enrolmentAccepted}</small>
              )}

              <label className="registration-checkbox">
                <input
                  type="checkbox"
                  name="informationAccurate"
                  checked={form.informationAccurate}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.informationAccurate)}
                />
                <span>I confirm that the information I have provided is accurate.</span>
              </label>
              {fieldErrors.informationAccurate && (
                <small className="field-error">{fieldErrors.informationAccurate}</small>
              )}
            </div>

            <label className="registration-field registration-field-wide registration-signature">
              <span>Your full name *</span>
              <input
                type="text"
                name="signedBy"
                autoComplete="name"
                value={form.signedBy}
                onChange={updateField}
                aria-invalid={Boolean(fieldErrors.signedBy)}
                aria-describedby={fieldErrors.signedBy ? 'signedBy-error' : 'signature-help'}
              />
              <small className="field-help" id="signature-help">
                Typing your full name records who made this registration.
              </small>
              {fieldErrors.signedBy && (
                <small className="field-error" id="signedBy-error">{fieldErrors.signedBy}</small>
              )}
            </label>
          </div>

          <label className="registration-honeypot" aria-hidden="true">
            Website
            <input
              type="text"
              name="website"
              tabIndex="-1"
              autoComplete="off"
              value={form.website}
              onChange={updateField}
            />
          </label>

          {submitError && (
            <div className="registration-submit-error" role="alert">
              <strong>We couldn't submit the registration.</strong>
              <span>{submitError}</span>
            </div>
          )}

          <div className="registration-submit-area">
            <div>
              <p>Ready to submit?</p>
              <span>Please check the details above before sending the registration.</span>
            </div>
            <button className="registration-submit-button" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

export default Registration
