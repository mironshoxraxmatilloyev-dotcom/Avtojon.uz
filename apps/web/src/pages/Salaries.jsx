import { useEffect, useState } from 'react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { SalariesSkeleton, NetworkError, ServerError } from '../components/ui'
import {
  SalaryHeader,
  SalaryStats,
  SalaryFilters,
  SalaryCard,
  EmptySalaries,
  CalculateModal,
  SalaryDetailModal
} from '../components/salaries'

export default function Salaries() {
  const [salaries, setSalaries] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedSalary, setSelectedSalary] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({
    driverId: '',
    periodStart: new Date().toISOString().slice(0, 8) + '01',
    periodEnd: new Date().toISOString().slice(0, 10)
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [salRes, drvRes] = await Promise.all([
        api.get('/salaries'),
        api.get('/drivers')
      ])
      setSalaries(salRes.data.data || [])
      setDrivers(drvRes.data.data || [])
    } catch (err) {
      setError({
        type: err.isNetworkError ? 'network' : err.isServerError ? 'server' : 'generic',
        message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCalculate = async (e) => {
    e.preventDefault()
    setShowModal(false)
    showToast.success('Maosh hisoblanmoqda...')
    
    try {
      const res = await api.post('/salaries/calculate', form)
      if (res.data?.data) {
        setSalaries(prev => {
          const exists = prev.find(s => s._id === res.data.data._id)
          if (exists) {
            return prev.map(s => s._id === res.data.data._id ? res.data.data : s)
          }
          return [res.data.data, ...prev]
        })
      }
      showToast.success('Maosh hisoblandi!')
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
      fetchData()
    }
  }

  const handleApprove = async (id) => {
    setSalaries(prev => prev.map(s => 
      s._id === id ? { ...s, status: 'approved', approvedAt: new Date() } : s
    ))
    showToast.success('Tasdiqlandi!')
    
    try {
      const res = await api.put(`/salaries/${id}/approve`)
      if (res.data?.data) {
        setSalaries(prev => prev.map(s => s._id === id ? res.data.data : s))
      }
    } catch (error) {
      showToast.error('Xatolik')
      fetchData()
    }
  }

  const handlePay = async (id) => {
    setSalaries(prev => prev.map(s => 
      s._id === id ? { ...s, status: 'paid', paidAt: new Date() } : s
    ))
    showToast.success('To\'langan deb belgilandi!')
    
    try {
      const res = await api.put(`/salaries/${id}/pay`)
      if (res.data?.data) {
        setSalaries(prev => prev.map(s => s._id === id ? res.data.data : s))
      }
    } catch (error) {
      showToast.error('Xatolik')
      fetchData()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Maoshni bekor qilishni xohlaysizmi?')) return
    
    setSalaries(prev => prev.filter(s => s._id !== id))
    showToast.success('Maosh bekor qilindi!')
    
    try {
      await api.delete(`/salaries/${id}`)
    } catch (error) {
      showToast.error('Xatolik')
      fetchData()
    }
  }

  const filteredSalaries = salaries.filter(sal => {
    const matchesSearch = sal.driver?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) return <SalariesSkeleton />

  if (error) {
    if (error.type === 'network') return <NetworkError onRetry={fetchData} message={error.message} />
    if (error.type === 'server') return <ServerError onRetry={fetchData} message={error.message} />
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Qayta urinish</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SalaryHeader onOpenModal={() => setShowModal(true)} />
      <SalaryStats salaries={salaries} />
      <SalaryFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
        salaries={salaries} 
      />

      {filteredSalaries.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {filteredSalaries.map((sal) => (
            <SalaryCard
              key={sal._id}
              salary={sal}
              onApprove={handleApprove}
              onPay={handlePay}
              onDelete={handleDelete}
              onView={setSelectedSalary}
            />
          ))}
        </div>
      ) : (
        <EmptySalaries 
          onOpenModal={() => setShowModal(true)} 
          hasFilters={!!searchTerm || statusFilter !== 'all'} 
        />
      )}

      <CalculateModal
        show={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        setForm={setForm}
        drivers={drivers}
        onSubmit={handleCalculate}
      />

      <SalaryDetailModal
        salary={selectedSalary}
        onClose={() => setSelectedSalary(null)}
      />
    </div>
  )
}
