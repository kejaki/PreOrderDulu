# PreOrderDulu - Hyper-Local Food Delivery App

A modern, fast food delivery platform focused on **speed for buyers** and **security for sellers**.

## 🚀 Unique Features

### Buyer Side (Guest Checkout)
- ✅ **NO LOGIN REQUIRED** - Start ordering in seconds
- ✅ **Geolocation-based** - Auto-detect location and show nearest merchants
- ✅ **Real-time tracking** - Track your order status via unique link
- ✅ **Simple checkout** - Just name, WhatsApp, and delivery address

### Seller Side (Strict KYC)
- ✅ **Two merchant types:**
  - **Student (Pelajar):** KTM + Class Schedule + Emergency Contact
  - **General (Umum):** KTP + Selfie with KTP + Business Photo
- ✅ **Verification process** - All merchants are verified before going live
- ✅ **Dashboard** - Manage menu, orders, and store status (Open/Close)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **State Management:** Zustand
- **Maps:** Leaflet + OpenStreetMap
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up here](https://supabase.com))

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
cd /home/ahmad-zaki/Documents/web-masjaki/PreOrderDulu-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL:
   - Go to **SQL Editor** in Supabase dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run the query
3. Create storage bucket:
   - Go to **Storage**
   - Create a new bucket called `kyc-documents`
   - Make it **public**
4. Get your credentials:
   - Go to **Settings** → **API**
   - Copy `Project URL` and `anon public` key

### 3. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
app/
├─ page.tsx                          # Buyer landing page (geolocation sorting)
├─ merchant/
│  ├─ register/page.tsx              # Merchant registration (multi-step + KYC)
│  ├─ [id]/page.tsx                  # [TODO] Merchant detail + menu
│  └─ dashboard/page.tsx             # [TODO] Merchant dashboard
├─ checkout/page.tsx                 # [TODO] Guest checkout
└─ order/[token]/page.tsx            # [TODO] Order tracking

components/
├─ ui/                               # Reusable UI components
├─ MerchantCard.tsx                  # Merchant display card
├─ CartButton.tsx                    # Floating cart button
└─ MerchantRegistration/             # Registration flow components

lib/
├─ supabase.ts                       # Supabase client + helper functions
└─ geolocation.ts                    # Distance calculation utilities

store/
├─ useCartStore.ts                   # Shopping cart state
└─ useLocationStore.ts               # User location state

supabase/
└─ migrations/
   └─ 001_initial_schema.sql         # Complete database schema
```

## 🗄️ Database Schema

### Tables

1. **merchants** - Store information with geolocation (PostGIS)
2. **kyc_documents** - KYC verification files (Student vs General)
3. **menu_items** - Food items offered by merchants
4. **orders** - Guest orders with tracking token
5. **order_items** - Order line items

### Key Features

- **PostGIS** for efficient geolocation queries
- **RPC Function** `get_nearby_merchants(lat, lng, max_distance)`
- **Row-Level Security (RLS)** for data access control
- **Real-time subscriptions** for order updates

## 🧪 Testing the App

### Test Buyer Flow

1. Open landing page
2. Allow geolocation access
3. View merchants sorted by distance
4. Use search and distance filters

### Test Merchant Registration

1. Go to `/merchant/register`
2. **Step 1:** Enter basic info + select location on map
3. **Step 2:** Choose merchant type:
   - **Student** → KTM, Class Schedule, Emergency Contact
   - **General** → KTP, Selfie with KTP, Business Photo
4. **Step 3:** Upload documents and submit

## 📝 TODO List

### High Priority
- [ ] Merchant detail page (`/merchant/[id]`)
- [ ] Guest checkout flow (`/checkout`)
- [ ] Order tracking page (`/order/[token]`)
- [ ] Merchant dashboard (`/merchant/dashboard`)

### Medium Priority
- [ ] Real-time order notifications (Supabase subscriptions)
- [ ] WhatsApp integration for order confirmations
- [ ] Image optimization (merchant photos, menu items)
- [ ] OTP validation for guest checkout

### Low Priority
- [ ] Admin panel for KYC verification
- [ ] Merchant analytics dashboard
- [ ] Push notifications
- [ ] Multi-language support (EN/ID)

## 🐛 Known Issues

- **Leaflet SSR:** Map component uses `isMounted` check to prevent SSR issues
- **OTP:** Currently placeholder only - needs Twilio or WhatsApp Business API
- **Image Uploads:** Requires Supabase Storage bucket `kyc-documents` to be created

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [PostGIS Documentation](https://postgis.net/)

## 📄 License

This project is for educational purposes.

## 👨‍💻 Developer

Built as a demonstration of modern full-stack web development with Next.js 14 and Supabase.

---

**Need help?** Check the [walkthrough document](../brain/864ac72f-b154-42e5-b993-6dfecf9cb07d/walkthrough.md) for detailed architecture explanations.
