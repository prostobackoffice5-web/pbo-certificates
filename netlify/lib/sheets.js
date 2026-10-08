import { google } from 'googleapis'
import { randomUUID } from 'node:crypto'

const SHEET_NAME = 'Сертификаты'
const HEADERS = [
  'certificate_number',
  'certificate_id',
  'user_id',
  'email',
  'ФИО',
  'course_id',
  'course_title',
  'completed_at',
  'issued_at',
  'status',
]

function rowToCertificate(row) {
  const obj = {}
  HEADERS.forEach((key, i) => {
    obj[key] = row[i] ?? ''
  })
  return obj
}

async function getSheetsClient() {
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!rawCreds) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const credentials = JSON.parse(rawCreds)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function readAllCertificates(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:J`,
  })
  const rows = res.data.values || []
  return rows.filter((r) => r.length > 0).map(rowToCertificate)
}

export async function getCertificateById(certificateId) {
  const spreadsheetId = process.env.SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set')
  const sheets = await getSheetsClient()
  const all = await readAllCertificates(sheets, spreadsheetId)
  return all.find((c) => c.certificate_id === certificateId) || null
}

// One certificate per (user_id, course_id). Returns the existing one if
// already issued, otherwise creates and appends a new row.
export async function getOrCreateCertificate({ userId, email, fio, courseId, courseTitle, completedAt }) {
  const spreadsheetId = process.env.SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set')
  const sheets = await getSheetsClient()

  const all = await readAllCertificates(sheets, spreadsheetId)
  const existing = all.find((c) => c.user_id === userId && c.course_id === courseId)
  if (existing) return existing

  const year = new Date().getFullYear()
  const seq = String(all.length + 1).padStart(6, '0')
  const certificate = {
    certificate_number: `ZIPPY-${year}-${seq}`,
    certificate_id: randomUUID(),
    user_id: userId,
    email,
    ФИО: fio,
    course_id: courseId,
    course_title: courseTitle,
    completed_at: completedAt || '',
    issued_at: new Date().toISOString(),
    status: 'Действителен',
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS.map((h) => certificate[h])] },
  })

  return certificate
}
