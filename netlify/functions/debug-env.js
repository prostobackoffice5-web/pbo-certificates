export default async () => {
  const key = process.env.ZIPPY_API_KEY || ''
  const sheet = process.env.SPREADSHEET_ID || ''
  const sa = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ''

  let saParsed = false
  let saClientEmail = null
  try {
    const parsed = JSON.parse(sa)
    saParsed = true
    saClientEmail = parsed.client_email || null
  } catch {
    saParsed = false
  }

  return new Response(
    JSON.stringify({
      ZIPPY_API_KEY_present: key.length > 0,
      ZIPPY_API_KEY_prefix: key.slice(0, 8),
      SPREADSHEET_ID_present: sheet.length > 0,
      SPREADSHEET_ID_value: sheet,
      GOOGLE_SERVICE_ACCOUNT_JSON_present: sa.length > 0,
      GOOGLE_SERVICE_ACCOUNT_JSON_length: sa.length,
      GOOGLE_SERVICE_ACCOUNT_JSON_parses: saParsed,
      GOOGLE_SERVICE_ACCOUNT_JSON_client_email: saClientEmail,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
