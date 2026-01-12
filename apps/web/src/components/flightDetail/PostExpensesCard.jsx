import { AlertCircle, Pencil, Trash2, Clock, Fuel, Utensils, Wrench, Car, Navigation, FileText, Package, Building2, Truck, Shield, CircleDot, Circle, Droplet, Filter, MapPin } from 'lucide-react'
import { EXPENSE_CATEGORIES, formatMoney, formatDateTime } from './constants'

export default function PostExpensesCard({ expenses, onEdit, onDelete, onAdd }) {
    // Agar xarajatlar bo'lmasa ham, onAdd bor bo'lsa ko'rsatamiz (bo'sh holatda)
    // Lekin dizayn bo'yicha agar xarajat bo'lmasa va onAdd bo'lmasa null qaytarish kerak
    // Biz bu komponentni faqat xarajatlar ro'yxati uchun ishlatamiz, qo'shish tugmasi tashqarida bo'ladi
    if (!expenses || expenses.length === 0) return null

    const total = expenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

    // Icon mapping helper
    const getExpenseIcon = (type) => {
        const icons = {
            'fuel': { icon: Fuel, color: '#3b82f6' },
            'fuel_metan': { icon: CircleDot, color: '#3b82f6' },
            'fuel_propan': { icon: Circle, color: '#eab308' },
            'fuel_benzin': { icon: Droplet, color: '#ef4444' },
            'fuel_diesel': { icon: Droplet, color: '#3b82f6' },
            'food': { icon: Utensils, color: '#f97316' },
            'toll': { icon: Car, color: '#6366f1' },
            'wash': { icon: Droplet, color: '#06b6d4' },
            'fine': { icon: FileText, color: '#ef4444' },
            'repair_small': { icon: Wrench, color: '#f59e0b' },
            'repair_major': { icon: Wrench, color: '#dc2626' },
            'oil': { icon: Droplet, color: '#8b5cf6' },
            'filter': { icon: Filter, color: '#10b981' },
            'filter_air': { icon: Filter, color: '#10b981' },
            'filter_oil': { icon: Droplet, color: '#8b5cf6' },
            'filter_cabin': { icon: Filter, color: '#14b8a6' },
            'filter_gas': { icon: CircleDot, color: '#f59e0b' },
            'tire': { icon: Circle, color: '#1f2937' },
            'accident': { icon: AlertCircle, color: '#ef4444' },
            'insurance': { icon: Shield, color: '#10b981' },
            'border': { icon: Navigation, color: '#8b5cf6' },
            'border_customs': { icon: Building2, color: '#6366f1' },
            'border_transit': { icon: Truck, color: '#f59e0b' },
            'border_insurance': { icon: Shield, color: '#10b981' },
            'border_other': { icon: MapPin, color: '#64748b' },
            'other': { icon: Package, color: '#64748b' }
        }
        return icons[type] || { icon: Package, color: '#64748b' }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Clock size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">📍 Reysdan keyingi xarajatlar</h3>
                        <p className="text-sm text-gray-500">Reys yopilgandan keyin qo'shilgan</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-purple-600">-{formatMoney(total)}</p>
                    <p className="text-sm text-gray-500">so'm</p>
                </div>
            </div>

            {/* Expenses List - Zamonaviy Grid */}
            <div className="grid gap-4">
                {expenses.map((exp, idx) => {
                    const category = EXPENSE_CATEGORIES.find(c =>
                        c.value === exp.type ||
                        exp.type?.startsWith(c.value + '_')
                    ) || EXPENSE_CATEGORIES.find(c => c.value === 'other')

                    const amount = exp.amountInUZS || exp.amount || 0
                    const { icon: Icon, color } = getExpenseIcon(exp.type)

                    return (
                        <div
                            key={exp._id || idx}
                            className="relative p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon - Kattaroq */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                                    style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
                                >
                                    <Icon size={32} style={{ color: color }} />
                                </div>

                                {/* Info - Kengroq */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-900 mb-1">{category?.label || 'Boshqa'}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <span>📅</span>
                                                {formatDateTime(exp.date)}
                                            </p>
                                            {/* Kim qo'shgani ma'lumoti */}
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <span>👤</span>
                                                {
                                                  exp.addedBy === 'voice' ? 'Ovoz orqali' : 
                                                  exp.addedBy === 'driver' ? 'Haydovchi tomonidan' : 
                                                  exp.addedBy === 'system' ? 'Tizim tomonidan' :
                                                  'Biznesmen tomonidan'
                                                } qo'shilgan
                                                {exp.confirmedByDriver && (
                                                  <span className="text-emerald-600 ml-2">✅ Tasdiqlangan</span>
                                                )}
                                                {!exp.confirmedByDriver && (
                                                  <span className="text-amber-600 ml-2">⏳ Kutilmoqda</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Amount - O'ng tomonda */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-2xl font-bold text-purple-600">-{formatMoney(amount)}</p>
                                            <p className="text-sm text-gray-500">so'm</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {exp.description && (
                                        <div className="mt-2 p-2 bg-white/60 rounded-lg">
                                            <p className="text-sm text-gray-700">💬 {exp.description}</p>
                                        </div>
                                    )}

                                    {/* Actions - Pastda, doimo ko'rinadi */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={() => onEdit && onEdit(exp)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                        >
                                            <Pencil size={16} />
                                            <span className="text-sm font-medium">Tahrirlash</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete && onDelete(exp._id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                            <span className="text-sm font-medium">O'chirish</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Alert - Yanada ko'rinadigan */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <p className="font-semibold text-purple-900 mb-1">Ma'lumot</p>
                        <p className="text-sm text-purple-800">
                            Bu xarajatlar reys yopilgandan keyin qo'shilgan va sof foydadan ayiriladi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
