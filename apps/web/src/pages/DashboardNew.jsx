import { memo } from 'react'
import { Truck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { PageWrapper } from '../components/ui'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  DemoBanner,
  DashboardHero,
  ActiveFlightsSection,
  ActiveTripsSection,
  MainStatsGrid,
  FinancialStats
} from '../components/dashboard'

// 🎯 Loading Component
const DashboardLoading = memo(() => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center animate-fadeIn">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <Truck className="absolute inset-0 m-auto text-blue-600" size={32} />
      </div>
      <p className="text-gray-500 font-medium">Yuklanmoqda...</p>
    </div>
  </div>
))

// 🚀 Dashboard Page - Modular Version
export default function Dashboard() {
  const { user } = useAuthStore()
  const {
    loading,
    stats,
    activeTrips,
    activeFlights,
    isDemoMode,
    refreshLocations
  } = useDashboardData()

  if (loading) return <DashboardLoading />

  return (
    <PageWrapper className="space-y-6 pb-8">
      {/* Demo Banner */}
      {isDemoMode && <DemoBanner />}

      {/* Hero Header with Quick Stats */}
      <DashboardHero user={user} stats={stats} />

      {/* Active Flights (yangi tizim) */}
      <ActiveFlightsSection 
        flights={activeFlights} 
        onRefresh={refreshLocations} 
      />

      {/* Active Trips (eski tizim) */}
      <ActiveTripsSection 
        trips={activeTrips} 
        onRefresh={refreshLocations} 
      />

      {/* Main Stats Grid */}
      <MainStatsGrid stats={stats} />

      {/* Financial Stats */}
      <FinancialStats stats={stats} />
    </PageWrapper>
  )
}
