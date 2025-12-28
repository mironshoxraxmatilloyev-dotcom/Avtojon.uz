import { useEffect, useState, useCallback, useRef } from 'react'
import { connectSocket, getSocket, disconnectSocket, joinDriverRoom, joinBusinessRoom } from '../services/socket'

// useSocket hook - socket.io bilan ishlash uchun
export function useSocket() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const s = connectSocket()
    socketRef.current = s
    setSocket(s)

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    s.on('connect', handleConnect)
    s.on('disconnect', handleDisconnect)

    // Agar allaqachon ulangan bo'lsa
    if (s.connected) {
      setIsConnected(true)
    }

    return () => {
      s.off('connect', handleConnect)
      s.off('disconnect', handleDisconnect)
    }
  }, [])

  // Stable callbacks
  const stableJoinDriverRoom = useCallback((driverId) => {
    joinDriverRoom(driverId)
  }, [])

  const stableJoinBusinessRoom = useCallback((businessId) => {
    joinBusinessRoom(businessId)
  }, [])

  return { 
    socket, 
    isConnected, 
    joinDriverRoom: stableJoinDriverRoom, 
    joinBusinessRoom: stableJoinBusinessRoom, 
    disconnectSocket 
  }
}

export default useSocket
