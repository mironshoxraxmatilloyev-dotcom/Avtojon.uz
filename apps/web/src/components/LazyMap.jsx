import { lazy, Suspense, memo } from 'react'
import { MapPin } from 'lucide-react'

// 🚀 Lazy load Leaflet - faqat kerak bo'lganda yuklanadi
const MapContainer = lazy(() => 
  import('react-leaflet').then(mod => ({ default: mod.MapContainer }))
)
const TileLayer = lazy(() => 
  import('react-leaflet').then(mod => ({ default: mod.TileLayer }))
)
const Marker = lazy(() => 
  import('react-leaflet').then(mod => ({ default: mod.Marker }))
)
const Popup = lazy(() => 
  import('react-leaflet').then(mod => ({ default: mod.Popup }))
)
const Polyline = lazy(() => 
  import('react-leaflet').then(mod => ({ default: mod.Polyline }))
)

// 🎯 Map Loading Placeholder
const MapPlaceholder = memo(() => (
  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <MapPin className="w-6 h-6 text-blue-500 animate-pulse" />
      </div>
      <p className="text-gray-500 text-sm">Xarita yuklanmoqda...</p>
    </div>
  </div>
))

// 🚀 Lazy Map Wrapper
export function LazyMapContainer({ children, ...props }) {
  return (
    <Suspense fallback={<MapPlaceholder />}>
      <MapContainer {...props}>
        {children}
      </MapContainer>
    </Suspense>
  )
}

export { TileLayer, Marker, Popup, Polyline, MapPlaceholder }
