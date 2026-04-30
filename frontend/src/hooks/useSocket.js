import { useRef, useEffect } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Manages a Socket.io connection for a single session.
// Returns a ref to the socket so you can emit events from anywhere.
export default function useSocket(sessionId, user) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!sessionId || !user) return

    // Connect — the JWT cookie is sent automatically with credentials: true
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    // Join the session room once connected
    socket.on('connect', () => {
      socket.emit('join:session', {
        sessionId,
        avatarUrl: user.avatarUrl || '',
      })
    })

    socket.on('connect_error', (err) => {
      console.error('[socket] connection error:', err.message)
    })

    // Disconnect and clean up when the component unmounts
    return () => socket.disconnect()
  }, [sessionId, user])

  return socketRef
}
