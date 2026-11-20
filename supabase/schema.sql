-- ==============================================================================
-- SmartStock Precision Inventory - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if needed (cascade to avoid dependency issues during reset)
-- DROP TABLE IF EXISTS ai_forecasts CASCADE;
-- DROP TABLE IF EXISTS reorder_alerts CASCADE;
-- DROP TABLE IF EXISTS purchase_orders CASCADE;
-- DROP TABLE IF EXISTS stock_movements CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;

-- ------------------------------------------------------------------------------
-- 3. Suppliers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7 CHECK (lead_time_days >= 0),
    rating NUMERIC(3, 2) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5.0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'preferred')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Products / Inventory Items Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) DEFAULT 'Units' NOT NULL, -- Units, Pcs, Kg, Meters, Boxes, Packs
    cost_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (cost_price >= 0), -- in INR (₹)
    selling_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (selling_price >= 0), -- in INR (₹)
    current_stock INTEGER DEFAULT 0 NOT NULL,
    min_reorder_level INTEGER DEFAULT 10 NOT NULL CHECK (min_reorder_level >= 0),
    max_stock_level INTEGER DEFAULT 100 NOT NULL CHECK (max_stock_level >= min_reorder_level),
    reorder_quantity INTEGER DEFAULT 25 NOT NULL CHECK (reorder_quantity > 0),
    location VARCHAR(100) DEFAULT 'Main Warehouse - Bay A1',
    status VARCHAR(20) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for rapid querying & search
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- ------------------------------------------------------------------------------
-- 5. Stock Movements (Audit Ledger for Receipts, Dispatches, Adjustments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL CHECK (quantity != 0), -- Positive for stock in/adjust up, negative or signed based on type
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    reference_number VARCHAR(100), -- PO number, invoice number, cycle audit ref
    reason TEXT,
    performed_by VARCHAR(150) DEFAULT 'System Admin',
    batch_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Purchase Orders Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'received', 'cancelled')),
    total_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_by VARCHAR(150) DEFAULT 'Inventory Manager',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- ------------------------------------------------------------------------------
-- 7. Reorder & Critical Inventory Alerts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reorder_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(30) DEFAULT 'low_stock' CHECK (alert_type IN ('low_stock', 'out_of_stock', 'surplus', 'anomaly', 'reorder_point')),
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
    current_stock INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    suggested_quantity INTEGER NOT NULL,
    ai_prediction TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reorder_alerts_product ON reorder_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_alerts_status ON reorder_alerts(status);

-- ------------------------------------------------------------------------------
-- 8. AI Restocking Forecasts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    predicted_demand_30d INTEGER NOT NULL,
    stockout_risk_percentage NUMERIC(5, 2) NOT NULL,
    recommended_reorder_date DATE,
    confidence_score NUMERIC(3, 2) DEFAULT 0.85,
    forecast_reasoning TEXT,
    seasonal_factor VARCHAR(50) DEFAULT 'normal',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_forecasts_product ON ai_forecasts(product_id);

-- ------------------------------------------------------------------------------
-- 9. Trigger: Automated Updated At Timestamp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 10. Trigger: Auto Status Calculation on Products
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_stock <= 0 THEN
        NEW.status := 'out_of_stock';
    ELSIF NEW.current_stock <= NEW.min_reorder_level THEN
        NEW.status := 'low_stock';
    ELSE
        NEW.status := 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_products_stock_status
BEFORE INSERT OR UPDATE OF current_stock, min_reorder_level ON products
FOR EACH ROW EXECUTE FUNCTION recalculate_product_stock_status();

-- ------------------------------------------------------------------------------
-- 11. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_forecasts ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read access (can be scoped to auth.uid() if user accounts are added)
CREATE POLICY "Allow public read access on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read access on stock_movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public read access on purchase_orders" ON purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access on reorder_alerts" ON reorder_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ai_forecasts" ON ai_forecasts FOR SELECT USING (true);

-- Allow full access for backend service role and anon mutations (for inventory management applet)
CREATE POLICY "Allow anon insert on suppliers" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on suppliers" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on suppliers" ON suppliers FOR DELETE USING (true);

CREATE POLICY "Allow anon insert on products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow anon insert on stock_movements" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert on purchase_orders" ON purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on purchase_orders" ON purchase_orders FOR UPDATE USING (true);

CREATE POLICY "Allow anon insert on reorder_alerts" ON reorder_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on reorder_alerts" ON reorder_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on reorder_alerts" ON reorder_alerts FOR DELETE USING (true);

CREATE POLICY "Allow anon insert/update on ai_forecasts" ON ai_forecasts FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 12. Seed Data (Realistic Indian SMB Warehouse Items with INR ₹ Pricing)
-- ------------------------------------------------------------------------------

-- Seed Suppliers
INSERT INTO suppliers (id, code, name, contact_person, email, phone, city, state, lead_time_days, rating, status)
VALUES
('a0000000-0000-0000-0000-000000000001', 'SUP-BLR-01', 'Apex ElectroTech India Pvt Ltd', 'Ramesh Sharma', 'ramesh@apexelectrotech.in', '+91 98450 12345', 'Bengaluru', 'Karnataka', 5, 4.85, 'preferred'),
('a0000000-0000-0000-0000-000000000002', 'SUP-DEL-02', 'Delhi Fasteners & Industrial Spares', 'Vikram Malhotra', 'orders@delhifasteners.com', '+91 98110 54321', 'New Delhi', 'Delhi', 7, 4.60, 'active'),
('a0000000-0000-0000-0000-000000000003', 'SUP-MUM-03', 'Sahyadri Precision Sensors & Modules', 'Ananya Deshmukh', 'contact@sahyadrisensors.co.in', '+91 99200 67890', 'Pune', 'Maharashtra', 4, 4.90, 'preferred'),
('a0000000-0000-0000-0000-000000000004', 'SUP-CHN-04', 'Coromandel Eco-Packaging Solutions', 'S. K. Sundaram', 'sales@coromandelpack.com', '+91 94440 33221', 'Chennai', 'Tamil Nadu', 8, 4.40, 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Products
INSERT INTO products (id, sku, name, description, category, unit, cost_price, selling_price, current_stock, min_reorder_level, max_stock_level, reorder_quantity, location, status, supplier_id)
VALUES
('b0000000-0000-0000-0000-000000000001', 'SKU-ESP32-WROOM', 'ESP32 Wi-Fi & BLE Microcontroller Module', 'Dual-core 240MHz SoC with integrated antenna and 4MB flash', 'Microcontrollers', 'Units', 285.00, 449.00, 142, 30, 300, 100, 'Warehouse A - Bay 01', 'in_stock', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'SKU-SNS-BME280', 'BME280 Temp/Humidity/Pressure Sensor Board', 'High precision digital sensor I2C/SPI interface for IoT nodes', 'Sensors', 'Units', 380.00, 599.00, 18, 25, 150, 50, 'Warehouse A - Bay 03', 'low_stock', 'a0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000003', 'SKU-PWR-SMPS12V', '12V 5A Industrial DIN-Rail SMPS Power Unit', 'Regulated AC-DC converter with overload and short-circuit protection', 'Power Supply', 'Units', 850.00, 1290.00, 4, 15, 80, 30, 'Warehouse B - Bay 02', 'low_stock', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000004', 'SKU-RLY-4CH5V', '4-Channel 5V Optocoupler Relay Module', 'Standard relay board for automated switching with LED indicator', 'Actuators', 'Units', 145.00, 260.00, 0, 20, 120, 40, 'Warehouse A - Bay 05', 'out_of_stock', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000005', 'SKU-FST-M3X10SS', 'M3 x 10mm SS304 Hex Socket Head Cap Screws', 'Corrosion-resistant stainless steel fasteners for enclosure assembly (Pack of 100)', 'Fasteners', 'Packs', 120.00, 195.00, 85, 20, 200, 50, 'Warehouse C - Shelf 12', 'in_stock', 'a0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000006', 'SKU-ENC-IP65ABS', 'IP65 Weatherproof ABS Enclosure 150x100x70', 'Sealed junction box for outdoor telematics & sensor gateways', 'Enclosures', 'Units', 240.00, 395.00, 56, 15, 100, 30, 'Warehouse C - Shelf 04', 'in_stock', 'a0000000-0000-0000-0000-000000000004'),
('b0000000-0000-0000-0000-000000000007', 'SKU-CBL-CAT6-305', 'Cat6 UTP Solid Bare Copper Cable Drum (305m)', 'High speed gigabit ethernet networking bulk cable', 'Cables & Wiring', 'Boxes', 7200.00, 9800.00, 8, 5, 25, 10, 'Warehouse B - Rack 04', 'in_stock', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000008', 'SKU-DIS-OLED128', '0.96 inch I2C 128x64 OLED Display Module (Blue)', 'Ultra-low power monochrome display panel for diagnostics', 'Displays', 'Units', 165.00, 280.00, 94, 25, 250, 60, 'Warehouse A - Bay 02', 'in_stock', 'a0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000009', 'SKU-BAT-18650LI', '3.7V 2600mAh Grade-A 18650 Li-ion Battery Cell', 'Rechargeable cylindrical cell with BIS certification', 'Batteries', 'Units', 175.00, 290.00, 11, 30, 200, 80, 'Warehouse D - Hazmat B1', 'low_stock', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000010', 'SKU-SOL-6040R', 'Lead-Free Solder Wire 0.8mm (500g Spool)', 'High purity rosin core solder for SMD and PCB repair', 'Consumables', 'Units', 950.00, 1450.00, 22, 10, 50, 15, 'Warehouse C - Shelf 02', 'in_stock', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Stock Movements
INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_number, reason, performed_by)
VALUES
('b0000000-0000-0000-0000-000000000001', 'in', 50, 92, 142, 285.00, 'PO-2026-081', 'Received bulk batch from Apex ElectroTech', 'Warehouse Lead (Ashok)'),
('b0000000-0000-0000-0000-000000000002', 'out', -15, 33, 18, 380.00, 'DISP-2026-304', 'Order fulfillment for smart meter assembly line', 'Logistics Executive'),
('b0000000-0000-0000-0000-000000000003', 'out', -6, 10, 4, 850.00, 'DISP-2026-312', 'Site installation dispatch for Pune client project', 'Inventory Officer'),
('b0000000-0000-0000-0000-000000000004', 'out', -8, 8, 0, 145.00, 'DISP-2026-319', 'Production run batch #44 checkout', 'Production Lead'),
('b0000000-0000-0000-0000-000000000009', 'out', -19, 30, 11, 175.00, 'DISP-2026-321', 'Telemetry battery pack production', 'Shift Supervisor');

-- Seed Reorder Alerts
INSERT INTO reorder_alerts (id, product_id, alert_type, severity, current_stock, threshold, suggested_quantity, ai_prediction, status)
VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'out_of_stock', 'critical', 0, 20, 40, 'Stockout detected. High risk of manufacturing line interruption. Expedited replenishment PO advised.', 'active'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'low_stock', 'critical', 4, 15, 30, 'Current stock (4) is below buffer threshold (15). Lead time is 5 days; reorder now to prevent stockout.', 'active'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'low_stock', 'warning', 18, 25, 50, 'Run rate velocity predicts stock exhaustion in 6 business days. Supplier Sahyadri lead time is 4 days.', 'active'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000009', 'low_stock', 'warning', 11, 30, 80, 'Li-ion cell consumption increased 35% week-over-week. Suggest creating draft PO for 80 units.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed AI Forecasts
INSERT INTO ai_forecasts (product_id, predicted_demand_30d, stockout_risk_percentage, recommended_reorder_date, confidence_score, forecast_reasoning, seasonal_factor)
VALUES
('b0000000-0000-0000-0000-000000000001', 95, 12.5, CURRENT_DATE + INTERVAL '18 days', 0.92, 'Steady baseline demand observed across 4 active clients. Stock is adequate for next 3 weeks.', 'normal'),
('b0000000-0000-0000-0000-000000000002', 45, 78.4, CURRENT_DATE + INTERVAL '2 days', 0.89, 'High velocity telemetry node production scheduled next week. Reorder immediately.', 'high_demand'),
('b0000000-0000-0000-0000-000000000003', 22, 94.0, CURRENT_DATE, 0.95, 'Critical SMPS stock depleted to 4 units. Unfulfilled customer demand imminent within 72 hours.', 'urgent'),
('b0000000-0000-0000-0000-000000000004', 35, 100.0, CURRENT_DATE, 0.97, 'Zero stock available. Active backorders accumulated.', 'urgent');

-- ------------------------------------------------------------------------------
-- 13. Customer Inquiries & AI Response Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    inquiry_type VARCHAR(50) DEFAULT 'stock_check' CHECK (inquiry_type IN ('stock_check', 'bulk_quote', 'order_tracking', 'returns', 'general')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    requested_quantity INTEGER DEFAULT 1,
    subject VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'drafted', 'replied', 'resolved')),
    ai_draft_response TEXT,
    final_response TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    responded_at TIMESTAMPTZ
);

ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inquiries" ON customer_inquiries FOR SELECT USING (true);
CREATE POLICY "Public insert inquiries" ON customer_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inquiries" ON customer_inquiries FOR UPDATE USING (true);

-- Seed Customer Inquiries
INSERT INTO customer_inquiries (id, customer_name, email, phone, company, inquiry_type, product_id, product_name, requested_quantity, subject, message, priority, status)
VALUES
('e0000000-0000-0000-0000-000000000001', 'Kavita Rao', 'kavita.rao@robovation.in', '+91 98765 43210', 'RoboVation Systems LLP (Hyderabad)', 'stock_check', 'b0000000-0000-0000-0000-000000000001', 'ESP32 Wi-Fi & BLE Microcontroller Module', 30, 'Urgent: Stock availability check for 30 units of ESP32-WROOM', 'Hello SmartStock Sales Team, we have an ongoing smart metering prototype deployment in Hyderabad. We urgently require 30 units of ESP32-WROOM-32D. Could you confirm if ready stock is available for immediate same-day dispatch and share the unit price with GST?', 'high', 'pending'),
('e0000000-0000-0000-0000-000000000002', 'Amit Patel', 'amit@nexgeniot.com', '+91 98234 56789', 'NexGen IoT Labs (Ahmedabad)', 'bulk_quote', 'b0000000-0000-0000-0000-000000000002', 'BME280 Temp/Humidity/Pressure Sensor Board', 50, 'Bulk quotation request: 50x BME280 Sensors for AgriTech Pilot', 'Dear Team, We are organizing a pilot installation for farm weather telemetry and need 50 pieces of BME280 sensors. Please provide your best institutional volume pricing along with lead time.', 'medium', 'pending'),
('e0000000-0000-0000-0000-000000000003', 'Sunil Menon', 's.menon@keralasolar.org', '+91 94470 11223', 'Kerala Solar Automation (Kochi)', 'stock_check', 'b0000000-0000-0000-0000-000000000004', '4-Channel 5V Optocoupler Relay Module', 20, 'Restock ETA for 4-Channel 5V Relay Modules', 'Hi, we noticed on your portal that the 4-Channel 5V Relay Module is currently showing out of stock. When do you expect the next replenishment batch to arrive? We need 20 units for our solar inverter control boxes.', 'urgent', 'pending')
ON CONFLICT (id) DO NOTHING;

