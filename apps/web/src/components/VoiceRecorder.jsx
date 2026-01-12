/**
 * VoiceRecorder - Ovozli xarajat kiritish komponenti
 * Groq Whisper + LLM orqali ovozni matnga va strukturali ma'lumotga aylantiradi
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2, X, Check, AlertCircle, Volume2, Fuel, Utensils, Car, Wrench, Droplet, FileText, CircleDot, Circle } from 'lucide-react'
import api from '../services/api'

// Xarajat turlari mapping
const EXPENSE_TYPE_MAP = {
  fuel: 'fuel_metan',
  food: 'food',
  toll: 'toll',
  repair: 'repair_small',
  wash: 'wash',
  fine: 'fine',
  parking: 'toll',
  other: 'other'
}

// Xarajat turlari icon mapping
const EXPENSE_TYPE_ICONS = {
  fuel: { Icon: Fuel, color: 'text-amber-500', label: "Yoqilg'i" },
  food: { Icon: Utensils, color: 'text-green-500', label: 'Ovqat' },
  toll: { Icon: Car, color: 'text-blue-500', label: "Yo'l to'lovi" },
  repair: { Icon: Wrench, color: 'text-red-500', label: "Ta'mir" },
  wash: { Icon: Droplet, color: 'text-cyan-500', label: 'Yuvish' },
  fine: { Icon: FileText, color: 'text-purple-500', label: 'Jarima' },
  parking: { Icon: Car, color: 'text-purple-500', label: 'Parkovka' },
  other: { Icon: CircleDot, color: 'text-gray-500', label: 'Boshqa' }
}

// Yoqilg'i turlari mapping
const FUEL_TYPE_MAP = {
  metan: 'fuel_metan',
  benzin: 'fuel_benzin',
  dizel: 'fuel_diesel',
  diesel: 'fuel_diesel',
  propan: 'fuel_propan',
  gas: 'fuel_gas'
}

// Yoqilg'i turlari icon mapping
const FUEL_TYPE_ICONS = {
  metan: { Icon: CircleDot, color: 'text-blue-500', label: 'Metan' },
  benzin: { Icon: Circle, color: 'text-yellow-500', label: 'Benzin' },
  dizel: { Icon: Droplet, color: 'text-amber-700', label: 'Dizel' },
  propan: { Icon: Circle, color: 'text-green-500', label: 'Propan' }
}

export default function VoiceRecorder({ onResult, onClose, flightId, selectedLeg }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [wavePhase, setWavePhase] = useState(0)
  
  // Qo'shimcha ma'lumotlar uchun state (yoqilg'i miqdori)
  const [editedData, setEditedData] = useState({})
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)

  // Result o'zgarganda editedData ni yangilash
  useEffect(() => {
    if (result?.data) {
      // Yoqilg'i turiga qarab birlikni to'g'ri aniqlash
      const fuelType = result.data.fuelType || 'metan'
      const isGas = ['metan', 'propan', 'gas'].includes(fuelType.toLowerCase())
      const correctUnit = isGas ? 'kub' : 'litr'
      
      setEditedData({
        quantity: result.data.quantity || '',
        quantityUnit: correctUnit, // Yoqilg'i turiga qarab to'g'ri birlik
        amount: result.data.amount || '',
        fuelType: fuelType,
        odometer: result.data.odometer || ''
      })
    }
  }, [result])

  // Wave animation for recording
  useEffect(() => {
    let animationId
    if (isRecording) {
      const animate = () => {
        setWavePhase(p => p + 0.15)
        animationId = requestAnimationFrame(animate)
      }
      animationId = requestAnimationFrame(animate)
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isRecording])

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    setAudioLevel(average / 255)
    
    animationRef.current = requestAnimationFrame(monitorAudioLevel)
  }, [])

  // Yozishni boshlash
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
      audioChunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      streamRef.current = stream
      
      // Audio analyser setup
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      
      // MediaRecorder setup
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        })
        await processAudio(audioBlob)
      }
      
      mediaRecorder.start(100) // 100ms chunks
      setIsRecording(true)
      setRecordingTime(0)
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      
      // Audio level monitoring
      monitorAudioLevel()
      
    } catch (err) {
      console.error('Mikrofon xatosi:', err)
      setError('Mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalarini tekshiring.')
    }
  }, [monitorAudioLevel])

  // Yozishni to'xtatish
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Audio ni serverga yuborish va tahlil qilish
  const processAudio = async (audioBlob) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', 'uz')
      formData.append('context', 'expense')
      if (flightId) {
        formData.append('flightId', flightId)
      }
      
      const response = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data?.success && response.data?.data) {
        const { text, data } = response.data.data
        setResult({ text, data })
      } else {
        throw new Error('Javob noto\'g\'ri formatda')
      }
    } catch (err) {
      console.error('Voice processing error:', err)
      setError(err.response?.data?.message || err.message || 'Ovozni qayta ishlashda xatolik')
    } finally {
      setIsProcessing(false)
    }
  }

  // Natijani tasdiqlash
  const confirmResult = useCallback(() => {
    if (result?.data) {
      // Yoqilg'i turini aniqlash
      let expenseType = EXPENSE_TYPE_MAP[result.data.type] || 'other'
      const fuelType = editedData.fuelType || result.data.fuelType
      if (result.data.type === 'fuel' && fuelType) {
        expenseType = FUEL_TYPE_MAP[fuelType] || 'fuel_metan'
      }
      
      const finalAmount = editedData.amount || result.data.amount || 0
      const finalQuantity = editedData.quantity || result.data.quantity || null
      const finalUnit = editedData.quantityUnit || result.data.quantityUnit || null
      const finalOdometer = editedData.odometer || null
      
      const expenseData = {
        type: expenseType,
        amount: Number(finalAmount) || 0,
        description: result.data.description || result.text,
        currency: 'UZS',
        amountInUZS: Number(finalAmount) || 0,
        quantity: finalQuantity ? Number(finalQuantity) : null,
        quantityUnit: finalUnit,
        odometer: finalOdometer ? Number(finalOdometer) : null,
        legId: selectedLeg?.leg?._id || null,
        legIndex: selectedLeg?.index ?? null,
        addedBy: 'voice'
      }
      onResult(expenseData)
    }
  }, [result, selectedLeg, onResult, editedData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format money
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] mb-[env(safe-area-inset-bottom,0px)]" style={{ marginBottom: 'max(env(safe-area-inset-bottom, 0px), 70px)' }}>
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-1" />
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Ovozli kiritish</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Xarajatni ovoz bilan kiriting</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(85vh-80px)] sm:max-h-[70vh]">
          {/* Recording Button */}
          {!result && !isProcessing && (
            <div className="flex flex-col items-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                } shadow-2xl active:scale-95`}
              >
                {/* ChatGPT style wave animation */}
                {isRecording && (
                  <>
                    {/* Animated wave bars */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-white/80 rounded-full"
                          style={{
                            height: `${20 + audioLevel * 60 + Math.sin(wavePhase + i * 0.8) * 15}px`,
                            transition: 'height 0.05s ease-out'
                          }}
                        />
                      ))}
                    </div>
                    {/* Outer pulse rings */}
                    <div className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-[-8px] rounded-full border-2 border-red-300/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  </>
                )}
                
                {!isRecording && <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />}
              </button>
              
              {isRecording ? (
                <div className="mt-3 sm:mt-4 text-center">
                  <p className="text-red-400 font-semibold text-base sm:text-lg">{formatTime(recordingTime)}</p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">Gapiring... To'xtatish uchun bosing</p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs sm:text-sm mt-3 sm:mt-4 text-center">
                  Mikrofon tugmasini bosing va gapiring
                </p>
              )}
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
              <p className="text-white font-semibold mt-4">Tahlil qilinmoqda...</p>
              <p className="text-slate-400 text-sm mt-1">Ovoz matnga aylantirilmoqda</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold">Xatolik</p>
                  <p className="text-red-300/80 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => { setError(null); setResult(null) }}
                className="w-full mt-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          )}

          {/* Result */}
          {result && !error && (
            <div className="space-y-4">
              {/* Transcribed text */}
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-slate-400 text-xs font-semibold mb-2">SIZ AYTDINGIZ:</p>
                <p className="text-white text-lg">"{result.text}"</p>
                
                {/* Noto'g'ri tushunilgan bo'lsa */}
                {result.data?.confidence < 0.8 && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      To'liq tushunilmagan bo'lishi mumkin
                    </p>
                    <p className="text-amber-300/70 text-xs mt-1">
                      Iltimos, ma'lumotlarni tekshiring yoki qayta gapiring
                    </p>
                  </div>
                )}
              </div>

              {/* Parsed data */}
              {result.data && (
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-emerald-400 text-xs font-semibold">ANIQLANGAN MA'LUMOTLAR:</p>
                    {result.data.confidence && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        result.data.confidence >= 0.9 ? 'bg-emerald-500/20 text-emerald-400' : 
                        result.data.confidence >= 0.7 ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {result.data.confidence >= 0.9 ? '✓ Aniq' : 
                         result.data.confidence >= 0.7 ? '⚠ Tekshiring' : 
                         '❌ Noaniq'}
                      </span>
                    )}
                  </div>
                  
                  {result.data.type && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Turi:</span>
                      <span className="text-white font-semibold capitalize flex items-center gap-1.5">
                        {(() => {
                          const typeInfo = EXPENSE_TYPE_ICONS[result.data.type] || EXPENSE_TYPE_ICONS.other
                          const IconComponent = typeInfo.Icon
                          return (
                            <>
                              <IconComponent size={16} className={typeInfo.color} />
                              {typeInfo.label}
                            </>
                          )
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Yoqilg'i turi - tahrirlash mumkin */}
                  {result.data.type === 'fuel' && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Yoqilg'i turi:</span>
                      <select
                        value={editedData.fuelType || 'metan'}
                        onChange={(e) => setEditedData(prev => ({ 
                          ...prev, 
                          fuelType: e.target.value,
                          quantityUnit: e.target.value === 'metan' || e.target.value === 'gas' ? 'kub' : 'litr'
                        }))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-semibold focus:outline-none focus:border-blue-500"
                      >
                        <option value="metan">Metan</option>
                        <option value="benzin">Benzin</option>
                        <option value="dizel">Dizel</option>
                        <option value="propan">Propan</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Summa - tahrirlash mumkin */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Summa:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editedData.amount ? formatMoney(editedData.amount) : ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, amount: e.target.value.replace(/\D/g, '') }))}
                        className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-400 text-right font-bold focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                      <span className="text-slate-400 text-sm">so'm</span>
                    </div>
                  </div>

                  {/* Yoqilg'i miqdori - tahrirlash mumkin */}
                  {result.data.type === 'fuel' && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Miqdori:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedData.quantity || ''}
                          onChange={(e) => setEditedData(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none focus:border-cyan-500"
                          placeholder="0"
                        />
                        <select
                          value={editedData.quantityUnit || 'litr'}
                          onChange={(e) => setEditedData(prev => ({ ...prev, quantityUnit: e.target.value }))}
                          className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
                        >
                          <option value="litr">litr</option>
                          <option value="kub">kub</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Spidometr - yoqilg'i uchun */}
                  {result.data.type === 'fuel' && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Spidometr:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editedData.odometer || ''}
                          onChange={(e) => setEditedData(prev => ({ ...prev, odometer: e.target.value }))}
                          className="w-28 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-blue-400 text-right font-semibold focus:outline-none focus:border-blue-500"
                          placeholder="0"
                        />
                        <span className="text-slate-400 text-sm">km</span>
                      </div>
                    </div>
                  )}

                  {/* Narx hisoblash */}
                  {result.data.type === 'fuel' && editedData.quantity && editedData.amount && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-slate-500 text-xs">1 {editedData.quantityUnit || 'litr'} narxi:</span>
                      <span className="text-amber-400 font-semibold">
                        {formatMoney(Math.round(Number(editedData.amount) / Number(editedData.quantity)))} so'm
                      </span>
                    </div>
                  )}
                  
                  {result.data.description && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Izoh:</span>
                      <span className="text-white text-sm">{result.data.description}</span>
                    </div>
                  )}
                  
                  {result.data.route && (result.data.route.fromCity || result.data.route.toCity) && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Marshrut:</span>
                      <span className="text-white">
                        {result.data.route.fromCity || '?'} → {result.data.route.toCity || '?'}
                      </span>
                    </div>
                  )}

                  {result.data.confidence && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-slate-500 text-xs">Aniqlik darajasi:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              result.data.confidence >= 0.9 ? 'bg-emerald-500' : 
                              result.data.confidence >= 0.7 ? 'bg-amber-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${result.data.confidence * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${
                          result.data.confidence >= 0.9 ? 'text-emerald-400' : 
                          result.data.confidence >= 0.7 ? 'text-amber-400' : 
                          'text-red-400'
                        }`}>
                          {Math.round(result.data.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setError(null); setEditedData({}) }}
                  className="flex-1 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Mic size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Qayta yozish
                </button>
                
                <button
                  onClick={confirmResult}
                  disabled={!editedData.amount && !result.data?.amount}
                  className="flex-1 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 text-sm sm:text-base active:scale-[0.98]"
                >
                  <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Tasdiqlash
                </button>
              </div>
              
              {/* Noaniq bo'lsa qo'shimcha yordam */}
              {result.data?.confidence < 0.8 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-blue-400 text-xs font-semibold mb-2">💡 Maslahat:</p>
                  <ul className="text-blue-300/80 text-xs space-y-1">
                    <li>• Sekinroq va aniqroq gapiring</li>
                    <li>• Raqamlarni alohida ayting: "ikki yuz ellik ming"</li>
                    <li>• Yoqilg'i turini ayting: "metan", "benzin", "dizel"</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {!isRecording && !isProcessing && !result && !error && (
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold mb-3">NAMUNA GAPLAR:</p>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• "50 kub metanga 250 ming so'm"</li>
                <li>• "40 litr benzinga 200 ming"</li>
                <li>• "Tushlikka 50 ming sarfladim"</li>
                <li>• "Yo'l to'lovi 20 ming"</li>
                <li>• "Mashina yuvishga 30 ming"</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
