/**
 * VoiceVehicleCreator - Ovoz bilan mashina qo'shish komponenti
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mic, MicOff, Loader2, X, Truck, Fuel, Gauge } from 'lucide-react'
import api from '../../services/api'

export default function VoiceVehicleCreator({ onResult, onClose }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const [form, setForm] = useState({
    plateNumber: '',
    brand: '',
    year: new Date().getFullYear(),
    fuelType: 'diesel',
    fuelTankCapacity: '',
    currentOdometer: ''
  })
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)

  // Result o'zgarganda form ni yangilash
  useEffect(() => {
    if (result?.data) {
      setForm(prev => ({
        ...prev,
        plateNumber: result.data.plateNumber || prev.plateNumber,
        brand: result.data.brand || prev.brand,
        year: result.data.year || prev.year,
        fuelType: result.data.fuelType || prev.fuelType,
        fuelTankCapacity: result.data.fuelTankCapacity || prev.fuelTankCapacity,
        currentOdometer: result.data.odometer || result.data.currentOdometer || prev.currentOdometer
      }))
    }
  }, [result])

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
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      })
      streamRef.current = stream
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType })
        await processAudio(audioBlob)
      }
      
      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
      monitorAudioLevel()
    } catch (err) {
      console.error('Mikrofon xatosi:', err)
      setError('Mikrofonga ruxsat berilmadi')
    }
  }, [monitorAudioLevel])

  // Yozishni to'xtatish
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  // Audio ni serverga yuborish
  const processAudio = async (audioBlob) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', 'uz')
      formData.append('context', 'vehicle')
      
      const response = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data?.success && response.data?.data) {
        setResult(response.data.data)
      } else {
        throw new Error('Javob noto\'g\'ri formatda')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ovozni qayta ishlashda xatolik')
    } finally {
      setIsProcessing(false)
    }
  }

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!form.plateNumber || !form.brand) {
      setError('Raqam va marka majburiy')
      return
    }
    
    onResult({
      plateNumber: form.plateNumber.toUpperCase(),
      brand: form.brand,
      year: parseInt(form.year) || new Date().getFullYear(),
      fuelType: form.fuelType,
      fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
      currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
      status: 'normal'
    })
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border-2 border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ovoz bilan mashina</h2>
              <p className="text-sm text-slate-500">Gapiring yoki qo'lda to'ldiring</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ovoz yozish bo'limi */}
          <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border border-violet-200">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-violet-500 to-purple-600'
              } shadow-lg`}
            >
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-400/30" style={{ transform: `scale(${1 + audioLevel * 0.3})` }} />
              )}
              {isProcessing ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-6 h-6 text-white relative z-10" />
              ) : (
                <Mic className="w-6 h-6 text-white relative z-10" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              {isProcessing ? (
                <p className="text-violet-600 font-medium">Tahlil qilinmoqda...</p>
              ) : isRecording ? (
                <>
                  <p className="text-red-500 font-bold text-lg">{formatTime(recordingTime)}</p>
                  <p className="text-slate-500 text-sm">To'xtatish uchun bosing</p>
                </>
              ) : result ? (
                <p className="text-violet-600 font-medium truncate">"{result.text}"</p>
              ) : (
                <>
                  <p className="text-slate-700 font-medium">Ovoz bilan aytib bering</p>
                  <p className="text-slate-400 text-sm">"MAN 2020 yil dizel 01A123BC"</p>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form fields */}
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">
              Davlat raqami <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.plateNumber}
              onChange={(e) => setForm(f => ({ ...f, plateNumber: e.target.value.toUpperCase() }))}
              placeholder="01A123BC"
              className="w-full px-4 py-3 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Marka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                placeholder="MAN"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">Yil</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                <Fuel size={14} className="inline mr-1" /> Yoqilg'i
              </label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm(f => ({ ...f, fuelType: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="diesel">Dizel</option>
                <option value="petrol">Benzin</option>
                <option value="gas">Gaz</option>
                <option value="metan">Metan</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Bak hajmi ({form.fuelType === 'metan' ? 'kub' : 'L'})
              </label>
              <input
                type="number"
                value={form.fuelTankCapacity}
                onChange={(e) => setForm(f => ({ ...f, fuelTankCapacity: e.target.value }))}
                placeholder="400"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">
              <Gauge size={14} className="inline mr-1" /> Spidometr (km)
            </label>
            <input
              type="number"
              value={form.currentOdometer}
              onChange={(e) => setForm(f => ({ ...f, currentOdometer: e.target.value }))}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={!form.plateNumber || !form.brand}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Truck size={20} />
            Mashina qo'shish
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
