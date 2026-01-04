import { create } from 'zustand';
import api from '../services/api';

// Mashinalar uchun global store - cache va offline support
export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  loading: false,
  lastFetch: null,

  // Mashinalarni yuklash
  fetchVehicles: async (force = false) => {
    const { lastFetch, vehicles } = get();
    // 5 daqiqa cache
    if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000 && vehicles.length > 0) {
      return vehicles;
    }

    set({ loading: true });
    try {
      const { data } = await api.get('/vehicles');
      set({ 
        vehicles: data.data || [], 
        loading: false,
        lastFetch: Date.now()
      });
      return data.data || [];
    } catch (e) {
      set({ loading: false });
      console.error('Mashinalar yuklashda xatolik:', e);
      return vehicles; // Eski datani qaytarish
    }
  },

  // Mashina qo'shish
  addVehicle: async (vehicleData) => {
    try {
      const { data } = await api.post('/vehicles', vehicleData);
      if (data.data) {
        set(state => ({ 
          vehicles: [data.data, ...state.vehicles] 
        }));
        return { success: true, vehicle: data.data };
      }
      return { success: false, message: 'Xatolik' };
    } catch (e) {
      return { 
        success: false, 
        message: e.response?.data?.message || 'Server xatosi' 
      };
    }
  },

  // Mashina o'chirish
  deleteVehicle: async (id) => {
    // Optimistic update
    const { vehicles } = get();
    set({ vehicles: vehicles.filter(v => v._id !== id) });
    
    try {
      await api.delete(`/vehicles/${id}`);
      return { success: true };
    } catch (e) {
      // Xatolik bo'lsa qaytarish
      set({ vehicles });
      return { success: false };
    }
  },

  // Mashina yangilash (local)
  updateVehicleLocal: (id, updates) => {
    set(state => ({
      vehicles: state.vehicles.map(v => 
        v._id === id ? { ...v, ...updates } : v
      )
    }));
  },

  // Cache tozalash
  clearCache: () => {
    set({ vehicles: [], lastFetch: null });
  },
}));

// Fleet analytics uchun store
export const useFleetStore = create((set, get) => ({
  analytics: null,
  subscription: null,
  loading: false,

  fetchAnalytics: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/maintenance/fleet/analytics');
      set({ analytics: data.data, loading: false });
      return data.data;
    } catch (e) {
      set({ loading: false });
      return null;
    }
  },

  fetchSubscription: async () => {
    try {
      const { data } = await api.get('/vehicles/subscription');
      set({ subscription: data.data });
      return data.data;
    } catch (e) {
      return null;
    }
  },
}));
