import { FormEvent, useState } from 'react'
import { BLOCKS } from '../blocks'

export default function BlockPage({ blockKey }: { blockKey: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const block = BLOCKS[blockKey]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/issue-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_key: blockKey, email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Не удалось получить сертификат. Попробуйте ещё раз.')
        setLoading(false)
        return
      }

      window.location.href = `/certificate/${data.certificate.certificate_id}`
    } catch {
      setError('Не удалось связаться с сервером. Проверьте интернет-соединение и попробуйте снова.')
      setLoading(false)
    }
  }

  if (!block) {
    return (
      <div className="page">
        <div className="page__header">
          <h1>Блок не найден</h1>
          <p>Проверьте ссылку или обратитесь к HR.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>Поздравляем!</h1>
        <p>Вы успешно завершили блок обучения «{block.roleLine}». Получите свой сертификат.</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="email">Рабочая почта (как в Zippy)</label>
        <input
          id="email"
          type="email"
          placeholder="ivan.ivanov@pbo.kz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <div className="card__error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Получить сертификат'}
        </button>
        <div className="card__meta">ФИО подставится автоматически из данных Zippy.</div>
      </form>
    </div>
  )
}
