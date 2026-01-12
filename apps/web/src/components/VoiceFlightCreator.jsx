/**
 * VoiceFlightCreator - Ovoz bilan reys ochish komponenti
 * FlightModal bilan bir xil maydonlar
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mic, MicOff, Loader2, X, Route, User, Truck, Gauge, Fuel, Flag, Globe, CircleDot, Circle, Droplet, Rocket } from 'lucide-react'
import api from '../services/api'
import AddressAutocomplete from './AddressAutocomplete'

const formatNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/\s/g, '')
  if (isNaN(num)) return value
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function VoiceFlightCreator({ onResult, onClose, drivers = [], vehicles = [] }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Form state - FlightModal bilan bir xil
  const [form, setForm] = useState({
    driverId: '',
    vehicleId: '',
    flightType: 'domestic',
    startOdometer: '',
    startFuel: '',
    fuelType: 'metan',
    fromCity: '',
    toCity: '',
    givenBudget: '',
    fromCoords: null,
    toCoords: null
  })
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const timerRef = useRef(null)

  // Bo'sh haydovchilar
  const freeDrivers = drivers.filter(d => d.status === 'free' || d.status !== 'busy')
  
  // Tanlangan haydovchi va mashina
  const selectedDriver = drivers.find(d => d._id === form.driverId)
  const selectedVehicle = vehicles.find(v => v._id === form.vehicleId)

  // Result o'zgarganda form ni yangilash
  useEffect(() => {
    if (result?.data) {
      let foundDriver = null
      if (result.data.driverName) {
        const driverName = result.data.driverName.toLowerCase()
        foundDriver = freeDrivers.find(d => 
          d.fullName?.toLowerCase().includes(driverName) ||
          driverName.includes(d.fullName?.toLowerCase()?.split(' ')[0])
        )
      }
      
      const driverVehicle = foundDriver ? vehicles.find(v => 
        v.currentDriver === foundDriver._id || v.currentDriver?._id === foundDriver._id
      ) : null
      
      setForm(prev => ({
        ...prev,
        driverId: foundDriver?._id || prev.driverId,
        vehicleId: driverVehicle?._id || prev.vehicleId,
        flightType: result.data.flightType || prev.flightType,
        fromCity: result.data.route?.fromCity || prev.fromCity,
        toCity: result.data.route?.toCity || prev.toCity,
        givenBudget: result.data.givenBudget || result.data.amount || prev.givenBudget,
        startOdometer: result.data.odometer || result.data.startOdometer || prev.startOdometer,
        startFuel: result.data.startFuel || prev.startFuel,
        fuelType: result.data.fuelType || prev.fuelType
      }))
    }
  }, [result, freeDrivers, vehicles])

  // Haydovchi o'zgarganda mashinani avtomatik tanlash
  useEffect(() => {
    if (form.driverId) {
      const driverVehicle = vehicles.find(v => 
        v.currentDriver === form.driverId || v.currentDriver?._id === form.driverId
      )
      if (driverVehicle) {
        setForm(prev => ({ ...prev, vehicleId: driverVehicle._id }))
      }
    }
  }, [form.driverId, vehicles])

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
      formData.append('context', 'flight')
      
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
    
    if (!form.driverId) {
      setError('Haydovchini tanlang')
      return
    }
    if (!form.fromCity || !form.toCity) {
      setError('Manzillarni kiriting')
      return
    }
    
    const flightData = {
      driverId: form.driverId,
      vehicleId: form.vehicleId,
      flightType: form.flightType,
      startOdometer: Number(form.startOdometer) || 0,
      startFuel: Number(form.startFuel) || 0,
      fuelType: form.fuelType,
      legs: [{
        fromCity: form.fromCity,
        toCity: form.toCity,
        fromCoords: form.fromCoords,
        toCoords: form.toCoords,
        givenBudget: Number(form.givenBudget) || 0
      }]
    }
    onResult(flightData)
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
  const isDomestic = form.flightType === 'domestic'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-2xl sm:rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-1" />
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm sm:rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Route className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Mic size={18} className="text-violet-400" />
                  Ovoz bilan reys
                </h2>
                <p className="text-green-300 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{selectedDriver?.fullName || 'Haydovchini tanlang'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-slate-400 hover:text-white">
              <X size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-6 sm:pb-4">
          {/* Ovoz yozish bo'limi */}
          <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-violet-500/10 rounded-lg sm:rounded-xl border border-violet-500/30">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-violet-500 to-purple-600'
              } shadow-lg active:scale-95`}
            >
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-400/30" style={{ transform: `scale(${1 + audioLevel * 0.3})` }} />
              )}
              {isProcessing ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              {isProcessing ? (
                <p className="text-violet-300 text-xs sm:text-sm">Tahlil qilinmoqda...</p>
              ) : isRecording ? (
                <>
                  <p className="text-red-400 font-bold text-sm sm:text-base">{formatTime(recordingTime)}</p>
                  <p className="text-slate-400 text-[10px] sm:text-xs">To'xtatish uchun bosing</p>
                </>
              ) : result ? (
                <p className="text-violet-300 text-xs sm:text-sm truncate">"{result.text}"</p>
              ) : (
                <>
                  <p className="text-white text-xs sm:text-sm font-medium">Ovoz bilan aytib bering</p>
                  <p className="text-slate-400 text-[10px] sm:text-xs">"Anvar Toshkentdan Buxoroga 500 ming"</p>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Haydovchi tanlash */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mb-2">
              <User size={14} /> Haydovchi *
            </label>
            <select
              value={form.driverId}
              onChange={(e) => setForm(prev => ({ ...prev, driverId: e.target.value, vehicleId: '' }))}
              className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
            >
              <option value="">Haydovchini tanlang</option>
              {freeDrivers.map(d => (
                <option key={d._id} value={d._id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Mashina */}
          {selectedVehicle && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Truck size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{selectedVehicle.plateNumber}</p>
                <p className="text-slate-400 text-xs">{selectedVehicle.brand}</p>
              </div>
            </div>
          )}

          {/* Mashrut turi */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Mashrut turi</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm(prev => ({ ...prev, flightType: 'domestic' }))}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                <Flag size={16} className="text-blue-400" /><span className="font-medium text-sm">Mahalliy</span>
              </button>
              <button type="button" onClick={() => setForm(prev => ({ ...prev, flightType: 'international' }))}
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${!isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                <Globe size={16} className="text-amber-400" /><span className="font-medium text-sm">Xalqaro</span>
              </button>
            </div>
          </div>

          {/* Spidometr va Yoqilg'i */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Gauge size={14} className="inline mr-1" />Spidometr
              </label>
              <input type="text" inputMode="numeric" value={formatNumber(form.startOdometer)}
                onChange={(e) => setForm(prev => ({ ...prev, startOdometer: e.target.value.replace(/\s/g, '') }))}
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                placeholder="123456" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Fuel size={14} className="inline mr-1" />Yoqilgi
              </label>
              <input type="number" value={form.startFuel}
                onChange={(e) => setForm(prev => ({ ...prev, startFuel: e.target.value }))}
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                placeholder="100" />
            </div>
          </div>

          {/* Yoqilg'i turi */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Yoqilgi turi</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'metan', label: 'Metan', Icon: CircleDot, iconColor: 'text-green-500', unit: 'kub' },
                { value: 'propan', label: 'Propan', Icon: Circle, iconColor: 'text-yellow-500', unit: 'kub' },
                { value: 'benzin', label: 'Benzin', Icon: Fuel, iconColor: 'text-red-500', unit: 'litr' },
                { value: 'diesel', label: 'Dizel', Icon: Droplet, iconColor: 'text-blue-500', unit: 'litr' }
              ].map(fuel => (
                <button key={fuel.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, fuelType: fuel.value }))}
                  className={`p-2 rounded-xl border text-center ${form.fuelType === fuel.value ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                  <fuel.Icon size={20} className={`mx-auto ${fuel.iconColor}`} />
                  <p className="text-[10px] mt-0.5">{fuel.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Birinchi buyurtma */}
          <div className="pt-3 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">Birinchi buyurtma</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Qayerdan *</label>
                <AddressAutocomplete 
                  value={form.fromCity} 
                  onChange={(val) => setForm(prev => ({ ...prev, fromCity: val }))}
                  onSelect={(s) => setForm(prev => ({ ...prev, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } }))}
                  placeholder="Toshkent" 
                  focusColor="green" 
                  domesticOnly={isDomestic} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Qayerga *</label>
                <AddressAutocomplete 
                  value={form.toCity} 
                  onChange={(val) => setForm(prev => ({ ...prev, toCity: val }))}
                  onSelect={(s) => setForm(prev => ({ ...prev, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } }))}
                  placeholder="Samarqand" 
                  focusColor="green" 
                  domesticOnly={isDomestic} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Berilgan pul (som)</label>
                <input type="text" inputMode="numeric" value={formatNumber(form.givenBudget)}
                  onChange={(e) => setForm(prev => ({ ...prev, givenBudget: e.target.value.replace(/\s/g, '') }))}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                  placeholder="200 000" />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            disabled={!form.driverId || !form.fromCity || !form.toCity}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Rocket size={18} />
            Mashrutni boshlash
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
