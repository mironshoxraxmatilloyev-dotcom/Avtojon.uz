/**
 * SMS Panel - SuperAdmin uchun SMS yuborish va monitoring
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { 
  MessageSquare, Send, Users, Clock, CheckCircle, XCircle, 
  RefreshCw, Smartphone, Wifi, WifiOff, Search, UserCheck, Building2
} from 'lucide-react'

export default function SmsPanel() {
  const [activeTab, setActiveTab] = useState('send')
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Userlar
  const [businessmen, setBusinessmen] = useState([])
  const [individuals, setIndividuals] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showUserSelector, setShowUserSelector] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  
  // SMS yuborish form
  const [smsForm, setSmsForm] = useState({
    phone: '',
    message: '',
    isBulk: false
  })
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    phone: '',
    page: 1
  })

  // Ma'lumotlarni yuklash
  const loadData = useCallback(async () => {
    try {
      const [statsRes, logsRes, gatewaysRes] = await Promise.all([
        api.get('/sms/stats'),
        api.get('/sms/logs', { params: filters }),
        api.get('/sms/gateways')
      ])
      
      setStats(statsRes.data.data)
      setLogs(logsRes.data.data.messages || [])
      setGateways(gatewaysRes.data.data || [])
    } catch (err) {
      console.error('SMS data load error:', err)
    }
  }, [filters])

  // Userlarni yuklash
  const loadUsers = useCallback(async () => {
    try {
      const [bizRes, indRes] = await Promise.all([
        api.get('/super-admin/businessmen'),
        api.get('/super-admin/users')
      ])
      setBusinessmen(bizRes.data.data || [])
      setIndividuals(indRes.data.data || [])
    } catch (err) {
      console.error('Users load error:', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadUsers()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData, loadUsers])

  // SMS yuborish
  const handleSendSms = async (e) => {
    e.preventDefault()
    if (!smsForm.message) {
      alert('SMS matnini kiriting')
      return
    }
    
    setLoading(true)
    
    try {
      let phones = []
      
      if (selectedUsers.length > 0) {
        // Tanlangan userlarning telefon raqamlari
        phones = selectedUsers.map(u => u.phone).filter(p => p)
      } else if (smsForm.phone) {
        phones = [smsForm.phone]
      }
      
      if (phones.length === 0) {
        alert('Telefon raqam kiriting yoki userlarni tanlang')
        setLoading(false)
        return
      }
      
      await api.post('/sms/send', {
        phones,
        message: smsForm.message
      })
      
      setSmsForm({ phone: '', message: '', isBulk: false })
      setSelectedUsers([])
      loadData()
      alert(`${phones.length} ta SMS navbatga qo'shildi!`)
    } catch (err) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  // Barcha userlarga yuborish
  const handleSendToAll = async () => {
    if (!smsForm.message) {
      alert('SMS matnini kiriting')
      return
    }
    
    const allUsers = [...businessmen, ...individuals].filter(u => u.phone)
    if (allUsers.length === 0) {
      alert('Telefon raqamli userlar topilmadi')
      return
    }
    
    if (!confirm(`${allUsers.length} ta userga SMS yuborilsinmi?`)) return
    
    setLoading(true)
    try {
      await api.post('/sms/send', {
        phones: allUsers.map(u => u.phone),
        message: smsForm.message
      })
      alert(`${allUsers.length} ta SMS navbatga qo'shildi!`)
      setSmsForm({ ...smsForm, message: '' })
      loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  // User tanlash
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u._id === user._id)
      if (exists) {
        return prev.filter(u => u._id !== user._id)
      }
      return [...prev, user]
    })
  }

  // Hammasini tanlash
  const selectAll = (type) => {
    const users = type === 'businessmen' ? businessmen : individuals
    const usersWithPhone = users.filter(u => u.phone)
    setSelectedUsers(prev => {
      const newSelected = [...prev]
      usersWithPhone.forEach(u => {
        if (!newSelected.find(s => s._id === u._id)) {
          newSelected.push(u)
        }
      })
      return newSelected
    })
  }

  // Gateway qo'shish
  const handleAddGateway = async () => {
    const name = prompt('Gateway nomi:')
    if (!name) return
    
    const simNumber = prompt('SIM raqami (ixtiyoriy):')
    
    try {
      const res = await api.post('/sms/gateways', { name, simNumber })
      alert(`Gateway yaratildi!\n\nToken: ${res.data.data.token}\n\nBu tokenni Android app'ga kiriting.`)
      loadData()
    } catch (err) {
      alert('Xatolik: ' + err.message)
    }
  }

  // Filtrlangan userlar
  const filteredBusinessmen = businessmen.filter(u => 
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  )
  const filteredIndividuals = individuals.filter(u => 
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  )

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    queued: 'bg-blue-500/20 text-blue-400',
    sent: 'bg-green-500/20 text-green-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400'
  }

  const statusLabels = {
    pending: 'Kutilmoqda',
    queued: 'Navbatda',
    sent: 'Yuborildi',
    delivered: 'Yetkazildi',
    failed: 'Xato'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SMS Gateway</h2>
            <p className="text-slate-400 text-sm">Android orqali SMS yuborish</p>
          </div>
        </div>
        
        <button
          onClick={loadData}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Clock} label="Kutilmoqda" value={stats.pending} color="yellow" />
          <StatCard icon={CheckCircle} label="Yuborildi" value={stats.sent} color="green" />
          <StatCard icon={XCircle} label="Xato" value={stats.failed} color="red" />
          <StatCard icon={MessageSquare} label="Bugun" value={stats.todayCount} color="blue" />
          <StatCard icon={Smartphone} label="Gateway" value={gateways?.length || 0} color="purple" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'send', label: 'SMS Yuborish', icon: Send },
          { id: 'logs', label: 'Log', icon: Clock },
          { id: 'gateways', label: 'Gateway\'lar', icon: Smartphone }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-violet-500/20 text-violet-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
        {activeTab === 'send' && (
          <div className="space-y-4">
            {/* Tanlangan userlar */}
            {selectedUsers.length > 0 && (
              <div className="bg-violet-500/10 rounded-xl p-4 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-violet-400 font-medium">
                    {selectedUsers.length} ta user tanlandi
                  </span>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Tozalash
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.slice(0, 5).map(u => (
                    <span key={u._id} className="px-2 py-1 bg-slate-700 rounded text-xs text-white">
                      {u.fullName}
                    </span>
                  ))}
                  {selectedUsers.length > 5 && (
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-400">
                      +{selectedUsers.length - 5} ta
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* User tanlash tugmasi */}
            <button
              onClick={() => setShowUserSelector(!showUserSelector)}
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300"
            >
              <Users className="w-4 h-4" />
              {showUserSelector ? 'Yopish' : 'Userlardan tanlash'}
            </button>

            {/* User selector */}
            {showUserSelector && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 max-h-80 overflow-y-auto">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
                  />
                </div>

                {/* Biznesmenlar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Biznesmenlar ({filteredBusinessmen.length})
                    </span>
                    <button
                      onClick={() => selectAll('businessmen')}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Hammasini tanlash
                    </button>
                  </div>
                  <div className="space-y-1">
                    {filteredBusinessmen.map(user => (
                      <UserRow 
                        key={user._id} 
                        user={user} 
                        selected={selectedUsers.some(u => u._id === user._id)}
                        onToggle={() => toggleUserSelection(user)}
                      />
                    ))}
                  </div>
                </div>

                {/* Individuallar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /> Individual ({filteredIndividuals.length})
                    </span>
                    <button
                      onClick={() => selectAll('individuals')}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Hammasini tanlash
                    </button>
                  </div>
                  <div className="space-y-1">
                    {filteredIndividuals.map(user => (
                      <UserRow 
                        key={user._id} 
                        user={user} 
                        selected={selectedUsers.some(u => u._id === user._id)}
                        onToggle={() => toggleUserSelection(user)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Telefon raqam (agar user tanlanmagan bo'lsa) */}
            {selectedUsers.length === 0 && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Telefon raqam</label>
                <input
                  type="tel"
                  value={smsForm.phone}
                  onChange={e => setSmsForm({ ...smsForm, phone: e.target.value })}
                  placeholder="+998901234567"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                SMS matni ({smsForm.message.length} belgi)
              </label>
              <textarea
                value={smsForm.message}
                onChange={e => setSmsForm({ ...smsForm, message: e.target.value })}
                placeholder="SMS matnini kiriting..."
                rows={4}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              {smsForm.message.length > 160 && (
                <p className="text-xs text-amber-400 mt-1">
                  ⚠️ {Math.ceil(smsForm.message.length / 160)} ta SMS sifatida yuboriladi
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSendSms}
                disabled={loading || !smsForm.message}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Yuborilmoqda...' : `Yuborish ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}`}
              </button>
              
              <button
                type="button"
                onClick={handleSendToAll}
                disabled={loading || !smsForm.message}
                className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-6 py-3 rounded-xl font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                <Users className="w-5 h-5" />
                Barchaga
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Telefon raqam..."
                  value={filters.phone}
                  onChange={e => setFilters({ ...filters, phone: e.target.value, page: 1 })}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500"
                />
              </div>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white"
              >
                <option value="">Barcha status</option>
                <option value="pending">Kutilmoqda</option>
                <option value="sent">Yuborildi</option>
                <option value="failed">Xato</option>
              </select>
            </div>

            {/* Logs table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                    <th className="pb-3 font-medium">Telefon</th>
                    <th className="pb-3 font-medium">Matn</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => (
                    <tr key={log._id} className="text-sm">
                      <td className="py-3 text-white font-mono">{log.phone}</td>
                      <td className="py-3 text-slate-300 max-w-xs truncate">{log.message}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[log.status]}`}>
                          {statusLabels[log.status]}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(log.createdAt).toLocaleString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  SMS topilmadi
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gateways' && (
          <div className="space-y-4">
            <button
              onClick={handleAddGateway}
              className="flex items-center gap-2 bg-violet-500/20 text-violet-400 px-4 py-2 rounded-xl hover:bg-violet-500/30 transition-colors"
            >
              <Smartphone className="w-5 h-5" />
              Yangi Gateway qo'shish
            </button>

            <div className="grid gap-4">
              {gateways.map(gw => (
                <div
                  key={gw._id}
                  className="bg-slate-900/50 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        gw.isOnline ? 'bg-green-500/20' : 'bg-slate-700'
                      }`}>
                        {gw.isOnline ? (
                          <Wifi className="w-5 h-5 text-green-400" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{gw.name}</h4>
                        <p className="text-slate-400 text-sm">
                          {gw.simNumber || 'SIM raqam kiritilmagan'} • {gw.operator}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white font-medium">{gw.stats?.totalSent || 0} SMS</p>
                      <p className="text-slate-400 text-sm">
                        Bugun: {gw.stats?.todaySent || 0}
                      </p>
                    </div>
                  </div>
                  
                  {gw.lastSeen && (
                    <p className="text-slate-500 text-xs mt-2">
                      Oxirgi faollik: {new Date(gw.lastSeen).toLocaleString('uz-UZ')}
                    </p>
                  )}
                </div>
              ))}
              
              {gateways.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Gateway'lar yo'q. Yangi qo'shing.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    yellow: 'from-yellow-500/20 to-orange-500/20 text-yellow-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    red: 'from-red-500/20 to-pink-500/20 text-red-400',
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
    purple: 'from-violet-500/20 to-purple-500/20 text-violet-400'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border border-white/10`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function UserRow({ user, selected, onToggle }) {
  if (!user.phone) return null
  
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-violet-500/20' : 'hover:bg-white/5'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
        selected ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
      }`}>
        {selected && <CheckCircle className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{user.fullName}</p>
        <p className="text-slate-500 text-xs">{user.phone}</p>
      </div>
    </div>
  )
}
