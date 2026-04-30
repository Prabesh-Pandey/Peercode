import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-time Sync',
    desc: 'See every keystroke as it happens — zero lag collaborative editing powered by Socket.io.',
  },
  {
    icon: '🧠',
    title: 'AI Code Review',
    desc: 'Get instant feedback from Claude AI — streamed inline as comments on your code.',
  },
  {
    icon: '🔒',
    title: 'GitHub Auth',
    desc: 'One-click sign-in with your GitHub account. No passwords, no friction.',
  },
  {
    icon: '🎨',
    title: 'Monaco Editor',
    desc: 'The same editor that powers VS Code — with syntax highlighting for 8+ languages.',
  },
]

export default function Landing() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-accent text-xl">⌥</span>
          <span className="text-slate-100 font-semibold text-lg tracking-tight">PeerCode</span>
        </div>
        <a
          id="nav-login-btn"
          href={`${API_URL}/auth/github`}
          className="btn-primary"
        >
          <GitHubIcon />
          Sign in with GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Glow blob */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Real-time · Collaborative · AI-powered
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-100 leading-tight mb-6">
            Code together,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-light to-violet-400">
              review together
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A real-time collaborative code review platform. Invite teammates, write code
            side-by-side, and get AI-powered feedback — all in your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              id="hero-login-btn"
              href={`${API_URL}/auth/github`}
              className="btn-primary text-base px-7 py-3 shadow-lg shadow-accent/20"
            >
              <GitHubIcon className="w-5 h-5" />
              Get started free
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-base px-7 py-3"
            >
              View source →
            </a>
          </div>
        </div>

        {/* Editor preview mockup */}
        <div className="relative mt-20 w-full max-w-4xl animate-slide-up">
          <div className="card border-border/80 overflow-hidden shadow-2xl shadow-black/50">
            {/* Fake traffic lights */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 border-b border-border">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-slate-500 text-xs font-mono">session.js — PeerCode</span>
            </div>
            <div className="p-6 font-mono text-sm text-left leading-relaxed">
              <p><span className="text-purple-400">const</span> <span className="text-blue-300">session</span> <span className="text-slate-400">=</span> <span className="text-yellow-300">await</span> <span className="text-blue-300">CodeSession</span><span className="text-slate-400">.</span><span className="text-green-300">create</span><span className="text-slate-300">{'({'}</span></p>
              <p className="pl-6"><span className="text-slate-300">title:</span> <span className="text-orange-300">'Auth refactor'</span><span className="text-slate-400">,</span></p>
              <p className="pl-6"><span className="text-slate-300">language:</span> <span className="text-orange-300">'typescript'</span><span className="text-slate-400">,</span></p>
              <p className="pl-6"><span className="text-slate-300">owner:</span> <span className="text-blue-300">req</span><span className="text-slate-400">.</span><span className="text-slate-300">userId</span><span className="text-slate-400">,</span></p>
              <p><span className="text-slate-300">{'}'}</span><span className="text-slate-400">)</span></p>
              <p className="mt-4"><span className="text-slate-500">// 💬 AI Review: Consider adding input validation here</span></p>
            </div>
          </div>
          {/* Presence avatars overlay */}
          <div className="absolute -top-4 -right-4 flex -space-x-2">
            {['bg-violet-500','bg-pink-500','bg-cyan-500'].map((c,i) => (
              <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-[#0d0d14] flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                {['P','A','R'][i]}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-5xl">
          {FEATURES.map((f) => (
            <div key={f.title} className="card text-left hover:border-border transition-colors">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 text-slate-100 font-semibold text-sm">{f.title}</h3>
              <p className="mt-1.5 text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-slate-600 text-xs border-t border-border/30">
        Built in 4 days · MongoDB · Express · React · Socket.io
      </footer>
    </div>
  )
}

function GitHubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}
