import { findProgress } from '../lib/zippy.js'
import { getOrCreateBlockCertificate } from '../lib/sheets.js'
import { BLOCKS } from '../../src/blocks'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request', message: 'Некорректный запрос.' }, 400)
  }

  const blockKey = (body.block_key || '').trim()
  const email = (body.email || '').trim()

  const block = BLOCKS[blockKey]
  if (!block) {
    return json({ error: 'block_not_found', message: 'Блок обучения не найден.' }, 404)
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'invalid_email', message: 'Введите корректную рабочую почту.' }, 400)
  }
  if (block.courseIds.length === 0) {
    return json(
      { error: 'block_not_trackable', message: 'Для этого блока автоматическая проверка пока не настроена. Обратитесь к HR.' },
      409,
    )
  }

  let progressRows
  try {
    progressRows = await Promise.all(block.courseIds.map((courseId) => findProgress(courseId, email)))
  } catch (e) {
    return json({ error: 'zippy_unavailable', message: 'Не удалось связаться с Zippy. Попробуйте позже.' }, 502)
  }

  const missingIndex = progressRows.findIndex((p) => !p || p.state !== 'completed')
  if (missingIndex !== -1) {
    return json(
      {
        error: 'not_completed',
        message: 'Не все обучения этого блока завершены на 100%. Сертификат появится после прохождения всех курсов блока.',
      },
      409,
    )
  }

  const last = progressRows[0]
  const fio = `${last.last_name} ${last.first_name}`.trim()
  if (!fio) {
    return json({ error: 'missing_name', message: 'В профиле не заполнено ФИО — обратитесь к HR.' }, 422)
  }

  const completedAt = progressRows
    .map((p) => p.last_completed_at)
    .filter(Boolean)
    .sort()
    .pop()

  let certificate
  try {
    certificate = await getOrCreateBlockCertificate({
      userId: last.user_id,
      email: last.email,
      fio,
      blockKey,
      blockTitle: block.roleLine,
      numberPrefix: block.numberPrefix,
      completedAt,
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'issue_failed', message: 'Не удалось сформировать сертификат. Попробуйте ещё раз чуть позже.' }, 500)
  }

  return json({ certificate })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
