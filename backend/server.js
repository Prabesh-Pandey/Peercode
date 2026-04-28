// server.js
import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import connectDB from './config/db.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())
app.use(cookieParser())

await connectDB()

const server = app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`)
})

// graceful shutdown
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