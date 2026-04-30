import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const LANGUAGES = ['javascript','typescript','python','go','rust','java','cpp','c']

const LANG_COLORS = {
  javascript: 'text-yellow-400',
  typescript: 'text-blue-400',
  python:     'text-green-400',
  go:         'text-cyan-400',
  rust:       'text-orange-400',
  java:       'text-red-400',
  cpp:        'text-violet-400',
  c:          'text-slate-400',
}

export default function NewSessionModal({ onClose }) {
  const [title, setTitle]       = useState('')
  const [language, setLanguage] = useState('javascript')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return setError('Title is required.')
    setLoading(true)
    setError('')
    try {
      const session = await api.post('/sessions', { title: title.trim(), language })
      navigate(`/session/${session._id}`)
    } catch (err) {
      setError(err.message || 'Failed to create session.')
      setLoading(false)
    }
  }

  return (
    /* Backdrop */
    <div
      id="new-session-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-100 font-semibold text-lg">New Session</h2>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-surface-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">
              Session title
            </label>
            <input
              id="session-title-input"
              type="text"
              className="input"
              placeholder="e.g. Auth refactor, Fix the pagination bug…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={120}
            />
          </div>

          {/* Language picker */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">
              Language
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  id={`lang-${lang}`}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 rounded-lg border text-xs font-mono font-medium transition-all duration-150
                    ${language === lang
                      ? 'border-accent bg-accent/10 text-accent-light'
                      : 'border-border bg-surface-2 text-slate-400 hover:border-border/80 hover:text-slate-300'
                    }`}
                >
                  <span className={language === lang ? '' : LANG_COLORS[lang]}>
                    {lang}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              id="create-session-btn"
              type="submit"
              disabled={loading || !title.trim()}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : 'Create session →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
