import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import CodeEditor from '../components/CodeEditor'
import useSocket from '../hooks/useSocket'

const SAVE_DELAY_MS = 1000  // debounce: wait 1 s of inactivity before saving

export default function Session() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [saveStatus, setSaveStatus] = useState('')

  const editorRef       = useRef(null)   // Monaco editor instance
  const saveTimer       = useRef(null)   // debounce timer handle
  const isRemoteUpdate  = useRef(false)  // flag: true when code change came from socket

  // ── Socket connection ─────────────────────────────────────────────────────
  const socketRef = useSocket(id, user)

  // ── Fetch session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then(setSession)
      .catch((err) => {
        if (err.status === 403) setError('You don\'t have access to this session.')
        else if (err.status === 404) setError('Session not found.')
        else setError('Failed to load session.')
      })
      .finally(() => setLoading(false))
  }, [id])

  // ── Live code sync ────────────────────────────────────────────────────────
  // Listen for code:change from other clients in the same room.
  // Set isRemoteUpdate flag BEFORE updating state so Monaco's onChange can
  // detect it and skip the re-emit (preventing an infinite broadcast loop).
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleRemoteCode = ({ code }) => {
      isRemoteUpdate.current = true
      setSession((prev) => prev ? { ...prev, code } : prev)
    }

    socket.on('code:change', handleRemoteCode)
    return () => socket.off('code:change', handleRemoteCode)
  }, [socketRef])

  // ── Debounced auto-save + socket emit ────────────────────────────────────
  const handleCodeChange = useCallback((value) => {
    // If Monaco fired onChange because of a remote update we applied,
    // skip everything — we must not re-emit back to the room.
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }

    // Broadcast this edit to everyone else in the room
    socketRef.current?.emit('code:change', { sessionId: id, code: value })

    setSaveStatus('saving…')
    clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(async () => {
      try {
        await api.patch(`/sessions/${id}/code`, { code: value ?? '' })
        setSaveStatus('saved ✓')
        setTimeout(() => setSaveStatus(''), 2000)
      } catch {
        setSaveStatus('save failed')
      }
    }, SAVE_DELAY_MS)
  }, [id, socketRef])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d14] gap-4">
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost">
          ← Back to dashboard
        </button>
      </div>
    )
  }

  const isOwner = session?.owner?._id === user?.id

  return (
    <div className="flex flex-col h-screen bg-[#0d0d14] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border glass shrink-0 z-30">
        {/* Left — back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="back-to-dashboard"
            onClick={() => navigate('/dashboard')}
            className="btn-ghost text-xs px-2 py-1 shrink-0"
          >
            ← Dashboard
          </button>
          <span className="text-border">|</span>
          <span className="text-slate-200 font-medium text-sm truncate">{session?.title}</span>
          <span className={`badge font-mono
            ${session?.language === 'javascript' ? 'bg-yellow-400/10 text-yellow-400'
            : session?.language === 'typescript'  ? 'bg-blue-400/10 text-blue-400'
            : session?.language === 'python'      ? 'bg-green-400/10 text-green-400'
            : 'bg-slate-400/10 text-slate-400'}`}
          >
            {session?.language}
          </span>
        </div>

        {/* Right — save status + participants */}
        <div className="flex items-center gap-4 shrink-0">
          {saveStatus && (
            <span className={`text-xs font-medium transition-all ${
              saveStatus === 'saved ✓' ? 'text-green-400'
              : saveStatus === 'save failed' ? 'text-red-400'
              : 'text-slate-500'
            }`}>
              {saveStatus}
            </span>
          )}

          {/* Participant avatars placeholder */}
          <div id="participants-list" className="flex -space-x-2">
            {[user].filter(Boolean).map((u, i) => (
              <div
                key={i}
                title={u.username}
                className="w-7 h-7 rounded-full bg-accent border-2 border-[#0d0d14] flex items-center justify-center text-white text-xs font-bold overflow-hidden"
              >
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                  : u.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Split view ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor — left pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CodeEditor
            value={session?.code ?? ''}
            language={session?.language ?? 'javascript'}
            onChange={handleCodeChange}
            editorRef={editorRef}
          />
        </div>

        {/* Sidebar — right pane */}
        <aside className="w-72 border-l border-border flex flex-col shrink-0 bg-surface">
          {/* Participants section */}
          <div className="p-4 border-b border-border">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Participants
            </h3>
            <div id="participants-sidebar" className="space-y-2">
              {[session?.owner, ...(session?.participants ?? [])].filter(Boolean).map((p, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent-light overflow-hidden shrink-0">
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt={p.username} className="w-full h-full object-cover" />
                      : p.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 text-xs font-medium truncate">{p.username}</p>
                    {i === 0 && <p className="text-slate-500 text-[10px]">owner</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments section — populated in Day 3 */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Comments
            </h3>
            <p id="comments-placeholder" className="text-slate-600 text-xs italic">
              Click a line number in the editor to leave a comment.
            </p>
          </div>

          {/* Session info footer */}
          <div className="p-4 border-t border-border">
            <p className="text-slate-600 text-xs">
              Session ID:{' '}
              <span className="font-mono text-slate-500">{id.slice(-8)}</span>
            </p>
            {isOwner && (
              <p className="text-accent-light text-xs mt-0.5">You own this session</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
