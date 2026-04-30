import { Router } from 'express'
import { z } from 'zod'
import CodeSession from '../models/CodeSession.js'
import requireAuth from '../middleware/requireAuth.js'
import { SUPPORTED_LANGUAGES } from '../config/constants.js'

const router = Router()
router.use(requireAuth) // all routes require login

const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({ message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` }),
  }),
})

const updateCodeSchema = z.object({
  code: z.string(),
})

// Validate request body against a Zod schema
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

// GET /sessions — list all sessions the user owns or joined
router.get('/', async (req, res) => {
  try {
    const sessions = await CodeSession
      .find({ $or: [{ owner: req.userId }, { participants: req.userId }] })
      .sort({ updatedAt: -1 })
      .select('title language updatedAt participants owner')
      .lean()
    res.json(sessions)
  } catch (err) {
    console.error('[GET /sessions]', err)
    res.status(500).json({ message: 'Failed to load sessions.' })
  }
})

// POST /sessions — create a new session
router.post('/', async (req, res) => {
  try {
    const { data, error } = validate(createSessionSchema, req.body, res)
    if (error) return
    const session = await CodeSession.create({
      title: data.title,
      language: data.language,
      owner: req.userId,
    })
    res.status(201).json(session)
  } catch (err) {
    console.error('[POST /sessions]', err)
    res.status(500).json({ message: 'Failed to create session.' })
  }
})

// GET /sessions/:id — open a session (auto-join if not already a participant)
router.get('/:id', async (req, res) => {
  try {
    const session = await CodeSession
      .findById(req.params.id)
      .populate('owner', 'username name avatarUrl')
      .populate('participants', 'username name avatarUrl')
      .lean()

    if (!session) return res.status(404).json({ message: 'Session not found.' })

    const isOwner = session.owner._id.toString() === req.userId

    // Auto-add the visitor as a participant on first visit
    if (!isOwner) {
      const alreadyIn = session.participants.some(p => p._id.toString() === req.userId)
      if (!alreadyIn) {
        await CodeSession.findByIdAndUpdate(req.params.id, {
          $addToSet: { participants: req.userId },
        })
        console.log(`[sessions] ${req.userId} auto-joined session ${req.params.id}`)
      }
    }

    res.json(session)
  } catch (err) {
    console.error('[GET /sessions/:id]', err)
    res.status(500).json({ message: 'Failed to load session.' })
  }
})

// PATCH /sessions/:id/code — auto-save editor content
router.patch('/:id/code', async (req, res) => {
  const { data, error } = validate(updateCodeSchema, req.body, res)
  if (error) return

  const session = await CodeSession.findById(req.params.id).lean()
  if (!session) return res.status(404).json({ message: 'Session not found.' })

  // Auto-join if needed (edge case: PATCH before GET completes)
  if (session.owner.toString() !== req.userId) {
    await CodeSession.findByIdAndUpdate(req.params.id, {
      $addToSet: { participants: req.userId },
    })
  }

  await CodeSession.findByIdAndUpdate(req.params.id, { code: data.code })
  res.json({ message: 'Saved.' })
})

// DELETE /sessions/:id — only the owner can delete
router.delete('/:id', async (req, res) => {
  const session = await CodeSession.findById(req.params.id).lean()
  if (!session) return res.status(404).json({ message: 'Session not found.' })

  if (session.owner.toString() !== req.userId) {
    return res.status(403).json({ message: 'Only the owner can delete this session.' })
  }

  await CodeSession.findByIdAndDelete(req.params.id)
  res.json({ message: 'Session deleted.' })
})

export default router
