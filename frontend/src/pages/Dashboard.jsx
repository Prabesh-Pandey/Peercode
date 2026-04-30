import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import NewSessionModal from '../components/NewSessionModal'

const LANG_BADGES = {
  javascript: 'bg-yellow-400/10 text-yellow-400',
  typescript: 'bg-blue-400/10 text-blue-400',
  python:     'bg-green-400/10 text-green-400',
  go:         'bg-cyan-400/10 text-cyan-400',
  rust:       'bg-orange-400/10 text-orange-400',
  java:       'bg-red-400/10 text-red-400',
  cpp:        'bg-violet-400/10 text-violet-400',
  c:          'bg-slate-400/10 text-slate-400',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.get('/sessions')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border glass sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-semibold text-lg tracking-tight">PeerCode</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="new-session-nav-btn"
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            + New session
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2.5">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-border"
              />
            )}
            <span className="text-slate-300 text-sm font-medium hidden sm:block">
              {user?.username}
            </span>
            <button
              id="logout-btn"
              onClick={logout}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-slate-100 text-2xl font-bold">
              Welcome back, {user?.name || user?.username} 
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} · pick up where you left off
            </p>
          </div>
          <button
            id="new-session-main-btn"
            onClick={() => setShowModal(true)}
            className="btn-primary hidden sm:inline-flex"
          >
            + New session
          </button>
        </div>

        {/* Session grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-surface-2" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M3.75 5.25h16.5" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Create your first session to get started</p>
            <button
              id="empty-new-session-btn"
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              + New session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => {
              const isOwned = s.owner?.toString() === user?.id || s.owner === user?.id
              return (
                <div
                  key={s._id}
                  id={`session-card-${s._id}`}
                  onClick={() => navigate(`/session/${s._id}`)}
                  className="card-hover group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${LANG_BADGES[s.language] || 'bg-slate-400/10 text-slate-400'}`}>
                      {s.language}
                    </span>
                    {!isOwned && (
                      <span className="badge bg-violet-400/10 text-violet-400 text-[10px]">
                        joined
                      </span>
                    )}
                  </div>

                  <h3 className="text-slate-100 font-semibold text-sm leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {s.title}
                  </h3>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-slate-500 text-xs">{timeAgo(s.updatedAt)}</span>
                    {s.participants?.length > 0 && (
                      <span className="text-slate-500 text-xs">
                        {s.participants.length} collaborator{s.participants.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showModal && <NewSessionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
