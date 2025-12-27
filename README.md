# PreOrderDulu - Hyper-Local Food Delivery App

A modern, fast food delivery platform focused on **speed for buyers** and **security for sellers**. Built with Next.js 14 and Supabase.

## 🚀 Key Features

### 🛒 Buyer Experience (Guest Checkout)
- **NO LOGIN REQUIRED:** Buyers can start ordering immediately.
- **Geolocation-based:** Automatically detects user location to show the nearest merchants first.
- **Smooth Checkout:** Only requires basic info (Name, WhatsApp, Address).
- **Real-time Tracking:** Track order progress via a unique tracking link (Realtime Supabase).

### 🏪 Merchant Dashboard
- **Fast Registration:** Multi-step form with map location picker.
- **Strict KYC Verification:**
  - **Student:** KTM + Class Schedule + Emergency Contact.
  - **General:** KTP + Selfie + Business Photo.
- **Menu Management:** Add/Edit/Delete menu items with image uploads.
- **Store Control:** Toggle store status (Open/Closed) in one click.
- **Real-time Orders:** Accept, reject, and update order status (Cooking -> Ready -> Deliver) with instant updates.

### 🛡️ Admin Panel (`/admin/verify`)
- **KYC Viewer:** Admins can review uploaded documents and merchant details.
- **Manual Verification:** Approve or reject new merchants to ensure platform security.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion.
- **Backend:** Supabase (Auth, Database, Storage, Realtime).
- **Maps:** Leaflet + OpenStreetMap (Dynamic client-side rendering).
- **State:** Zustand (Location & Cart management).

## 🔧 Setup & Installation

### 1. Requirements
- Node.js 18+
- Supabase Project

### 2. Local Setup
```bash
git clone https://github.com/kejaki/PreOrderDulu.git
cd PreOrderDulu
npm install
```

### 3. Database Configuration (CRITICAL)
1. In Supabase **SQL Editor**, run the contents of:
   - `supabase/migrations/001_initial_schema.sql` (Initial tables & logic)
   - `supabase/apply_rls_fixes.sql` (Security policies & Storage setup)
2. In Supabase **Auth Settings**:
   - Disable "Confirm Email" (for easier merchant onboarding).
   - Enable "Allow Signup".

### 4. Storage Setup
The SQL script above automatically attempts to create buckets, but ensure these exist and are **Public**:
- `food-images`
- `kyc-documents`

### 5. Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6. Run
```bash
npm run dev
```

## 🚀 Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add the environment variables from `.env.local`.
3. Vercel will automatically build and deploy the app.
4. **Important:** Ensure the Supabase `Site URL` in Auth settings matches your Vercel deployment URL.

## 📂 Project Structure
- `/app`: Next.js pages and layouts.
- `/components`: Reusable UI components and specific feature components.
- `/lib`: Supabase client, geolocation utilities, and API helpers.
- `/store`: Zustand stores for global state.
- `/supabase`: SQL migrations and RLS policy scripts.

## 📄 License
This project is for educational purposes.

## 👨‍💻 Developer
Built as a demonstration of modern agentic web development.
