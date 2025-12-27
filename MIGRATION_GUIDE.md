# Quick Guide: Apply Review System Migration

## Step 1: Copy the SQL
The migration file is already open in your editor: `supabase/migrations/002_review_system.sql`

Select all the content (Ctrl+A) and copy it (Ctrl+C)

## Step 2: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)

## Step 3: Run the Migration
1. Click "New Query"
2. Paste the SQL code
3. Click "Run" (or press Ctrl+Enter)

✅ You should see success messages for each statement!

## Step 4: Verify the Changes
Go to **Table Editor** and verify:
- New table `reviews` exists
- `merchants` table has `rating_average` and `rating_count` columns

---

## Quick Test Flow

### Option 1: Manual Database Update (Fastest)
1. Go to **Table Editor** → `orders`
2. Find any existing order
3. Change its `status` to `'completed'`
4. Open the tracking page for that order
5. Review modal should appear after 2 seconds!

### Option 2: Create Real Test Order
1. Navigate to `http://localhost:3000`
2. Find an open merchant
3. Add items and checkout
4. Login to merchant dashboard (using your credentials)
5. Accept and complete the order
6. Return to buyer tracking page to see review modal

---

## What to Test
- [ ] Star rating selection (hover and click)
- [ ] Submit with/without comment
- [ ] Success message appears
- [ ] Cannot submit duplicate review
- [ ] Merchant's rating updates in database
