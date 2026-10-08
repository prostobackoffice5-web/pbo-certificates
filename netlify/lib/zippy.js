const ZIPPY_BASE = 'https://app.hrzippy.com/api/ext/v1'

function authHeaders() {
  const key = process.env.ZIPPY_API_KEY
  if (!key) throw new Error('ZIPPY_API_KEY is not set')
  return { Authorization: `Bearer ${key}` }
}

// Finds the progress row for a given course + email (case-insensitive).
// Paginates through the course's progress feed since the API has no
// email filter.
export async function findProgress(courseId, email) {
  const normalizedEmail = email.trim().toLowerCase()
  let cursor = null

  while (true) {
    const url = new URL(`${ZIPPY_BASE}/learning/progress`)
    url.searchParams.set('course_id', courseId)
    url.searchParams.set('limit', '200')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) {
      throw new Error(`Zippy API error ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    const match = data.items.find((i) => i.email.trim().toLowerCase() === normalizedEmail)
    if (match) return match

    if (!data.has_more) return null
    cursor = data.next_cursor
  }
}

export async function getCourse(courseId) {
  const res = await fetch(`${ZIPPY_BASE}/courses`, { headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Zippy API error ${res.status}: ${await res.text()}`)
  }
  const courses = await res.json()
  return courses.find((c) => c.course_id === courseId) || null
}
