import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    isLoading: boolean;
    error: string | null;
    setLocation: (lat: number, lng: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            latitude: null,
            longitude: null,
            isLoading: false,
            error: null,
            setLocation: (lat, lng) => set({ latitude: lat, longitude: lng, error: null }),
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error, isLoading: false }),
            clearLocation: () => set({ latitude: null, longitude: null, error: null }),
        }),
        {
            name: 'location-storage',
        }
    )
);
