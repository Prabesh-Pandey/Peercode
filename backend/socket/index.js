
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { ALLOWED_ORIGINS } from '../config/constants.js'
import CodeSession from '../models/CodeSession.js'

// In-memory map: sessionId → Map(socketId → { userId, username, avatarUrl })
const rooms = new Map()

// Attach Socket.io to the Express HTTP server
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
  })

  // Verify JWT cookie before allowing a connection
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '')
      const payload = jwt.verify(cookies.token, process.env.JWT_SECRET)
      socket.userId   = payload.sub
      socket.username = payload.username
      next()
    } catch {
      next(new Error('Invalid or expired token.'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.username}`)

    // Client sends this right after connecting to join a session room
    socket.on('join:session', async ({ sessionId, avatarUrl }) => {
      socket.join(sessionId)

      // Track in memory
      if (!rooms.has(sessionId)) rooms.set(sessionId, new Map())
      rooms.get(sessionId).set(socket.id, {
        userId:    socket.userId,
        username:  socket.username,
        avatarUrl: avatarUrl || '',
      })

      // Save to DB (safe to call multiple times)
      await CodeSession.findByIdAndUpdate(sessionId, {
        $addToSet: { participants: socket.userId },
      }).catch(() => {})

      // Tell everyone in the room who is online
      const members = [...rooms.get(sessionId).values()]
      io.to(sessionId).emit('presence:update', members)

      console.log(`[socket] ${socket.username} joined session ${sessionId}`)
    })

    // Broadcast code changes to everyone else in the room
    socket.on('code:change', ({ sessionId, code }) => {
      socket.to(sessionId).emit('code:change', { code })
    })

    // Broadcast a new comment to everyone else in the room
    socket.on('comment:new', ({ sessionId, comment }) => {
      socket.to(sessionId).emit('comment:new', { comment })
    })

    // Clean up when a user leaves
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue

        const room = rooms.get(roomId)
        if (!room) continue

        room.delete(socket.id)

        // Participants stay in DB permanently — only memory presence is cleared
        if (room.size === 0) {
          rooms.delete(roomId)
        } else {
          io.to(roomId).emit('presence:update', [...room.values()])
        }
      }

      console.log(`[socket] disconnected: ${socket.username}`)
    })
  })

  return io
}
