import { forwardRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { BLOCKS } from './blocks'

export interface CertificateData {
  kind: 'course' | 'block'
  certificate_number: string
  certificate_id: string
  ФИО: string
  title_line: string
  block_key: string | null
  completed_at: string
  issued_at: string
  status: string
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const FALLBACK_COURSE_CONTENT = {
  eyebrow: 'Демо-курс',
  bodyIntro: 'успешно завершил(а) демонстрационный курс. В рамках курса пройдены все уроки и материалы программы.',
  bullets: [] as string[],
  bodyOutro: 'Сертификат выдан в рамках Внутренней корпоративной программы профессиональной сертификации.',
}

const CertificateCard = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => {
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    const url = `${window.location.origin}/certificate/${data.certificate_id}`
    QRCode.toDataURL(url, { margin: 1, width: 300, color: { dark: '#2de2c6', light: '#00000000' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [data.certificate_id])

  const block = data.kind === 'block' && data.block_key ? BLOCKS[data.block_key] : null
  const content = block
    ? { eyebrow: block.eyebrow, bodyIntro: block.bodyIntro, bullets: block.bullets, bodyOutro: block.bodyOutro }
    : FALLBACK_COURSE_CONTENT

  return (
    <div className="certificate" ref={ref}>
      <div className="certificate__left-fade" />

      <div className="certificate__content">
        <div className="certificate__brand">
          <img src="/cert/logo-dark.png" alt="Просто Бэк-офис" />
        </div>

        <div>
          <div className="certificate__eyebrow">{content.eyebrow}</div>
          <div className="certificate__title">Сертификат</div>
        </div>

        <div>
          <div className="certificate__lead">Подтверждаем, что</div>
          <div className="certificate__name">{data.ФИО}</div>
          <div className="certificate__role">{data.title_line}</div>
        </div>

        <div>
          <div className="certificate__body-text">{content.bodyIntro}</div>
          {content.bullets.length > 0 && (
            <ul className="certificate__bullets">
              {content.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          <div className="certificate__body-text" style={{ marginBottom: 0 }}>
            {content.bodyOutro}
          </div>
        </div>

        <div className="certificate__footer">
          <div className="certificate__footer-block">
            <div className="certificate__footer-label">Дата выдачи</div>
            <div className="certificate__footer-value">{formatDate(data.issued_at)}</div>
          </div>
          <div className="certificate__footer-block">
            <div className="certificate__footer-label">Кем выдано</div>
            <div className="certificate__footer-value">ТОО «Просто Бэк-офис»</div>
          </div>
          <div className="certificate__footer-block">
            <div className="certificate__footer-label">Номер</div>
            <div className="certificate__footer-value">{data.certificate_number}</div>
          </div>
        </div>
      </div>

      <div className="certificate__qr-block">
        <div className="certificate__qr-frame">
          {qr && <img src={qr} alt="QR-код проверки сертификата" />}
          <div className="certificate__qr-corner tl" />
          <div className="certificate__qr-corner tr" />
          <div className="certificate__qr-corner bl" />
          <div className="certificate__qr-corner br" />
        </div>
        <div className="certificate__qr-caption">Проверка подлинности</div>
      </div>
    </div>
  )
})

export default CertificateCard
