-- Create jenis_cucian table
CREATE TABLE IF NOT EXISTS jenis_cucian (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  harga_kiloan DECIMAL(10, 2),
  harga_satuan DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create pelanggan table
CREATE TABLE IF NOT EXISTS pelanggan (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  alamat TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order table
CREATE TABLE IF NOT EXISTS "order" (
  id BIGSERIAL PRIMARY KEY,
  no_order VARCHAR(50) UNIQUE NOT NULL,
  pelanggan_id BIGINT NOT NULL REFERENCES pelanggan(id) ON DELETE CASCADE,
  tanggal_penerimaan TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_harga DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'diterima',
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_detail table
CREATE TABLE IF NOT EXISTS order_detail (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  jenis_cucian_id BIGINT NOT NULL REFERENCES jenis_cucian(id),
  kuantitas DECIMAL(10, 2) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  harga_satuan DECIMAL(10, 2),
  subtotal DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
  nama VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE jenis_cucian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_order_pelanggan ON "order"(pelanggan_id);
CREATE INDEX idx_order_detail_order ON order_detail(order_id);
CREATE INDEX idx_order_detail_jenis ON order_detail(jenis_cucian_id);
CREATE INDEX idx_users_role ON users(role);
