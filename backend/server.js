import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import connectDB from './config/db.js'
import { ALLOWED_ORIGINS } from './config/constants.js'
import authRouter from './routes/auth.js'
import sessionsRouter from './routes/sessions.js'
import commentsRouter from './routes/comments.js'
import { initSocket } from './socket/index.js'


const app = express()
const PORT = process.env.PORT || 8000

// Limit each IP to 100 requests per 15 minutes (production only)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
})

//  Global middleware 
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(limiter)

//  Routes 
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRouter)
app.use('/sessions', sessionsRouter)
app.use('/comments', commentsRouter)

//  Database 
await connectDB()

//  Start server 
const server = app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`)
})

// Attach Socket.io to the same HTTP server
const io = initSocket(server)

//  Graceful shutdown 
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`)
  server.close(async () => {
    await mongoose.connection.close()
    console.log(' MongoDB connection closed')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))