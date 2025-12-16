import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, User } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [form, setForm] = useState({
    plateNumber: '', brand: '', model: '', year: '', fuelType: 'diesel', fuelTankCapacity: '', cargoCapacity: ''
  })

  const fetchData = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ])
      setVehicles(vehiclesRes.data.data || [])
      setDrivers(driversRes.data.data || [])
    } catch (error) {
      showToast.error('Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, form)
        showToast.success('Mashina yangilandi')
      } else {
        await api.post('/vehicles', form)
        showToast.success('Mashina qo\'shildi')
      }
      setShowModal(false)
      setEditingVehicle(null)
      resetForm()
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const resetForm = () => {
    setForm({ plateNumber: '', brand: '', model: '', year: '', fuelType: 'diesel', fuelTankCapacity: '', cargoCapacity: '' })
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setForm({ ...vehicle })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Mashinani o\'chirishni xohlaysizmi?')) return
    try {
      await api.delete(`/vehicles/${id}`)
      showToast.success('Mashina o\'chirildi')
      fetchData()
    } catch (error) {
      showToast.error('O\'chirishda xatolik')
    }
  }

  const handleAssign = async (vehicleId, driverId) => {
    try {
      await api.put(`/vehicles/${vehicleId}/assign`, { driverId: driverId || null })
      showToast.success('Shofyor biriktirildi')
      fetchData()
    } catch (error) {
      showToast.error('Xatolik')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Yuklanmoqda...</div>

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mashinalar</h1>
          <p className="text-sm text-gray-500 mt-1">{vehicles.length} ta mashina</p>
        </div>
        <button
          onClick={() => { setEditingVehicle(null); resetForm(); setShowModal(true) }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl hover:bg-blue-700 transition text-sm sm:text-base font-medium"
        >
          <Plus size={18} /> <span>Qo'shish</span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{vehicle.plateNumber}</h3>
                <p className="text-sm text-gray-500 truncate">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div className="flex gap-1 sm:gap-2 ml-2">
                <button onClick={() => handleEdit(vehicle)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
                <button onClick={() => handleDelete(vehicle._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-[10px] sm:text-xs">Yil</p>
                <p className="font-medium">{vehicle.year || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-[10px] sm:text-xs">Yoqilg'i</p>
                <p className="font-medium capitalize">{vehicle.fuelType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-400 text-[10px] sm:text-xs">Yuk</p>
                <p className="font-medium">{vehicle.cargoCapacity ? `${vehicle.cargoCapacity}t` : '-'}</p>
              </div>
            </div>

            {/* Driver assignment */}
            <div className="border-t pt-3 sm:pt-4">
              <label className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mb-2">
                <User size={12} className="sm:w-[14px] sm:h-[14px]" /> Shofyor
              </label>
              <select
                value={vehicle.currentDriver?._id || ''}
                onChange={(e) => handleAssign(vehicle._id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Tanlanmagan</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>{d.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <p className="font-medium">Mashinalar yo'q</p>
            <p className="text-sm mt-1">Yangi mashina qo'shing</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 sm:p-5 border-b">
                <h2 className="text-base sm:text-lg font-semibold">{editingVehicle ? 'Tahrirlash' : 'Yangi mashina'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">Davlat raqami *</label>
                  <input type="text" placeholder="01A123BC" value={form.plateNumber} onChange={(e) => setForm({...form, plateNumber: e.target.value.toUpperCase()})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" required disabled={!!editingVehicle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Marka</label>
                    <input type="text" placeholder="MAN" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Model</label>
                    <input type="text" placeholder="TGX" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Yil</label>
                    <input type="number" placeholder="2020" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Yoqilg'i</label>
                    <select value={form.fuelType} onChange={(e) => setForm({...form, fuelType: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                      <option value="diesel">Dizel</option>
                      <option value="petrol">Benzin</option>
                      <option value="gas">Gaz</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Bak (L)</label>
                    <input type="number" placeholder="500" value={form.fuelTankCapacity} onChange={(e) => setForm({...form, fuelTankCapacity: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Yuk (t)</label>
                    <input type="number" placeholder="20" value={form.cargoCapacity} onChange={(e) => setForm({...form, cargoCapacity: e.target.value})} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium text-sm sm:text-base">
                  {editingVehicle ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
