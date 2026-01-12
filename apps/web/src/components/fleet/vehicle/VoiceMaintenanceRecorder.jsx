/**
 * VoiceMaintenanceRecorder - Fleet maintenance uchun ovozli kiritish
 * Moy, shina va xizmat qo'shish uchun
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2, X, Check, AlertCircle, Volume2, Droplet, Circle, Wrench, DollarSign, Truck, Home, FileText, Package } from 'lucide-react'
import api from '../../../services/api'

// Icon komponentlari
const CONTEXT_ICONS = {
  oil: Droplet,
  tire: Circle,
  service: Wrench,
  income: DollarSign
}

// Context turlari
const CONTEXT_CONFIG = {
  oil: {
    title: 'Moy almashtirish',
    subtitle: 'Moy ma\'lumotlarini ovoz bilan kiriting',
    iconName: 'oil',
    examples: [
      '"8 litr Mobil 10W-40 moyga 400 ming"',
      '"Shell sintetik moy 500 mingga"',
      '"Moy almashtirishga 350 ming sarfladim"'
    ]
  },
  tire: {
    title: 'Shina qo\'shish',
    subtitle: 'Shina ma\'lumotlarini ovoz bilan kiriting',
    iconName: 'tire',
    examples: [
      '"Michelin 315/80 shina old chapga 1.5 million"',
      '"4 ta Triangle shina 6 millionga"',
      '"Orqa o\'ng shinani almashtirishga 800 ming"'
    ]
  },
  service: {
    title: 'Xizmat qo\'shish',
    subtitle: 'Texnik xizmat ma\'lumotlarini kiriting',
    iconName: 'service',
    examples: [
      '"TO-2 ga 800 ming ketdi"',
      '"Tormoz kolodkalarini almashtirishga 400 ming"',
      '"Dvigatel ta\'miriga 3 million sarfladim"'
    ]
  },
  income: {
    title: 'Daromad qo\'shish',
    subtitle: 'Daromad ma\'lumotlarini ovoz bilan kiriting',
    iconName: 'income',
    examples: [
      '"Toshkentdan Samarqandga yuk tashib 5 million oldim"',
      '"Mashinani 7 kunga ijaraga berdim kuniga 500 ming"',
      '"Buxoroga 20 tonna yuk olib ketdim 3 million"'
    ]
  }
}

export default function VoiceMaintenanceRecorder({ context = 'oil', onResult, onClose }) {
  const config = CONTEXT_CONFIG[context] || CONTEXT_CONFIG.oil
  
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [editedData, setEditedData] = useState({})
  const [wavePhase, setWavePhase] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (result?.data) {
      setEditedData({ ...result.data })
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

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
    setAudioLevel(average / 255)
    animationRef.current = requestAnimationFrame(monitorAudioLevel)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setResult(null)
      audioChunksRef.current = []
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      })
      streamRef.current = stream
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      
      // Qo'llab-quvvatlanadigan formatni aniqlash
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      
      console.log('🎙️ Using mimeType:', mimeType)
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('Audio chunk:', e.data.size, 'bytes')
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, chunks:', audioChunksRef.current.length)
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log('📁 Total audio size:', audioBlob.size, 'bytes')
        if (audioBlob.size < 5000) {
          setError('Audio juda qisqa yoki bo\'sh. Qaytadan urinib ko\'ring.')
          return
        }
        await processAudio(audioBlob)
      }
      
      // timeslice'siz start - faqat stop'da chunk keladi
      mediaRecorder.start()
      console.log('🔴 Recording started')
      
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
      monitorAudioLevel()
    } catch (err) {
      console.error('Mikrofon xatosi:', err)
      setError('Mikrofonga ruxsat berilmadi')
    }
  }, [monitorAudioLevel])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const processAudio = async (audioBlob) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', 'uz')
      formData.append('context', context)
      
      const response = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data?.success && response.data?.data) {
        setResult(response.data.data)
      } else {
        throw new Error('Javob noto\'g\'ri formatda')
      }
    } catch (err) {
      console.error('Voice processing error:', err)
      setError(err.response?.data?.message || 'Ovozni qayta ishlashda xatolik')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmResult = useCallback(() => {
    if (editedData) {
      onResult(editedData)
    }
  }, [editedData, onResult])

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  const formatMoney = (amount) => new Intl.NumberFormat('uz-UZ').format(amount)

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh]" style={{ marginBottom: 'max(env(safe-area-inset-bottom, 0px), 70px)' }}>
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-1" />
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              {(() => {
                const IconComp = CONTEXT_ICONS[config.iconName]
                return IconComp ? <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : null
              })()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">{config.title}</h2>
              <p className="text-slate-400 text-xs sm:text-sm">{config.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all">
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(85vh-100px)] sm:max-h-[70vh]">
          {/* Recording Button */}
          {!result && !isProcessing && (
            <div className="flex flex-col items-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                } shadow-2xl`}
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
                {!isRecording && <Mic className="w-12 h-12 text-white relative z-10" />}
              </button>
              
              {isRecording ? (
                <div className="mt-4 text-center">
                  <p className="text-red-400 font-semibold text-lg">{formatTime(recordingTime)}</p>
                  <p className="text-slate-400 text-sm mt-1">Gapiring... To'xtatish uchun bosing</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm mt-4 text-center">Mikrofon tugmasini bosing</p>
              )}
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
              <p className="text-white font-semibold mt-4">Tahlil qilinmoqda...</p>
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
              <button onClick={() => { setError(null); setResult(null) }} className="w-full mt-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold">
                Qayta urinish
              </button>
            </div>
          )}

          {/* Result */}
          {result && !error && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <p className="text-emerald-400 text-xs font-semibold">ANIQLANGAN MA'LUMOTLAR:</p>
                
                {/* Oil specific fields */}
                {context === 'oil' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Moy turi:</span>
                      <input
                        type="text"
                        value={editedData.oilType || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, oilType: e.target.value }))}
                        className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                        placeholder="10W-40"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Brend:</span>
                      <input
                        type="text"
                        value={editedData.oilBrand || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, oilBrand: e.target.value }))}
                        className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                        placeholder="Mobil"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Miqdori (litr):</span>
                      <input
                        type="number"
                        value={editedData.liters || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, liters: e.target.value }))}
                        className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}

                {/* Tire specific fields */}
                {context === 'tire' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Brend:</span>
                      <input
                        type="text"
                        value={editedData.brand || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                        placeholder="Michelin"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">O'lcham:</span>
                      <input
                        type="text"
                        value={editedData.size || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, size: e.target.value }))}
                        className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                        placeholder="315/80R22.5"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Pozitsiya:</span>
                      <select
                        value={editedData.position || ''}
                        onChange={(e) => setEditedData(prev => ({ ...prev, position: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none"
                      >
                        <option value="">Tanlang</option>
                        <option value="Old chap">Old chap</option>
                        <option value="Old o'ng">Old o'ng</option>
                        <option value="Orqa chap">Orqa chap</option>
                        <option value="Orqa o'ng">Orqa o'ng</option>
                        <option value="Orqa chap (ichki)">Orqa chap (ichki)</option>
                        <option value="Orqa o'ng (ichki)">Orqa o'ng (ichki)</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Soni:</span>
                      <input
                        type="number"
                        value={editedData.count || 1}
                        onChange={(e) => setEditedData(prev => ({ ...prev, count: e.target.value }))}
                        className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Service specific fields */}
                {context === 'service' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Xizmat turi:</span>
                      <select
                        value={editedData.type || 'TO-1'}
                        onChange={(e) => setEditedData(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none"
                      >
                        <option value="TO-1">TO-1</option>
                        <option value="TO-2">TO-2</option>
                        <option value="TO-3">TO-3</option>
                        <option value="Tormoz">Tormoz</option>
                        <option value="Mufta">Mufta</option>
                        <option value="Reduktor">Reduktor</option>
                        <option value="Dvigatel">Dvigatel</option>
                        <option value="Korobka">Korobka</option>
                        <option value="Elektrika">Elektrika</option>
                        <option value="Kuzov">Kuzov</option>
                        <option value="Boshqa">Boshqa</option>
                      </select>
                    </div>
                      {editedData.description && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Tavsif:</span>
                          <input
                            type="text"
                            value={editedData.description || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                          />
                        </div>
                      )}
                      {editedData.serviceName && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Xizmat nomi:</span>
                          <input
                            type="text"
                            value={editedData.serviceName || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, serviceName: e.target.value }))}
                            className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Income specific fields */}
                  {context === 'income' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Daromad turi:</span>
                        <select
                          value={editedData.type || 'trip'}
                          onChange={(e) => setEditedData(prev => ({ ...prev, type: e.target.value }))}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value="trip">Marshrut</option>
                          <option value="rental">Ijara</option>
                          <option value="contract">Shartnoma</option>
                          <option value="other">Boshqa</option>
                        </select>
                      </div>
                      
                      {/* Summa */}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Summa:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editedData.amount ? formatMoney(editedData.amount) : ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, amount: e.target.value.replace(/\D/g, '') }))}
                            className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-400 text-right font-bold focus:outline-none"
                            placeholder="0"
                          />
                          <span className="text-slate-400 text-sm">so'm</span>
                        </div>
                      </div>

                      {/* Marshrut uchun */}
                      {(editedData.type === 'trip' || !editedData.type) && (
                        <>
                          {(editedData.fromCity || editedData.toCity) && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Marshrut:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editedData.fromCity || ''}
                                  onChange={(e) => setEditedData(prev => ({ ...prev, fromCity: e.target.value }))}
                                  className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-center font-semibold focus:outline-none"
                                  placeholder="Qayerdan"
                                />
                                <span className="text-slate-500">→</span>
                                <input
                                  type="text"
                                  value={editedData.toCity || ''}
                                  onChange={(e) => setEditedData(prev => ({ ...prev, toCity: e.target.value }))}
                                  className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-center font-semibold focus:outline-none"
                                  placeholder="Qayerga"
                                />
                              </div>
                            </div>
                          )}
                          {editedData.distance && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Masofa:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editedData.distance || ''}
                                  onChange={(e) => setEditedData(prev => ({ ...prev, distance: e.target.value }))}
                                  className="w-24 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none"
                                />
                                <span className="text-slate-400 text-sm">km</span>
                              </div>
                            </div>
                          )}
                          {editedData.cargoWeight && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Yuk:</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editedData.cargoWeight || ''}
                                  onChange={(e) => setEditedData(prev => ({ ...prev, cargoWeight: e.target.value }))}
                                  className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none"
                                />
                                <span className="text-slate-400 text-sm">t</span>
                              </div>
                            </div>
                          )}
                          {editedData.clientName && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Mijoz:</span>
                              <input
                                type="text"
                                value={editedData.clientName || ''}
                                onChange={(e) => setEditedData(prev => ({ ...prev, clientName: e.target.value }))}
                                className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Ijara uchun */}
                      {editedData.type === 'rental' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Kunlar:</span>
                            <input
                              type="number"
                              value={editedData.rentalDays || ''}
                              onChange={(e) => {
                                const days = e.target.value
                                setEditedData(prev => {
                                  const newData = { ...prev, rentalDays: days }
                                  if (prev.rentalRate && days) {
                                    newData.amount = String(Number(prev.rentalRate) * Number(days))
                                  }
                                  return newData
                                })
                              }}
                              className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-cyan-400 text-right font-semibold focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Kunlik narx:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editedData.rentalRate ? formatMoney(editedData.rentalRate) : ''}
                                onChange={(e) => {
                                  const rate = e.target.value.replace(/\D/g, '')
                                  setEditedData(prev => {
                                    const newData = { ...prev, rentalRate: rate }
                                    if (prev.rentalDays && rate) {
                                      newData.amount = String(Number(rate) * Number(prev.rentalDays))
                                    }
                                    return newData
                                  })
                                }}
                                className="w-28 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-amber-400 text-right font-semibold focus:outline-none"
                              />
                              <span className="text-slate-400 text-sm">so'm</span>
                            </div>
                          </div>
                        </>
                      )}

                      {editedData.description && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Izoh:</span>
                          <input
                            type="text"
                            value={editedData.description || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-right font-semibold focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Common fields - faqat oil, tire, service uchun */}
                  {context !== 'income' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Narxi:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editedData.cost ? formatMoney(editedData.cost) : ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, cost: e.target.value.replace(/\D/g, '') }))}
                            className="w-32 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-400 text-right font-bold focus:outline-none"
                            placeholder="0"
                          />
                          <span className="text-slate-400 text-sm">so'm</span>
                        </div>
                      </div>

                      {(editedData.odometer || context !== 'tire') && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Spidometr:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editedData.odometer || editedData.installOdometer || ''}
                              onChange={(e) => setEditedData(prev => ({ 
                                ...prev, 
                                odometer: e.target.value,
                                installOdometer: context === 'tire' ? e.target.value : prev.installOdometer
                              }))}
                              className="w-28 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-blue-400 text-right font-semibold focus:outline-none"
                              placeholder="0"
                            />
                            <span className="text-slate-400 text-sm">km</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {result?.data?.confidence && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-slate-500 text-xs">Aniqlik:</span>
                      <span className={`text-xs font-semibold ${result.data.confidence >= 0.9 ? 'text-emerald-400' : result.data.confidence >= 0.7 ? 'text-amber-400' : 'text-red-400'}`}>
                        {Math.round(result.data.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={() => { setResult(null); setError(null); setEditedData({}) }} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Mic size={18} />
                  Qayta yozish
                </button>
                <button
                  onClick={confirmResult}
                  disabled={context === 'income' ? !editedData.amount : !editedData.cost}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  <Check size={18} />
                  Tasdiqlash
                </button>
              </div>
            </div>
          )}

          {/* Tips */}
          {!isRecording && !isProcessing && !result && !error && (
            <div className="bg-white/5 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-semibold mb-3">NAMUNA GAPLAR:</p>
              <ul className="space-y-2 text-slate-300 text-sm">
                {config.examples.map((ex, i) => (
                  <li key={i}>• {ex}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
