import jwt from 'jsonwebtoken'

/**
 * Middleware that verifies the JWT stored in the `token` httpOnly cookie.
 * On success, attaches `req.userId` (the MongoDB _id string) to the request.
 * On failure, responds with 401 — never leaks why the token is invalid.
 */
export default function requireAuth(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.sub  // MongoDB _id stored as 'sub' at sign time
    next()
  } catch {
    // covers TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}
