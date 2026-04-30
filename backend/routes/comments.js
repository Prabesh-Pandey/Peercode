// routes/comments.js
import { Router } from 'express'
import { z } from 'zod'
import Comment from '../models/Comment.js'
import CodeSession from '../models/CodeSession.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)

const createCommentSchema = z.object({
  lineNumber: z.number().int().min(1),
  text: z.string().min(1).max(2000),
})

// ── Helper ────────────────────────────────────────────────────────────────────
// Any authenticated user who can reach this endpoint has already passed
// requireAuth. Comments access is gated at the session level (invite link).
async function getSession(sessionId, res) {
  const session = await CodeSession.findById(sessionId).lean()
  if (!session) { res.status(404).json({ message: 'Session not found.' }); return null }
  return session
}

// ── GET /comments/:sessionId ──────────────────────────────────────────────────
// Fetch all comments for a session, sorted by line number then creation time.
router.get('/:sessionId', async (req, res) => {
  const session = await getSession(req.params.sessionId, res)
  if (!session) return

  const comments = await Comment
    .find({ sessionId: req.params.sessionId })
    .populate('author', 'username avatarUrl')
    .sort({ lineNumber: 1, createdAt: 1 })
    .lean()

  res.json(comments)
})

// ── POST /comments/:sessionId ─────────────────────────────────────────────────
// Create a new comment. The caller is responsible for emitting comment:new
// via Socket.io after this succeeds.
router.post('/:sessionId', async (req, res) => {
  const session = await getSession(req.params.sessionId, res)
  if (!session) return

  const result = createCommentSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    })
  }

  const comment = await Comment.create({
    sessionId:  req.params.sessionId,
    lineNumber: result.data.lineNumber,
    text:       result.data.text,
    author:     req.userId,
  })

  // Populate author before returning so the client can render it immediately
  await comment.populate('author', 'username avatarUrl')

  res.status(201).json(comment)
})

export default router
