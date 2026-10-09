import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CertificateCard, { CertificateData } from '../CertificateCard'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: CertificateData }

export default function CertificatePage({ certificateId }: { certificateId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [downloading, setDownloading] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / 1200))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [state.status])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/get?id=${encodeURIComponent(certificateId)}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setState({ status: 'error', message: data.message || 'Сертификат не найден.' })
          return
        }
        setState({ status: 'ready', data: data.certificate })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Не удалось загрузить сертификат. Попробуйте обновить страницу.' })
      })
    return () => {
      cancelled = true
    }
  }, [certificateId])

  async function handleDownload() {
    if (!cardRef.current || state.status !== 'ready') return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0e1116',
        onclone: (doc) => {
          const inner = doc.querySelector<HTMLElement>('[data-cert-scaler]')
          if (inner) inner.style.transform = 'none'
        },
      })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
      const safeName = state.data.ФИО.replace(/\s+/g, '_')
      pdf.save(`Сертификат_${safeName}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Мой сертификат', url })
      } catch {
        /* user cancelled share — nothing to do */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Ссылка скопирована')
      setTimeout(() => setShareMsg(null), 2000)
    } catch {
      setShareMsg(url)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="page">
        <div className="page__header">
          <h1>Загружаем сертификат…</h1>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page">
        <div className="page__header">
          <h1>Не получилось показать сертификат</h1>
          <p>{state.message}</p>
        </div>
      </div>
    )
  }

  const { data } = state

  return (
    <div className="page">
      <div className="page__header">
        <h1>Поздравляем!</h1>
        <p>{data.title_line}</p>
      </div>

      <div className="certificate-wrap" ref={wrapRef} style={{ height: 740 * scale }}>
        <div
          data-cert-scaler
          style={{ width: 1200, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <CertificateCard data={data} ref={cardRef} />
        </div>
      </div>

      {scale < 0.6 && (
        <div className="card__meta" style={{ marginTop: 0, marginBottom: 16 }}>
          На телефоне текст мелкий — скачайте PDF, чтобы прочитать сертификат целиком.
        </div>
      )}

      <div className="actions">
        <button onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Готовим PDF…' : 'Скачать сертификат PDF'}
        </button>
        <button className="secondary" onClick={handleShare}>
          Поделиться сертификатом
        </button>
      </div>

      {shareMsg && <div className="card__meta">{shareMsg}</div>}

      <div className="card__meta" style={{ marginTop: 24 }}>
        {data.ФИО} · {data.title_line} · выдан {new Date(data.issued_at).toLocaleDateString('ru-RU')} · № {data.certificate_number}
      </div>
    </div>
  )
}
