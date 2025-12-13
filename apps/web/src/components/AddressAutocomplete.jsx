import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

// Nominatim API orqali manzil qidirish
async function searchAddress(query) {
    if (!query || query.length < 2) return []
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=uz&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'uz,ru,en' } }
        )
        const data = await response.json()
        return data.map(item => ({
            name: item.display_name.split(',').slice(0, 2).join(', '),
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }))
    } catch {
        return []
    }
}

export default function AddressAutocomplete({ 
    value, 
    onChange, 
    onSelect, 
    placeholder, 
    className,
    focusColor = 'blue'
}) {
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [focused, setFocused] = useState(false)
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)
    const debounceRef = useRef(null)

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        
        if (value && value.length >= 2 && focused) {
            setLoading(true)
            debounceRef.current = setTimeout(async () => {
                const results = await searchAddress(value)
                setSuggestions(results)
                setShowSuggestions(results.length > 0)
                setLoading(false)
            }, 300)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
            setLoading(false)
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [value, focused])

    // Click outside to close
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
        onSelect?.(suggestion)
        setShowSuggestions(false)
        setFocused(false)
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
                    placeholder={placeholder}
                    className={`w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition text-sm ${focusColors[focusColor]} ${className}`}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="text-blue-400 animate-spin" />
                    </div>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(suggestion)}
                            className="w-full px-3 py-2.5 text-left hover:bg-white/10 transition flex items-start gap-2 border-b border-white/5 last:border-0"
                        >
                            <MapPin size={14} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-white text-sm font-medium">{suggestion.name}</p>
                                <p className="text-slate-400 text-xs truncate">{suggestion.fullName}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
