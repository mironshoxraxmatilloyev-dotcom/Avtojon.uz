import { useEffect, useState, useCallback, useRef } from 'react'
import {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinDriverRoom,
  joinBusinessRoom
} from '../services/socket'

// useSocket hook - socket.io bilan ishlash uchun
export function useSocket() {
  const [socket, setSocket] = useState(() => getSocket())
  const [isConnected, setIsConnected] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Socket ni olish yoki yaratish
    let s = getSocket()
    if (!s) {
      s = connectSocket()
    }

    if (mountedRef.current) {
      setSocket(s)
      setIsConnected(s?.connected || false)
    }

    const handleConnect = () => {
      if (mountedRef.current) {
        setIsConnected(true)
        setSocket(s)
      }
    }

    const handleDisconnect = () => {
      if (mountedRef.current) {
        setIsConnected(false)
      }
    }

    s.on('connect', handleConnect)
    s.on('disconnect', handleDisconnect)

    // Agar allaqachon ulangan bo'lsa
    if (s.connected && mountedRef.current) {
      setIsConnected(true)
    }

    return () => {
      mountedRef.current = false
      s.off('connect', handleConnect)
      s.off('disconnect', handleDisconnect)
    }
  }, [])

  // Stable callbacks
  const stableJoinDriverRoom = useCallback((driverId) => {
    if (driverId) {
      joinDriverRoom(driverId)
    }
  }, [])

  const stableJoinBusinessRoom = useCallback((businessId) => {
    if (businessId) {
      joinBusinessRoom(businessId)
    }
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
