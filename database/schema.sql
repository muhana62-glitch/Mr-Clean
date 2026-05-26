-- ============================================================
-- MR. CLEAN LAUNDRY — DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'karyawan', 'pelanggan')),
  alamat TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PELANGGAN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pelanggan (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_order INTEGER DEFAULT 0,
  total_pengeluaran DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- KARYAWAN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS karyawan (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  posisi VARCHAR(100),
  tanggal_masuk DATE,
  status VARCHAR(50) DEFAULT 'aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- JENIS CUCIAN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS jenis_cucian (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  harga_kiloan DECIMAL(10, 2),
  harga_satuan DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  no_order VARCHAR(50) UNIQUE NOT NULL,
  pelanggan_id BIGINT NOT NULL REFERENCES pelanggan(id) ON DELETE RESTRICT,
  karyawan_id BIGINT REFERENCES karyawan(id),
  tanggal_masuk TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tanggal_selesai TIMESTAMP WITH TIME ZONE,
  tanggal_ambil TIMESTAMP WITH TIME ZONE,
  total_harga DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'diterima' CHECK (status IN ('diterima', 'diproses', 'selesai', 'diambil', 'dibatalkan')),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDER DETAIL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_detail (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  jenis_cucian_id BIGINT NOT NULL REFERENCES jenis_cucian(id),
  kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('kiloan', 'satuan')),
  kuantitas DECIMAL(10, 2) NOT NULL,
  harga_satuan DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  jumlah DECIMAL(15, 2) NOT NULL,
  metode VARCHAR(50) NOT NULL CHECK (metode IN ('tunai', 'transfer', 'qris')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'lunas', 'gagal')),
  tanggal_bayar TIMESTAMP WITH TIME ZONE,
  referensi VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  judul VARCHAR(255),
  pesan TEXT NOT NULL,
  tipe VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_pelanggan ON orders(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_detail_order ON order_detail(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE jenis_cucian ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: bisa baca data sendiri
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Pelanggan: bisa baca data sendiri
CREATE POLICY "pelanggan_select_own" ON pelanggan FOR SELECT USING (
  user_id = auth.uid()
);

-- Orders: pelanggan lihat order sendiri, karyawan/owner lihat semua
CREATE POLICY "orders_select_pelanggan" ON orders FOR SELECT USING (
  pelanggan_id IN (SELECT id FROM pelanggan WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('karyawan', 'owner'))
);
CREATE POLICY "orders_insert_karyawan" ON orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('karyawan', 'owner'))
);
CREATE POLICY "orders_update_karyawan" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('karyawan', 'owner'))
);

-- Order detail: ikuti akses order
CREATE POLICY "order_detail_select" ON order_detail FOR SELECT USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.pelanggan_id IN (SELECT id FROM pelanggan WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('karyawan', 'owner'))
  )
);

-- Jenis cucian: semua bisa baca
CREATE POLICY "jenis_cucian_select_all" ON jenis_cucian FOR SELECT USING (true);
CREATE POLICY "jenis_cucian_manage_owner" ON jenis_cucian FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
);

-- Notifications: baca notif sendiri
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Payments: pelanggan lihat milik sendiri, karyawan/owner lihat semua
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  order_id IN (
    SELECT o.id FROM orders o
    WHERE o.pelanggan_id IN (SELECT id FROM pelanggan WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('karyawan', 'owner'))
  )
);

-- ============================================================
-- SEED DATA — Jenis Cucian
-- ============================================================
INSERT INTO jenis_cucian (nama, deskripsi, harga_kiloan, harga_satuan) VALUES
  ('Cuci Reguler', 'Cuci + kering, estimasi 2-3 hari', 7000, NULL),
  ('Cuci Express', 'Cuci + kering, selesai hari ini', 12000, NULL),
  ('Cuci + Setrika', 'Cuci, kering, dan setrika rapi', 10000, NULL),
  ('Setrika Saja', 'Hanya setrika tanpa cuci', 5000, NULL),
  ('Dry Cleaning', 'Pembersihan khusus pakaian sensitif', NULL, 25000),
  ('Sepatu', 'Cuci sepatu bersih dan wangi', NULL, 35000),
  ('Tas', 'Cuci tas berbagai jenis', NULL, 40000),
  ('Selimut / Bed Cover', 'Cuci selimut dan bed cover', NULL, 30000)
ON CONFLICT (nama) DO NOTHING;
