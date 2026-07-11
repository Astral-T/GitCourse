-- Script de Inicialización de Base de Datos - Portal de Curiosidad y Simulación

-- 1. Tabla de Perfil de Usuario (para balance ficticio)
CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    balance NUMERIC(15, 4) DEFAULT 10000.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar perfil por defecto si no existe
INSERT INTO user_profile (id, balance)
VALUES (1, 10000.0000)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Pasaporte del Usuario (Países descubiertos y logros)
CREATE TABLE IF NOT EXISTS user_passports (
    country_code VARCHAR(3) PRIMARY KEY, -- Código ISO de 3 letras (ej. PER, JPN, DEU)
    country_name VARCHAR(100) NOT NULL,
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comida_nivel INTEGER DEFAULT 0,
    naturaleza_nivel INTEGER DEFAULT 0,
    economia_nivel INTEGER DEFAULT 0,
    costumbres_nivel INTEGER DEFAULT 0,
    geografia_nivel INTEGER DEFAULT 0
);

-- 3. Tabla de Tarjetas de Repetición Espaciada (Spaced Repetition Cards)
CREATE TABLE IF NOT EXISTS learning_cards (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) REFERENCES user_passports(country_code) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    repetition INTEGER DEFAULT 0,       -- Número de repeticiones consecutivas correctas
    interval INTEGER DEFAULT 1,         -- Intervalo en días para el próximo repaso
    ease_factor NUMERIC(4, 2) DEFAULT 2.50, -- Factor de facilidad (SM-2)
    last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ignored BOOLEAN DEFAULT FALSE
);

-- 4. Tabla de Caché de Noticias (Evita recargas excesivas y filtra en backend)
CREATE TABLE IF NOT EXISTS news_cache (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    summary TEXT,
    url TEXT NOT NULL,
    source VARCHAR(100),
    category VARCHAR(50), -- 'Ciencia', 'Ingeniería', 'Tecnología', 'Biología', 'Economía'
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Historial de Operaciones de Trading (Criptos y Acciones)
CREATE TABLE IF NOT EXISTS trading_history (
    id SERIAL PRIMARY KEY,
    asset_symbol VARCHAR(10) NOT NULL,    -- BTC, SOL, AAPL, NVDA, etc.
    asset_name VARCHAR(100) NOT NULL,     -- Bitcoin, Apple Inc.
    asset_type VARCHAR(10) NOT NULL,      -- 'crypto' o 'stock'
    transaction_type VARCHAR(4) NOT NULL, -- 'BUY' o 'SELL'
    amount NUMERIC(18, 8) NOT NULL,
    price NUMERIC(15, 4) NOT NULL,
    total_value NUMERIC(18, 4) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Portafolio del Usuario (Tenencias actuales)
CREATE TABLE IF NOT EXISTS user_portfolio (
    asset_symbol VARCHAR(10) PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL,
    asset_type VARCHAR(10) NOT NULL,      -- 'crypto' o 'stock'
    amount NUMERIC(18, 8) DEFAULT 0.00000000,
    average_buy_price NUMERIC(15, 4) DEFAULT 0.0000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Migraciones / Modificaciones Posteriores
ALTER TABLE learning_cards ADD COLUMN IF NOT EXISTS ignored BOOLEAN DEFAULT FALSE;
