import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d14] text-center px-6">
      <p className="text-8xl font-bold text-surface-3 select-none">404</p>
      <h1 className="text-slate-200 text-2xl font-semibold mt-4">Page not found</h1>
      <p className="text-slate-500 mt-2 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">
        ← Back home
      </Link>
    </div>
  )
}
