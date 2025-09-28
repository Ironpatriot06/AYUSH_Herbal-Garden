-- Create the main plants table
CREATE TABLE IF NOT EXISTS plants (
  id SERIAL PRIMARY KEY,
  scientific_name VARCHAR(255) NOT NULL UNIQUE,
  sanskrit_name VARCHAR(255),
  common_name VARCHAR(255) NOT NULL,
  family VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  parts_used TEXT[] NOT NULL,
  medicinal_properties TEXT[] NOT NULL,
  ailments TEXT[] NOT NULL,
  dosage TEXT,
  contraindications TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create preparations table for detailed preparation methods
CREATE TABLE IF NOT EXISTS preparations (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- decoction, powder, oil, etc.
  ingredients TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  dosage VARCHAR(255),
  duration VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create references table for scientific citations
CREATE TABLE IF NOT EXISTS references (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  authors VARCHAR(500),
  journal VARCHAR(255),
  year INTEGER,
  doi VARCHAR(255),
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_plants_scientific_name ON plants(scientific_name);
CREATE INDEX IF NOT EXISTS idx_plants_common_name ON plants(common_name);
CREATE INDEX IF NOT EXISTS idx_plants_family ON plants(family);
CREATE INDEX IF NOT EXISTS idx_plants_parts_used ON plants USING GIN(parts_used);
CREATE INDEX IF NOT EXISTS idx_plants_properties ON plants USING GIN(medicinal_properties);
CREATE INDEX IF NOT EXISTS idx_plants_ailments ON plants USING GIN(ailments);

-- Enable full-text search
CREATE INDEX IF NOT EXISTS idx_plants_search ON plants USING GIN(
  to_tsvector('english', 
    coalesce(scientific_name, '') || ' ' ||
    coalesce(sanskrit_name, '') || ' ' ||
    coalesce(common_name, '') || ' ' ||
    coalesce(description, '')
  )
);
