import { calculateDistance } from '@/lib/geolocation';

export function calculateDeliveryFee(
    userLat: number,
    userLng: number,
    merchantLat: number,
    merchantLng: number,
    orderType: 'delivery' | 'pickup'
): { fee: number; distanceMeters: number; isFreeZone: boolean } {
    // 1. Force 0 if pickup
    if (orderType === 'pickup') {
        return { fee: 0, distanceMeters: 0, isFreeZone: false };
    }

    // 2. Calculate distance
    const distanceMeters = calculateDistance(userLat, userLng, merchantLat, merchantLng);
    const distanceKm = distanceMeters / 1000;

    // 3. Free Zone Logic (< 2.0 KM)
    if (distanceKm <= 2.0) {
        return { fee: 0, distanceMeters, isFreeZone: true };
    }

    // 4. Far Zone Logic (> 2.0 KM)
    // Charge IDR 3,000 per excess KM (rounded up)
    const excessKm = Math.ceil(distanceKm - 2.0);
    const fee = excessKm * 3000;

    return { fee, distanceMeters, isFreeZone: false };
}
