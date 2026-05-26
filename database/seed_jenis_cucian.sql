-- ============================================================
-- SEED: Jenis Cucian Mr. Clean
-- Hapus data lama dulu, lalu insert baru
-- ============================================================

-- Tambah kolom kategori kalau belum ada
ALTER TABLE jenis_cucian ADD COLUMN IF NOT EXISTS kategori VARCHAR(100) DEFAULT 'Umum';

-- Hapus data lama
DELETE FROM jenis_cucian;

-- ── WET CLEAN ─────────────────────────────────────────────────
INSERT INTO jenis_cucian (nama, kategori, harga_kiloan, harga_satuan, satuan, is_active) VALUES
('Jas', 'Wet Clean', NULL, NULL, 'pcs', true),
('Setelan Jas', 'Wet Clean', NULL, NULL, 'set', true),
('Batik', 'Wet Clean', NULL, NULL, 'pcs', true),
('Kemeja', 'Wet Clean', NULL, NULL, 'pcs', true),
('Blouse, Dress (pj)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Blouse, Dress (pd)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Kaos', 'Wet Clean', NULL, NULL, 'pcs', true),
('Kaos Polo/Kerah', 'Wet Clean', NULL, NULL, 'pcs', true),
('Celana (pj)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Celana (pd)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Kebaya, Brokat, Payet (pj)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Kebaya, Brokat, Payet (pd)', 'Wet Clean', NULL, NULL, 'pcs', true),
('Inner, Rompi', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jersey', 'Wet Clean', NULL, NULL, 'pcs', true),
('Setelan Kebaya', 'Wet Clean', NULL, NULL, 'set', true),
('Gaun Pengantin, Dress Pesta', 'Wet Clean', NULL, NULL, 'pcs', true),
('Baju Pengantin Pria Set', 'Wet Clean', NULL, NULL, 'set', true),
('Jaket Bahan, Hoodie', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket/Celana Kulit', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket Parka, Wool', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket Jeans, Motor', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket Winter', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket Coat', 'Wet Clean', NULL, NULL, 'pcs', true),
('Jaket Bulu', 'Wet Clean', NULL, NULL, 'pcs', true),
('Blazer, Sweater', 'Wet Clean', NULL, NULL, 'pcs', true),
('Mukena Set', 'Wet Clean', NULL, NULL, 'set', true),
('Jubah/Gamis', 'Wet Clean', NULL, NULL, 'pcs', true),
('Setelan Gamis', 'Wet Clean', NULL, NULL, 'set', true),
('Baju Koko', 'Wet Clean', NULL, NULL, 'pcs', true),
('Seragam Kerja Set', 'Wet Clean', NULL, NULL, 'set', true),

-- ── HOUSE HOLD ────────────────────────────────────────────────
('Sleeping Bag', 'House Hold', NULL, NULL, 'pcs', true),
('Matras Yoga', 'House Hold', NULL, NULL, 'pcs', true),
('Selimut Tipis', 'House Hold', NULL, NULL, 'pcs', true),
('Selimut Sedang', 'House Hold', NULL, NULL, 'pcs', true),
('Selimut Tebal', 'House Hold', NULL, NULL, 'pcs', true),
('Bantal, Guling', 'House Hold', NULL, NULL, 'pcs', true),
('Bantal Sofa', 'House Hold', NULL, NULL, 'pcs', true),
('Sprei', 'House Hold', NULL, NULL, 'pcs', true),
('Sprei Set', 'House Hold', NULL, NULL, 'set', true),
('Sepatu Kanvas', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Kulit, Pantofel', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Gunung', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Sport', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Anak', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Safety', 'House Hold', NULL, NULL, 'pasang', true),
('Sepatu Deep Cleaning', 'House Hold', NULL, NULL, 'pasang', true),
('Unyellowing Sepatu', 'House Hold', NULL, NULL, 'pasang', true),
('Tas Ransel, Pollo', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Travel/Olahraga', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Bahan', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Kulit', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Koper Besar', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Koper Sedang', 'House Hold', NULL, NULL, 'pcs', true),
('Tas Koper Kecil', 'House Hold', NULL, NULL, 'pcs', true),
('Helm', 'House Hold', NULL, NULL, 'pcs', true),
('Helm Full Face', 'House Hold', NULL, NULL, 'pcs', true),
('Stroller Baby', 'House Hold', NULL, NULL, 'pcs', true),
('Carseat Baby', 'House Hold', NULL, NULL, 'pcs', true),
('Keset', 'House Hold', NULL, NULL, 'pcs', true),
('Keset Panjang', 'House Hold', NULL, NULL, 'pcs', true),

-- ── KILOAN ────────────────────────────────────────────────────
('Cuci Reguler', 'Kiloan', 7000, NULL, 'kg', true),
('Cuci Express', 'Kiloan', 12000, NULL, 'kg', true),
('Cuci + Setrika', 'Kiloan', 10000, NULL, 'kg', true),
('Setrika Saja', 'Kiloan', 5000, NULL, 'kg', true);
