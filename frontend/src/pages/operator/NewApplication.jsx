import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { setLanguage } from '../../i18n'

export default function NewApplication() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [types, setTypes] = useState(null)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get('/license-types')
      .then((res) => { if (!cancelled) setTypes(res.data) })
      .catch(() => { if (!cancelled) setTypes([]) })
    return () => { cancelled = true }
  }, [])

  const fmtFee = (mru) => new Intl.NumberFormat(isRtl ? 'ar-MR' : 'fr-FR').format(mru)

  const create = async () => {
    if (!selected) return
    setError('')
    setCreating(true)
    try {
      const { data } = await api.post('/applications', { license_type_id: selected })
      navigate(`/operateur/dossiers/${data.id}`)
    } catch {
      setError(t('createError'))
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/operateur" className="text-sm text-white/90 hover:text-white">← {t('detailBack')}</Link>
          <button
            className="text-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/10"
            onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}
          >
            {isRtl ? 'Français' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-5">{t('chooseType')}</h1>

        {types === null && <p className="text-gray-500">{t('detailLoading')}</p>}

        {types && (
          <div className="flex flex-col gap-3">
            {types.map((type) => {
              const active = selected === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  className={`text-start rounded-xl ring-1 p-4 transition-colors ${active ? 'ring-2 ring-emerald-600 bg-emerald-50/40' : 'ring-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-gray-900">
                      {isRtl ? type.name_ar : type.name_fr}
                    </span>
                    <span className={`shrink-0 h-4 w-4 rounded-full border-2 ${active ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'}`} />
                  </div>
                  {(isRtl ? type.description_ar : type.description_fr) && (
                    <p className="mt-1 text-sm text-gray-500">
                      {isRtl ? type.description_ar : type.description_fr}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>{t('fee')} : {fmtFee(type.fee_mru)} MRU</span>
                    <span>{t('validity')} : {type.validity_months} {t('months')}</span>
                    <span>{type.required_documents?.length ?? 0} {t('requiredDocsCount')}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={create}
          disabled={!selected || creating}
          className="mt-6 w-full rounded-lg py-2.5 text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--rk-green)' }}
        >
          {creating ? t('creating') : t('createDraft')}
        </button>
      </main>
    </div>
  )
}
