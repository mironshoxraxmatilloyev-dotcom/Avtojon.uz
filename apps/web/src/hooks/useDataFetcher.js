import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

// 🚀 Global cache - barcha componentlar uchun umumiy
const globalCache = new Map()
const CACHE_TTL = 30000 // 30 sekund
const STALE_TTL = 120000 // 2 daqiqa

// 🎯 Prefetch queue - oldindan yuklash
const prefetchQueue = new Set()

/**
 * useDataFetcher - Tez va optimallashtirilgan data fetching hook
 * 
 * Features:
 * - SWR (Stale-While-Revalidate) pattern
 * - Global cache
 * - Prefetching
 * - Optimistic updates
 * - Deduplication
 */
export function useDataFetcher(url, options = {}) {
  const {
    params = {},
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    refetchInterval = 0,
    dedupe = true
  } = options

  const [data, setData] = useState(() => {
    // Dastlab cache dan olish
    const cacheKey = getCacheKey(url, params)
    const cached = globalCache.get(cacheKey)
    if (cached) return cached.data
    return initialData
  })
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  
  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)

  const cacheKey = getCacheKey(url, params)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled || !url) return

    // Dedupe - bir xil so'rovni takrorlamaslik
    if (dedupe && fetchingRef.current && !force) return
    
    const cached = globalCache.get(cacheKey)
    const now = Date.now()

    // Fresh cache - fetch qilmaslik
    if (cached && !force && (now - cached.timestamp < CACHE_TTL)) {
      if (mountedRef.current && data !== cached.data) {
        setData(cached.data)
        setLoading(false)
      }
      return
    }

    // Stale cache - darhol ko'rsatish, fonda yangilash
    if (cached && (now - cached.timestamp < STALE_TTL)) {
      if (mountedRef.current && data !== cached.data) {
        setData(cached.data)
        setLoading(false)
      }
      setIsValidating(true)
    } else {
      setLoading(true)
    }

    fetchingRef.current = true

    try {
      const response = await api.get(url, { params: { ...params, noCache: true } })
      const newData = response.data.data || response.data

      // Cache ga saqlash
      globalCache.set(cacheKey, {
        data: newData,
        timestamp: Date.now()
      })

      if (mountedRef.current) {
        setData(newData)
        setError(null)
        onSuccess?.(newData)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err)
        onError?.(err)
      }
    } finally {
      fetchingRef.current = false
      if (mountedRef.current) {
        setLoading(false)
        setIsValidating(false)
      }
    }
  }, [url, cacheKey, enabled, dedupe, onSuccess, onError])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return
    const interval = setInterval(() => fetchData(), refetchInterval)
    return () => clearInterval(interval)
  }, [refetchInterval, fetchData])

  // Cleanup
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  // Optimistic update
  const mutate = useCallback((newData, shouldRevalidate = true) => {
    if (typeof newData === 'function') {
      setData(prev => {
        const updated = newData(prev)
        globalCache.set(cacheKey, { data: updated, timestamp: Date.now() })
        return updated
      })
    } else {
      setData(newData)
      globalCache.set(cacheKey, { data: newData, timestamp: Date.now() })
    }
    if (shouldRevalidate) {
      setTimeout(() => fetchData(true), 100)
    }
  }, [cacheKey, fetchData])

  return {
    data,
    loading,
    error,
    isValidating,
    refetch,
    mutate
  }
}

/**
 * useMultiDataFetcher - Bir nechta endpoint ni parallel yuklash
 */
export function useMultiDataFetcher(endpoints, options = {}) {
  const { enabled = true, onSuccess, onError } = options
  
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const fetchAll = useCallback(async (force = false) => {
    if (!enabled || !endpoints?.length) return

    // Dastlab cache dan olish
    if (!force) {
      const cachedData = {}
      let allCached = true
      
      for (const ep of endpoints) {
        const key = typeof ep === 'string' ? ep : ep.url
        const cacheKey = getCacheKey(key, ep.params)
        const cached = globalCache.get(cacheKey)
        
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          cachedData[key] = cached.data
        } else {
          allCached = false
        }
      }

      if (allCached) {
        setData(cachedData)
        setLoading(false)
        return
      }
    }

    setLoading(true)

    try {
      const promises = endpoints.map(ep => {
        const url = typeof ep === 'string' ? ep : ep.url
        const params = typeof ep === 'string' ? {} : (ep.params || {})
        return api.get(url, { params: { ...params, noCache: true } })
      })

      const results = await Promise.all(promises)
      const newData = {}

      results.forEach((res, i) => {
        const ep = endpoints[i]
        const key = typeof ep === 'string' ? ep : ep.url
        const cacheKey = getCacheKey(key, ep.params)
        const responseData = res.data.data || res.data
        
        newData[key] = responseData
        globalCache.set(cacheKey, { data: responseData, timestamp: Date.now() })
      })

      if (mountedRef.current) {
        setData(newData)
        setError(null)
        onSuccess?.(newData)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err)
        onError?.(err)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [endpoints, enabled, onSuccess, onError])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  return { data, loading, error, refetch: () => fetchAll(true) }
}

/**
 * prefetch - Ma'lumotlarni oldindan yuklash
 */
export async function prefetch(url, params = {}) {
  const cacheKey = getCacheKey(url, params)
  
  // Allaqachon yuklanmoqda
  if (prefetchQueue.has(cacheKey)) return
  
  // Cache da bor va fresh
  const cached = globalCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) return

  prefetchQueue.add(cacheKey)

  try {
    const response = await api.get(url, { params: { ...params, noCache: true } })
    const data = response.data.data || response.data
    globalCache.set(cacheKey, { data, timestamp: Date.now() })
  } catch {
    // Silent fail for prefetch
  } finally {
    prefetchQueue.delete(cacheKey)
  }
}

/**
 * prefetchMultiple - Bir nechta endpoint ni oldindan yuklash
 */
export function prefetchMultiple(endpoints) {
  endpoints.forEach(ep => {
    const url = typeof ep === 'string' ? ep : ep.url
    const params = typeof ep === 'string' ? {} : (ep.params || {})
    prefetch(url, params)
  })
}

/**
 * clearDataCache - Cache ni tozalash
 */
export function clearDataCache(url) {
  if (url) {
    // Specific URL cache ni tozalash
    for (const key of globalCache.keys()) {
      if (key.startsWith(url)) {
        globalCache.delete(key)
      }
    }
  } else {
    globalCache.clear()
  }
}

// Helper
function getCacheKey(url, params = {}) {
  return url + JSON.stringify(params)
}

export default useDataFetcher
