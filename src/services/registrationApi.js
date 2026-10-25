const registrationApiUrl = import.meta.env.VITE_REGISTRATION_API_URL?.trim()

function requireRegistrationApiUrl() {
  if (!registrationApiUrl) {
    throw new Error(
      'Registration service is not configured yet. Add VITE_REGISTRATION_API_URL to your local environment.'
    )
  }
  return registrationApiUrl.replace(/\/$/, '')
}

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function submitRegistration(payload) {
  const response = await fetch(requireRegistrationApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJsonResponse(response)

  if (!response.ok) {
    const error = new Error(
      data?.message || 'We could not submit the registration. Please try again.'
    )
    error.fieldErrors = data?.fieldErrors || {}
    throw error
  }

  return data
}

export async function uploadStudentPhoto({ requestId, personId, file }) {
  if (!file) return null

  const baseUrl = requireRegistrationApiUrl()
  const presignResponse = await fetch(`${baseUrl}/photo-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId,
      personId,
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    }),
  })

  const presignData = await readJsonResponse(presignResponse)
  if (!presignResponse.ok) {
    throw new Error(
      presignData?.message || 'We could not prepare the student photograph for upload.'
    )
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'x-amz-tagging': 'state=unsubmitted',
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error('We could not upload the student photograph. Please try again.')
  }

  return {
    storageKey: presignData.storageKey,
    contentType: file.type,
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  }
}
