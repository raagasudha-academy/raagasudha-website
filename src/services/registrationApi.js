const registrationApiUrl = import.meta.env.VITE_REGISTRATION_API_URL?.trim()

export async function submitRegistration(payload) {
  if (!registrationApiUrl) {
    throw new Error(
      'Registration service is not configured yet. Add VITE_REGISTRATION_API_URL to your local environment.'
    )
  }

  const response = await fetch(registrationApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    // Keep the public error generic if the API returns a non-JSON response.
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || 'We could not submit the registration. Please try again.'
    )
    error.fieldErrors = data?.fieldErrors || {}
    throw error
  }

  return data
}
