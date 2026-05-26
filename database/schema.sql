-- ============================================================
-- MR. CLEAN LAUNDRY — DATABASE SCHEMA LENGKAP
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ── USERS (linked to Supabase Auth) ──────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  nama VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'karyawan', 'pelanggan')),
  alamat TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PELANGGAN ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pelanggan (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  nama VARCHAR(255) NOT NULL,
  no_wa VARCHAR(20) NOT NULL,
  alamat TEXT,
  total_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── KARYAWAN ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS karyawan (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  posisi VARCHAR(100),
  tanggal_masuk DATE,
  status VARCHAR(50) DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── JENIS CUCIAN (master data, dikelola owner) ────────────────
CREATE TABLE IF NOT EXISTS jenis_cucian (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  harga_kiloan DECIMAL(10,2),
  harga_satuan DECIMAL(10,2),
  satuan VARCHAR(20) DEFAULT 'pcs',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PENGATURAN BAGI HASIL ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pengaturan (
  id BIGSERIAL PRIMARY KEY,
  kunci VARCHAR(100) UNIQUE NOT NULL,
  nilai TEXT NOT NULL,
  keterangan TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  no_order VARCHAR(50) UNIQUE NOT NULL,
  pelanggan_id BIGINT NOT NULL REFERENCES pelanggan(id) ON DELETE RESTRICT,
  karyawan_id BIGINT REFERENCES karyawan(id),
  jenis_pengiriman VARCHAR(20) DEFAULT 'antar' CHECK (jenis_pengiriman IN ('antar', 'jemput')),
  tanggal_masuk TIMESTAMPTZ DEFAULT NOW(),
  tanggal_selesai TIMESTAMPTZ,
  tanggal_ambil TIMESTAMPTZ,
  total_harga DECIMAL(15,2) DEFAULT 0,
  bagi_hasil_persen DECIMAL(5,2) DEFAULT 0,
  bagi_hasil_nominal DECIMAL(15,2) DEFAULT 0,
  pendapatan_bersih DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'diterima'
    CHECK (status IN ('diterima','diproses','selesai','diambil','dibatalkan')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDER DETAIL ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_detail (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  jenis_cucian_id BIGINT NOT NULL REFERENCES jenis_cucian(id),
  nama_item VARCHAR(150) NOT NULL,
  kategori VARCHAR(20) NOT NULL CHECK (kategori IN ('kiloan','satuan')),
  kuantitas DECIMAL(10,2) NOT NULL,
  harga_satuan DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_pelanggan_nama ON pelanggan(nama);
CREATE INDEX IF NOT EXISTS idx_pelanggan_no_wa ON pelanggan(no_wa);
CREATE INDEX IF NOT EXISTS idx_orders_pelanggan ON orders(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tanggal ON orders(tanggal_masuk);
CREATE INDEX IF NOT EXISTS idx_order_detail_order ON order_detail(order_id);

-- ── SEED: Pengaturan default ──────────────────────────────────
INSERT INTO pengaturan (kunci, nilai, keterangan) VALUES
  ('bagi_hasil_persen', '20', 'Persentase bagi hasil ke pusat (%)'),
  ('nama_cabang', 'Mr. Clean Laundry - Brebes', 'Nama cabang'),
  ('alamat_cabang', 'Limbangan Wetan, Kec. Brebes, Kabupaten Brebes, Jawa Tengah', 'Alamat cabang'),
  ('no_wa_cabang', '081902156350', 'Nomor WhatsApp cabang')
ON CONFLICT (kunci) DO NOTHING;

-- ── SEED: Jenis Cucian default ────────────────────────────────
INSERT INTO jenis_cucian (nama, deskripsi, harga_kiloan, harga_satuan, satuan) VALUES
  ('Cuci Reguler', 'Cuci + kering, estimasi 2-3 hari', 7000, NULL, 'kg'),
  ('Cuci Express', 'Cuci + kering, selesai hari ini', 12000, NULL, 'kg'),
  ('Cuci + Setrika', 'Cuci, kering, dan setrika rapi', 10000, NULL, 'kg'),
  ('Setrika Saja', 'Hanya setrika tanpa cuci', 5000, NULL, 'kg'),
  ('Dry Cleaning', 'Pembersihan khusus pakaian sensitif', NULL, 25000, 'pcs'),
  ('Cuci Sepatu', 'Cuci sepatu bersih dan wangi', NULL, 35000, 'pasang'),
  ('Cuci Tas', 'Cuci tas berbagai jenis', NULL, 40000, 'pcs'),
  ('Selimut / Bed Cover', 'Cuci selimut dan bed cover', NULL, 30000, 'pcs'),
  ('Jas / Blazer', 'Dry cleaning jas dan blazer', NULL, 35000, 'pcs'),
  ('Gaun / Kebaya', 'Dry cleaning gaun dan kebaya', NULL, 45000, 'pcs')
ON CONFLICT (nama) DO NOTHING;
