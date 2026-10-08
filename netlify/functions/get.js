import { getCertificateById } from '../lib/sheets.js'

export default async (req) => {
  const url = new URL(req.url)
  const id = (url.searchParams.get('id') || '').trim()

  if (!id) {
    return json({ error: 'bad_request', message: 'Не указан номер сертификата.' }, 400)
  }

  let certificate
  try {
    certificate = await getCertificateById(id)
  } catch (e) {
    console.error(e)
    return json({ error: 'lookup_failed', message: 'Не удалось проверить сертификат. Попробуйте позже.' }, 500)
  }

  if (!certificate) {
    return json({ error: 'not_found', message: 'Сертификат с таким номером не найден.' }, 404)
  }

  // Public-facing payload only — no email beyond what's needed to display.
  return json({
    certificate: {
      kind: certificate.kind,
      certificate_number: certificate.certificate_number,
      certificate_id: certificate.certificate_id,
      ФИО: certificate.ФИО,
      title_line: certificate.title_line,
      block_key: certificate.block_key || null,
      completed_at: certificate.completed_at,
      issued_at: certificate.issued_at,
      status: certificate.status,
    },
  })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
