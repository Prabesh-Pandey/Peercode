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

// Check the session exists (access is controlled at the session level)
async function getSession(sessionId, res) {
  const session = await CodeSession.findById(sessionId).lean()
  if (!session) { res.status(404).json({ message: 'Session not found.' }); return null }
  return session
}

// GET /comments/:sessionId — get all comments sorted by line number
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

// POST /comments/:sessionId — create a new comment on a specific line
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

  await comment.populate('author', 'username avatarUrl')
  res.status(201).json(comment)
})

export default router
