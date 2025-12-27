import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Merchant {
    id: string;
    created_at: string;
    updated_at: string;
    merchant_name: string;
    merchant_type: 'student' | 'general';
    email: string;
    phone: string;
    latitude: number;
    longitude: number;
    address_text: string;
    is_open: boolean;
    is_verified: boolean;
    verification_status: 'pending' | 'approved' | 'rejected';
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    profile_photo_url?: string;
    business_description?: string;
    distance_meters?: number; // Added by RPC function
}

export interface MenuItem {
    id: string;
    merchant_id: string;
    created_at: string;
    updated_at: string;
    item_name: string;
    description?: string;
    price: number;
    stock: number;
    is_available: boolean;
    photo_url?: string;
    category?: string;
}

export interface Order {
    id: string;
    merchant_id: string;
    created_at: string;
    updated_at: string;
    guest_name: string;
    guest_whatsapp: string;
    guest_address_text: string;
    guest_latitude?: number;
    guest_longitude?: number;
    guest_notes?: string;
    status: 'pending' | 'accepted' | 'cooking' | 'ready' | 'delivering' | 'completed' | 'rejected' | 'cancelled';
    payment_method: 'cod' | 'qris';
    payment_status: 'pending' | 'paid' | 'failed';
    subtotal: number;
    delivery_fee: number;
    total_amount: number;
    tracking_token: string;
    accepted_at?: string;
    completed_at?: string;
    rejected_at?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id?: string;
    item_name: string;
    item_price: number;
    quantity: number;
    subtotal: number;
    item_notes?: string;
}

// Helper functions
export async function getNearbyMerchants(lat: number, lng: number, maxDistanceMeters: number = 5000) {
    const { data, error } = await supabase.rpc('get_nearby_merchants', {
        user_lat: lat,
        user_lng: lng,
        max_distance: maxDistanceMeters
    });

    if (error) {
        console.error('Error fetching nearby merchants:', error);
        return [];
    }

    return data as Merchant[];
}

export async function getMerchantsBySearch(query: string, userLat: number, userLng: number) {
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('is_open', true)
        .eq('is_verified', true)
        .or(`merchant_name.ilike.%${query}%,business_description.ilike.%${query}%,address_text.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching merchants:', error);
        return [];
    }

    // Since we aren't using the RPC, we don't get 'distance_meters' from DB.
    // We can rely on the client calculating it, or return it here if we want to sort.
    // The Home component handles mapping, but let's check if it needs 'distance_meters'.
    // The Merchant interface has optional distance_meters.

    return data as Merchant[];
}

export async function getMerchantById(id: string) {
    const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching merchant:', error);
        return null;
    }

    return data as Merchant;
}

export async function getMenuItems(merchantId: string) {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_available', true)
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }

    return data as MenuItem[];
}

export async function uploadKYCDocument(
    merchantId: string,
    documentType: string,
    file: File
): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${merchantId}/${documentType}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

    return data.publicUrl;
}
