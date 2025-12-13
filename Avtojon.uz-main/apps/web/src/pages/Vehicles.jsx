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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mashinalar</h1>
        <button
          onClick={() => { setEditingVehicle(null); resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Qo'shish
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{vehicle.plateNumber}</h3>
                <p className="text-gray-500">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                <button onClick={() => handleDelete(vehicle._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Yil: {vehicle.year || '-'}</p>
              <p>Yoqilg'i: {vehicle.fuelType}</p>
              <p>Yuk sig'imi: {vehicle.cargoCapacity ? `${vehicle.cargoCapacity} t` : '-'}</p>
            </div>

            {/* Driver assignment */}
            <div className="border-t pt-4">
              <label className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <User size={14} /> Shofyor
              </label>
              <select
                value={vehicle.currentDriver?._id || ''}
                onChange={(e) => handleAssign(vehicle._id, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
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
          <div className="col-span-full text-center py-12 text-gray-500">Mashinalar yo'q</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{editingVehicle ? 'Tahrirlash' : 'Yangi mashina'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input type="text" placeholder="Davlat raqami (01A123BC)" value={form.plateNumber} onChange={(e) => setForm({...form, plateNumber: e.target.value.toUpperCase()})} className="w-full px-4 py-2 border rounded-lg" required disabled={!!editingVehicle} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Marka" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" placeholder="Model" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Yil" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <select value={form.fuelType} onChange={(e) => setForm({...form, fuelType: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                  <option value="diesel">Dizel</option>
                  <option value="petrol">Benzin</option>
                  <option value="gas">Gaz</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Bak sig'imi (L)" value={form.fuelTankCapacity} onChange={(e) => setForm({...form, fuelTankCapacity: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                <input type="number" placeholder="Yuk sig'imi (t)" value={form.cargoCapacity} onChange={(e) => setForm({...form, cargoCapacity: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                {editingVehicle ? 'Saqlash' : 'Qo\'shish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
