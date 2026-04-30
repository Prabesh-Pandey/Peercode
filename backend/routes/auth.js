import { Router } from 'express'
import fetch from 'node-fetch'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import requireAuth from '../middleware/requireAuth.js'
import { COOKIE_OPTIONS, JWT_EXPIRES_IN } from '../config/constants.js'

const router = Router()

// Exchange a GitHub OAuth code for a user profile
async function fetchGitHubProfile(code) {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) throw new Error(`GitHub token error: ${tokenData.error_description}`)

  const profileRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!profileRes.ok) throw new Error('Failed to fetch GitHub profile')
  return profileRes.json()
}

// GET /auth/github — redirect user to GitHub login
router.get('/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')

  // Store state in a cookie so we can verify it in /callback (CSRF protection)
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  })

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 8000}`}/auth/callback`,
    scope: 'read:user user:email',
    state,
  })

  res.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

// GET /auth/callback — GitHub redirects here after login
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query

  if (error) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?error=access_denied`)
  }

  // Verify the state matches what we stored (prevents CSRF)
  const savedState = req.cookies.oauth_state
  res.clearCookie('oauth_state')

  if (!savedState || savedState !== state) {
    return res.status(403).json({ message: 'Invalid OAuth state.' })
  }

  if (!code) return res.status(400).json({ message: 'Missing authorization code.' })

  // Get user profile from GitHub and save/update in DB
  const profile = await fetchGitHubProfile(code)

  const user = await User.findOneAndUpdate(
    { githubId: String(profile.id) },
    {
      githubId:  String(profile.id),
      username:  profile.login,
      name:      profile.name || profile.login,
      email:     profile.email || '',
      avatarUrl: profile.avatar_url || '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  // Sign a JWT and send it as an httpOnly cookie
  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  res.cookie('token', token, COOKIE_OPTIONS)
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`)
})

// GET /auth/me — return logged-in user's profile
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean()
  if (!user) return res.status(404).json({ message: 'User not found.' })

  res.json({
    id:        user._id,
    username:  user.username,
    name:      user.name,
    email:     user.email,
    avatarUrl: user.avatarUrl,
  })
})

// POST /auth/logout — clear the JWT cookie
router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  res.json({ message: 'Logged out.' })
})

export default router
