# Supabase Setup Guide for SmartStock Precision Inventory

This guide walks you through setting up Supabase as the PostgreSQL database and backend service for SmartStock.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization, set:
   - **Name**: `smartstockai`
   - **Database Password**: (store securely)
   - **Region**: Closest to you (e.g., South Asia - Mumbai `ap-south-1` or your preferred region).
4. Click **Create new project**.

---

## 2. Execute Database Schema & Seed Data

1. In your Supabase Project dashboard, open the left navigation and click **SQL Editor**.
2. Click **New query**.
3. Open `supabase/schema.sql` in this project, copy the entire contents, and paste it into the Supabase SQL Editor.
4. Click **Run** (or `Ctrl+Enter` / `Cmd+Enter`).
5. You should see `Success. No rows returned`.

This will create:
- `suppliers`: Vendor details, lead times, ratings
- `products`: SKU catalog, real-time stock levels, min/max reorder thresholds, pricing in INR (₹)
- `stock_movements`: Immutable audit trail for receipts, dispatches, audits, and transfers
- `purchase_orders`: Replenishment orders with supplier links and JSON item lists
- `reorder_alerts`: Automated system alerts and AI predictive notifications
- `ai_forecasts`: 30-day demand predictions and stockout risk metrics
- Automated triggers: Keeps timestamps fresh, automatically updates `status` (`in_stock`, `low_stock`, `out_of_stock`), and ensures data consistency
- Row Level Security (RLS) policies allowing secure queries and mutations

---

## 3. Retrieve Your Supabase API Keys

1. In Supabase Dashboard, click the gear icon **Project Settings** at the bottom of the left sidebar.
2. Select **API** under Configuration.
3. Copy the following:
   - **Project URL**: e.g., `https://abcdefghijkl.supabase.co`
   - **Project API Keys** -> `anon` / `public`: e.g., `eyJhbGciOi...`
   - **Project API Keys** -> `service_role` / `secret`: e.g., `eyJhbGciOi...` (revealed by clicking Reveal)

---

## 4. Configure Your `.env` File

Open `.env` in the root of `smartstockai` and paste your keys:

```env
# Backend & Admin Supabase Access
SUPABASE_URL="https://abcdefghijkl.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Frontend Client Access (Vite)
VITE_SUPABASE_URL="https://abcdefghijkl.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."

# Backend Port
PORT=3001
VITE_API_URL="http://localhost:3001"
```

---

## 5. Offline & Development Graceful Fallback

SmartStock includes built-in graceful fallback:
- If keys are unset or using placeholder values, the backend and frontend run in **Mock / In-Memory Mode** with pre-seeded sample data, allowing full testing of the UI, inventory adjustments, and APIs without errors.
- As soon as valid Supabase credentials are provided, it automatically connects to your live Supabase cloud database.
- You can verify connection health at `http://localhost:3001/api/health`.
