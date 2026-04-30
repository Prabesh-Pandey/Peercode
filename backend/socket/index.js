
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'
import { ALLOWED_ORIGINS } from '../config/constants.js'
import CodeSession from '../models/CodeSession.js'

/**
 * In-memory presence store.
 * Structure: Map<sessionId, Map<socketId, { userId, username, avatarUrl }>>
 * No Redis needed — the ROADMAP decision is to handle presence purely in memory + MongoDB.
 */
const rooms = new Map()

/**
 * Attach a Socket.io server to the existing Express HTTP server.
 * Call this once in server.js, passing the `server` returned by `app.listen()`.
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,   // needed so the browser sends the httpOnly cookie
    },
  })

  //  Auth middleware 
  // Runs before every connection. Verifies the JWT stored in the httpOnly cookie.
  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie || ''
      const cookies    = cookie.parse(rawCookies)
      const token      = cookies.token

      if (!token) {
        return next(new Error('Authentication required.'))
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET)

      // Attach user info to the socket so event handlers can use it
      socket.userId   = payload.sub
      socket.username = payload.username

      next()
    } catch {
      next(new Error('Invalid or expired token.'))
    }
  })

  //  Connection handler 
  io.on('connection', (socket) => {
    console.log(` [socket] connected — user:${socket.username} socket:${socket.id}`)

    // join:session 
    // Client emits this immediately after connecting, passing the sessionId.
    socket.on('join:session', async ({ sessionId, avatarUrl }) => {
      socket.join(sessionId)

      // In-memory presence
      if (!rooms.has(sessionId)) rooms.set(sessionId, new Map())
      rooms.get(sessionId).set(socket.id, {
        userId:    socket.userId,
        username:  socket.username,
        avatarUrl: avatarUrl || '',
      })

      // MongoDB — persist this user in the participants array (idempotent)
      await CodeSession.findByIdAndUpdate(sessionId, {
        $addToSet: { participants: socket.userId },
      }).catch(() => {})  // non-fatal if session doesn't exist yet

      const members = [...rooms.get(sessionId).values()]
      io.to(sessionId).emit('presence:update', members)

      console.log(` [socket] ${socket.username} joined session ${sessionId}`)
    })

    //  code:change 
    // Client emits whenever the editor content changes.
    // We broadcast to everyone else in the room (not back to sender).
    socket.on('code:change', ({ sessionId, code }) => {
      socket.to(sessionId).emit('code:change', { code })
    })

    //  comment:new 
    // Client emits after successfully POSTing a comment to the REST API.
    // We broadcast the saved comment object to the room.
    socket.on('comment:new', ({ sessionId, comment }) => {
      socket.to(sessionId).emit('comment:new', { comment })
    })

    //  disconnect 
    socket.on('disconnecting', async () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue

        const room = rooms.get(roomId)
        if (!room) continue

        room.delete(socket.id)

        // MongoDB — remove this user from participants when they go offline
        // Only removes them if no other socket for this user is still in the room
        const stillPresent = [...room.values()].some((m) => m.userId === socket.userId)
        if (!stillPresent) {
          await CodeSession.findByIdAndUpdate(roomId, {
            $pull: { participants: socket.userId },
          }).catch(() =>{})
        }

        if (room.size === 0) {
          rooms.delete(roomId)
        } else {
          const members = [...room.values()]
          io.to(roomId).emit('presence:update', members)
        }
      }

      console.log(`[socket] disconnected — user:${socket.username} socket:${socket.id}`)
    })
  })

  return io
}
