import jwt from 'jsonwebtoken'

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
