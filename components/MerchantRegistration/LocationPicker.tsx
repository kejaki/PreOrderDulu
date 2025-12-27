'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import { getCurrentLocation } from '@/lib/geolocation';

// Fix Leaflet icon issue in Next.js
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    initialLocation?: { lat: number; lng: number };
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const [position, setPosition] = useState<LatLng | null>(
        initialLocation ? new LatLng(initialLocation.lat, initialLocation.lng) : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component only renders on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleUseCurrentLocation = async () => {
        setIsLoading(true);
        const location = await getCurrentLocation();
        if (location) {
            const newPosition = new LatLng(location.latitude, location.longitude);
            setPosition(newPosition);
            fetchAddress(location.latitude, location.longitude);
        } else {
            alert('Unable to get your current location. Please enable location services.');
        }
        setIsLoading(false);
    };

    const fetchAddress = async (lat: number, lng: number) => {
        try {
            // Using Nominatim reverse geocoding (free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect(lat, lng, address);
        } catch (error) {
            console.error('Failed to fetch address:', error);
            onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    // Component to handle map clicks
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                fetchAddress(e.latlng.lat, e.latlng.lng);
            },
        });

        return position === null ? null : <Marker position={position} />;
    }

    if (!isMounted) {
        return (
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-2">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Detecting...
                        </>
                    ) : (
                        <>
                            <MapPin size={16} />
                            Use Current Location
                        </>
                    )}
                </button>
            </div>

            <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                <MapContainer
                    center={position || new LatLng(-6.2088, 106.8456)} // Default to Jakarta
                    zoom={position ? 15 : 12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker />
                </MapContainer>
            </div>

            <p className="mt-2 text-xs text-gray-500">
                Click on the map to set your location, or use the button above to detect automatically
            </p>
        </div>
    );
}
