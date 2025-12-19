import { useEffect, useState, useCallback } from 'react'
import { connectSocket, getSocket, disconnectSocket, joinDriverRoom, joinBusinessRoom } from '../services/socket'

// useSocket hook - socket.io bilan ishlash uchun
export function useSocket() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const s = connectSocket()
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

  return { socket, isConnected, joinDriverRoom, joinBusinessRoom, disconnectSocket }
}

export default useSocket
