// src/hooks/useSocket.js
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Custom hook that manages a Socket.io connection for a single code session.
 *
 * Usage:
 *   const socket = useSocket(sessionId, user)
 *
 * - Connects to the server on mount (with credentials so the JWT cookie is sent)
 * - Emits `join:session` once connected, passing sessionId + user's avatarUrl
 * - Disconnects automatically on unmount (or when sessionId changes)
 * - Returns a stable ref to the socket instance so callers never get stale closures
 */
export default function useSocket(sessionId, user) {
  // We expose a ref rather than the socket directly so event handlers that
  // close over `socketRef.current` always see the latest instance.
  const socketRef = useRef(null)

  useEffect(() => {
    if (!sessionId || !user) return

    // Create the connection — withCredentials sends the httpOnly JWT cookie
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],  // prefer WebSocket, fall back to long-polling
    })

    socketRef.current = socket

    // Once connected, join the session room
    socket.on('connect', () => {
      socket.emit('join:session', {
        sessionId,
        avatarUrl: user.avatarUrl || '',
      })
    })

    socket.on('connect_error', (err) => {
      console.error('[socket] connection error:', err.message)
    })

    // Cleanup: leave the room and close the connection when the component unmounts
    // or when sessionId / user changes
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId, user])

  return socketRef
}
