import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, AlertTriangle, Flag, Map, Globe } from 'lucide-react'
import { searchUzbekistanCities } from '../data/uzbekistanCities'

// Nominatim API orqali manzil qidirish (xalqaro reyslar uchun)
async function searchAddress(query, countryCode = null) {
    if (!query || query.length < 2) return []
    try {
        const countryParam = countryCode ? `&countrycodes=${countryCode}` : ''
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}${countryParam}&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'uz,ru,en' } }
        )
        const data = await response.json()
        return data.map(item => ({
            name: item.display_name.split(',').slice(0, 2).join(', '),
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            country: item.address?.country || '',
            countryCode: (item.address?.country_code || '').toLowerCase(),
            isUzbekistan: (item.address?.country_code || '').toLowerCase() === 'uz',
            source: 'api'
        }))
    } catch {
        return []
    }
}

// Offline va API natijalarini birlashtirish (dublikatlarni olib tashlash)
function mergeResults(offlineResults, apiResults) {
    const seen = new Set()
    const merged = []
    
    // Avval offline natijalar (ular birinchi ko'rinadi)
    for (const item of offlineResults) {
        const key = item.name.toLowerCase()
        if (!seen.has(key)) {
            seen.add(key)
            merged.push({ ...item, source: 'offline' })
        }
    }
    
    // Keyin API natijalar (dublikatlar qo'shilmaydi)
    for (const item of apiResults) {
        const key = item.name.toLowerCase().split(',')[0].trim()
        if (!seen.has(key)) {
            seen.add(key)
            merged.push(item)
        }
    }
    
    return merged.slice(0, 10) // Maksimum 10 ta
}

export default function AddressAutocomplete({ 
    value, 
    onChange, 
    onSelect, 
    placeholder, 
    className,
    focusColor = 'blue',
    domesticOnly = false,
    onWarning // Ogohlantirish callback
}) {
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [focused, setFocused] = useState(false)
    const [warning, setWarning] = useState(null) // Ogohlantirish xabari
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)
    const debounceRef = useRef(null)

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        
        if (value && value.length >= 3 && focused) {
            if (domesticOnly) {
                // Mahalliy reyslar: Avval offline, keyin API
                const localResults = searchUzbekistanCities(value)
                setSuggestions(localResults)
                setShowSuggestions(localResults.length > 0)
                
                // API dan ham qidirish (fonda)
                setLoading(true)
                debounceRef.current = setTimeout(async () => {
                    const apiResults = await searchAddress(value, 'uz')
                    // Offline va API natijalarini birlashtirish
                    const combined = mergeResults(localResults, apiResults)
                    setSuggestions(combined)
                    setShowSuggestions(combined.length > 0)
                    setLoading(false)
                }, 300)
            } else {
                // Xalqaro reyslar: faqat API
                setLoading(true)
                debounceRef.current = setTimeout(async () => {
                    const results = await searchAddress(value, null)
                    setSuggestions(results)
                    setShowSuggestions(results.length > 0)
                    setLoading(false)
                }, 300)
            }
        } else {
            setSuggestions([])
            setShowSuggestions(false)
            setLoading(false)
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [value, focused, domesticOnly])

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false)
                setFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (suggestion) => {
        onChange(suggestion.name)
        setWarning(null)
        onSelect?.(suggestion)
        setShowSuggestions(false)
        setFocused(false)
    }

    // Inputdan chiqqanda - agar taklif tanlanmagan bo'lsa, birinchi natijani avtomatik tanlash
    const handleBlur = async () => {
        // Biroz kutish - click event uchun
        setTimeout(async () => {
            if (value && value.length >= 3 && suggestions.length > 0) {
                // Birinchi taklifni avtomatik tanlash
                handleSelect(suggestions[0])
            } else if (value && value.length >= 3 && suggestions.length === 0) {
                if (domesticOnly) {
                    // Mahalliy rejimda - offline qidiruv
                    const localResults = searchUzbekistanCities(value)
                    if (localResults.length > 0) {
                        handleSelect(localResults[0])
                    }
                } else {
                    // Xalqaro rejimda - API qidiruv
                    const results = await searchAddress(value, null)
                    if (results.length > 0) {
                        handleSelect(results[0])
                    }
                }
            }
        }, 200)
    }

    const focusColors = {
        green: 'focus:border-green-500 focus:ring-green-500/20',
        red: 'focus:border-red-500 focus:ring-red-500/20',
        blue: 'focus:border-blue-500 focus:ring-blue-500/20'
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition text-sm ${focusColors[focusColor]} ${className}`}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="text-blue-400 animate-spin" />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(suggestion)}
                            className="w-full px-3 py-2.5 text-left hover:bg-white/10 transition flex items-start gap-2 border-b border-white/5 last:border-0"
                        >
                            <MapPin size={14} className={`mt-0.5 shrink-0 ${suggestion.source === 'offline' ? 'text-emerald-400' : 'text-blue-400'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-sm font-medium truncate">{suggestion.name}</p>
                                    {suggestion.source === 'offline' && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded shrink-0 flex items-center gap-1">
                                            <Flag size={10} /> Tezkor
                                        </span>
                                    )}
                                    {suggestion.source === 'api' && suggestion.isUzbekistan && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded shrink-0 flex items-center gap-1">
                                            <Map size={10} /> Xarita
                                        </span>
                                    )}
                                    {suggestion.source === 'api' && !suggestion.isUzbekistan && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded shrink-0 flex items-center gap-1">
                                            <Globe size={10} /> Xalqaro
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-xs truncate">{suggestion.fullName || suggestion.region}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Ogohlantirish xabari */}
            {warning && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-amber-300 text-xs">{warning}</p>
                </div>
            )}
        </div>
    )
}
