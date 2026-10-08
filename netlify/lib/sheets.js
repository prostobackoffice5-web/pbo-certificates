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

const BLOCK_SHEET_NAME = 'Сертификаты_Блоков'
const BLOCK_HEADERS = [
  'certificate_number',
  'certificate_id',
  'user_id',
  'email',
  'ФИО',
  'block_key',
  'block_title',
  'completed_at',
  'issued_at',
  'status',
]

function rowToObject(row, headers) {
  const obj = {}
  headers.forEach((key, i) => {
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

async function readAll(sheets, spreadsheetId, sheetName, headers) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:J`,
  })
  const rows = res.data.values || []
  return rows.filter((r) => r.length > 0).map((r) => rowToObject(r, headers))
}

async function ensureBlockSheetExists(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets.some((s) => s.properties.title === BLOCK_SHEET_NAME)
  if (exists) return

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: BLOCK_SHEET_NAME } } }] },
  })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${BLOCK_SHEET_NAME}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [BLOCK_HEADERS] },
  })
}

export async function getCertificateById(certificateId) {
  const spreadsheetId = process.env.SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set')
  const sheets = await getSheetsClient()

  const courseCerts = await readAll(sheets, spreadsheetId, SHEET_NAME, HEADERS)
  const courseMatch = courseCerts.find((c) => c.certificate_id === certificateId)
  if (courseMatch) {
    return {
      kind: 'course',
      certificate_number: courseMatch.certificate_number,
      certificate_id: courseMatch.certificate_id,
      ФИО: courseMatch.ФИО,
      title_line: courseMatch.course_title,
      completed_at: courseMatch.completed_at,
      issued_at: courseMatch.issued_at,
      status: courseMatch.status,
    }
  }

  await ensureBlockSheetExists(sheets, spreadsheetId)
  const blockCerts = await readAll(sheets, spreadsheetId, BLOCK_SHEET_NAME, BLOCK_HEADERS)
  const blockMatch = blockCerts.find((c) => c.certificate_id === certificateId)
  if (blockMatch) {
    return {
      kind: 'block',
      certificate_number: blockMatch.certificate_number,
      certificate_id: blockMatch.certificate_id,
      ФИО: blockMatch.ФИО,
      title_line: blockMatch.block_title,
      block_key: blockMatch.block_key,
      completed_at: blockMatch.completed_at,
      issued_at: blockMatch.issued_at,
      status: blockMatch.status,
    }
  }

  return null
}

// One certificate per (user_id, course_id). Returns the existing one if
// already issued, otherwise creates and appends a new row.
export async function getOrCreateCertificate({ userId, email, fio, courseId, courseTitle, completedAt }) {
  const spreadsheetId = process.env.SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set')
  const sheets = await getSheetsClient()

  const all = await readAll(sheets, spreadsheetId, SHEET_NAME, HEADERS)
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

// One certificate per (user_id, block_key). Returns the existing one if
// already issued, otherwise creates and appends a new row.
export async function getOrCreateBlockCertificate({ userId, email, fio, blockKey, blockTitle, numberPrefix, completedAt }) {
  const spreadsheetId = process.env.SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not set')
  const sheets = await getSheetsClient()

  await ensureBlockSheetExists(sheets, spreadsheetId)
  const all = await readAll(sheets, spreadsheetId, BLOCK_SHEET_NAME, BLOCK_HEADERS)
  const existing = all.find((c) => c.user_id === userId && c.block_key === blockKey)
  if (existing) return existing

  const year = new Date().getFullYear()
  const sameBlock = all.filter((c) => c.block_key === blockKey)
  const seq = String(sameBlock.length + 1).padStart(4, '0')
  const certificate = {
    certificate_number: `${numberPrefix.replace('{year}', String(year))}${seq}`,
    certificate_id: randomUUID(),
    user_id: userId,
    email,
    ФИО: fio,
    block_key: blockKey,
    block_title: blockTitle,
    completed_at: completedAt || '',
    issued_at: new Date().toISOString(),
    status: 'Действителен',
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${BLOCK_SHEET_NAME}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: [BLOCK_HEADERS.map((h) => certificate[h])] },
  })

  return certificate
}
