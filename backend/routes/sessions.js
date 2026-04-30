import { Router } from 'express'
import { z } from 'zod'
import CodeSession from '../models/CodeSession.js'
import requireAuth from '../middleware/requireAuth.js'
import { SUPPORTED_LANGUAGES } from '../config/constants.js'

const router = Router()

// all session routes require a valid JWT cookie
router.use(requireAuth)

// Zod schemas 

const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({ message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` }),
  }),
})

const updateCodeSchema = z.object({
  code: z.string(), // empty string is valid (user cleared the editor)
})

//  Helper

/**
 * Validate `body` against `schema`.
 * Returns `{ data }` on success or sends a 400 and returns `{ error }`.
 */
function validate(schema, body, res) {
  const result = schema.safeParse(body)
  if (!result.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    })
    return { error: true }
  }
  return { data: result.data }
}

//  Routes

/**
 * GET /sessions
 * Returns all sessions the user owns OR has joined as a participant, newest first.
 */
router.get('/', async (req, res) => {
  const sessions = await CodeSession
    .find({
      $or: [
        { owner: req.userId },
        { participants: req.userId },
      ],
    })
    .sort({ updatedAt: -1 })
    .select('title language updatedAt participants owner')
    .lean()

  res.json(sessions)
})

/**
 * POST /sessions
 * Create a new code session.
 */
router.post('/', async (req, res) => {
  const { data, error } = validate(createSessionSchema, req.body, res)
  if (error) return

  const session = await CodeSession.create({
    title: data.title,
    language: data.language,
    owner: req.userId,
  })

  res.status(201).json(session)
})

/**
 * GET /sessions/:id
 * Any authenticated user can open a session via its link.
 * If they are not yet a participant they are auto-added (idempotent $addToSet).
 */
router.get('/:id', async (req, res) => {
  const session = await CodeSession
    .findById(req.params.id)
    .populate('owner', 'username name avatarUrl')
    .populate('participants', 'username name avatarUrl')
    .lean()

  if (!session) {
    return res.status(404).json({ message: 'Session not found.' })
  }

  const isOwner = session.owner._id.toString() === req.userId

  // Auto-join: if not the owner and not already a participant, add them now
  if (!isOwner) {
    const alreadyIn = session.participants.some(
      (p) => p._id.toString() === req.userId
    )
    if (!alreadyIn) {
      await CodeSession.findByIdAndUpdate(req.params.id, {
        $addToSet: { participants: req.userId },
      })
    }
  }

  res.json(session)
})

/**
 * PATCH /sessions/:id/code
 * Auto-save the editor content. Any participant (including newly joined) may save.
 */
router.patch('/:id/code', async (req, res) => {
  const { data, error } = validate(updateCodeSchema, req.body, res)
  if (error) return

  const session = await CodeSession.findById(req.params.id).lean()

  if (!session) {
    return res.status(404).json({ message: 'Session not found.' })
  }

  // Auto-join if needed (handles edge case where PATCH arrives before GET)
  const isOwner = session.owner.toString() === req.userId
  if (!isOwner) {
    await CodeSession.findByIdAndUpdate(req.params.id, {
      $addToSet: { participants: req.userId },
    })
  }

  await CodeSession.findByIdAndUpdate(req.params.id, { code: data.code })

  res.json({ message: 'Saved.' })
})

/**
 * DELETE /sessions/:id
 * Delete a session. Only the owner may delete.
 */
router.delete('/:id', async (req, res) => {
  const session = await CodeSession.findById(req.params.id).lean()

  if (!session) {
    return res.status(404).json({ message: 'Session not found.' })
  }

  if (session.owner.toString() !== req.userId) {
    return res.status(403).json({ message: 'Only the owner can delete this session.' })
  }

  await CodeSession.findByIdAndDelete(req.params.id)

  res.json({ message: 'Session deleted.' })
})

export default router
