import { findProgress, getCourse } from '../lib/zippy.js'
import { getOrCreateCertificate } from '../lib/sheets.js'

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

  const courseId = (body.course_id || '').trim()
  const email = (body.email || '').trim()

  if (!courseId) return json({ error: 'bad_request', message: 'Не указан курс.' }, 400)
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'invalid_email', message: 'Введите корректную рабочую почту.' }, 400)
  }

  let course
  try {
    course = await getCourse(courseId)
  } catch (e) {
    return json({ error: 'zippy_unavailable', message: 'Не удалось связаться с Zippy. Попробуйте позже.' }, 502)
  }
  if (!course) {
    return json({ error: 'course_not_found', message: 'Курс не найден.' }, 404)
  }

  let progress
  try {
    progress = await findProgress(courseId, email)
  } catch (e) {
    return json({ error: 'zippy_unavailable', message: 'Не удалось связаться с Zippy. Попробуйте позже.' }, 502)
  }

  if (!progress) {
    return json(
      {
        error: 'not_enrolled',
        message: 'Не нашли прохождение этого курса для указанной почты. Проверьте, что ввели корпоративную почту, на которую зарегистрированы в Zippy.',
      },
      404,
    )
  }

  if (progress.state !== 'completed') {
    return json(
      {
        error: 'not_completed',
        message: `Курс пока не завершён (пройдено ${progress.progress_percent}%). Сертификат появится после 100%.`,
      },
      409,
    )
  }

  const fio = `${progress.last_name} ${progress.first_name}`.trim()
  if (!fio) {
    return json({ error: 'missing_name', message: 'В профиле не заполнено ФИО — обратитесь к HR.' }, 422)
  }

  let certificate
  try {
    certificate = await getOrCreateCertificate({
      userId: progress.user_id,
      email: progress.email,
      fio,
      courseId: progress.course_id,
      courseTitle: progress.course_title,
      completedAt: progress.last_completed_at,
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
