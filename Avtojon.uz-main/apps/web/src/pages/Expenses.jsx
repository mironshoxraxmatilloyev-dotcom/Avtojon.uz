import { useEffect, useState } from 'react'
import { Check, Trash2, Fuel, Wrench, Car } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = async () => {
    try {
      const expRes = await api.get('/expenses')
      setExpenses(expRes.data.data || [])
    } catch (error) {
      showToast.error('Xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleVerify = async (id) => {
    try {
      await api.put(`/expenses/${id}/verify`)
      showToast.success('Tasdiqlandi')
      fetchData()
    } catch (error) {
      showToast.error('Xatolik')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('O\'chirishni xohlaysizmi?')) return
    try {
      await api.delete(`/expenses/${id}`)
      showToast.success('O\'chirildi')
      fetchData()
    } catch (error) {
      showToast.error('Xatolik')
    }
  }

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m' : '-'

  const typeConfig = {
    fuel: { label: 'Yoqilg\'i', icon: Fuel, color: 'text-orange-600' },
    toll: { label: 'Yo\'l to\'lovi', icon: Car, color: 'text-blue-600' },
    repair: { label: 'Ta\'mirlash', icon: Wrench, color: 'text-red-600' },
    parking: { label: 'Parking', icon: Car, color: 'text-purple-600' },
    food: { label: 'Ovqat', icon: Car, color: 'text-green-600' },
    other: { label: 'Boshqa', icon: Car, color: 'text-gray-600' }
  }

  const filtered = filter === 'all' ? expenses : 
    filter === 'verified' ? expenses.filter(e => e.isVerified) :
    filter === 'pending' ? expenses.filter(e => !e.isVerified) :
    expenses.filter(e => e.expenseType === filter)

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) return <div className="flex items-center justify-center h-64">Yuklanmoqda...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Xarajatlar</h1>
          <p className="text-gray-500">Jami: {formatMoney(grandTotal)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'verified', 'fuel', 'toll', 'repair', 'parking', 'food', 'other'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Barchasi' : f === 'pending' ? 'Tasdiqlanmagan' : f === 'verified' ? 'Tasdiqlangan' : typeConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Turi</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Shofyor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Reys</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Summa</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Chek</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((exp) => {
              const TypeIcon = typeConfig[exp.expenseType]?.icon || Car
              return (
                <tr key={exp._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={18} className={typeConfig[exp.expenseType]?.color} />
                      <span>{typeConfig[exp.expenseType]?.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{exp.driver?.fullName || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {exp.trip ? `${exp.trip.startAddress} → ${exp.trip.endAddress}` : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatMoney(exp.amount)}</td>
                  <td className="px-4 py-3">
                    {exp.receiptImage ? (
                      <img src={exp.receiptImage} alt="Chek" className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80" onClick={() => window.open(exp.receiptImage, '_blank')} />
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${exp.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {exp.isVerified ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!exp.isVerified && (
                      <button onClick={() => handleVerify(exp._id)} className="text-green-600 hover:text-green-800"><Check size={18} /></button>
                    )}
                    <button onClick={() => handleDelete(exp._id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Xarajatlar yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
