

// languages shown in the "New session" modal on the frontend
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'java',
  'cpp',
  'c',
]

// used in the Socket.io CORS config and Express CORS config
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4000', 
  process.env.CLIENT_URL, 
].filter(Boolean)

// JWT cookie config — used in auth.js when signing in and logging out
export const COOKIE_OPTIONS = {
  httpOnly: true,                                    
  secure: process.env.NODE_ENV === 'production',    
  sameSite: 'lax',                                   
  maxAge: 7 * 24 * 60 * 60 * 1000,                  
}

// how long a JWT stays valid — keep in sync with COOKIE_OPTIONS.maxAge
export const JWT_EXPIRES_IN = '7d'

// AI review rate limit — requests per user per minute (used on Day 4)
export const AI_RATE_LIMIT = 10

// Monaco editor default settings — passed as props in CodeEditor.jsx
export const EDITOR_DEFAULTS = {
  theme: 'vs-dark',
  fontSize: 14,
  minimap: false,
  wordWrap: 'on',
}