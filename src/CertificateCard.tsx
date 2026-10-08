import { forwardRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'

export interface CertificateData {
  certificate_number: string
  certificate_id: string
  ФИО: string
  course_title: string
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

const CertificateCard = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => {
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    const url = `${window.location.origin}/certificate/${data.certificate_id}`
    QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: '#0f3d2e', light: '#faf8f300' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [data.certificate_id])

  return (
    <div className="certificate" ref={ref}>
      <div className="certificate__border-outer" />
      <div className="certificate__border-inner" />
      <div className="certificate__seal">
        Просто
        <br />
        Бэк-офис
        <br />★
      </div>
      <div className="certificate__content">
        <div className="certificate__brand">Просто Бэк-офис</div>
        <div className="certificate__title">Сертификат</div>
        <div className="certificate__subtitle">о прохождении внутреннего обучения</div>

        <div className="certificate__lead">Настоящим подтверждается, что</div>
        <div className="certificate__name">{data.ФИО}</div>

        <div className="certificate__lead">успешно завершил(а) курс</div>
        <div className="certificate__course">«{data.course_title}»</div>
      </div>
      <div className="certificate__footer">
        <div className="certificate__footer-block">
          <div className="certificate__label">Дата выдачи</div>
          <div className="certificate__value">{formatDate(data.issued_at)}</div>
        </div>
        <div className="certificate__footer-block">
          <div className="certificate__label">Сертификат №</div>
          <div className="certificate__value">{data.certificate_number}</div>
        </div>
        {qr && <img className="certificate__qr" src={qr} alt="QR-код проверки сертификата" />}
      </div>
    </div>
  )
})

export default CertificateCard
