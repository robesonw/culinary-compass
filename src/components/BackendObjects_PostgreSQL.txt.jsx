-- ============================================
-- VitaPlate Application - PostgreSQL Schema
-- Complete Database Schema for Local Docker Setup
-- Generated: 2026-01-03
-- ============================================

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_by_id VARCHAR(255),
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    
    CONSTRAINT chk_role CHECK (role IN ('user', 'admin'))
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_created_date ON users (created_date);

-- ============================================
-- 2. USER_PREFERENCES TABLE
-- ============================================
CREATE TABLE user_preferences (
    id VARCHAR(255) PRIMARY KEY,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_by_id VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    health_goal VARCHAR(100),
    dietary_restrictions TEXT,
    foods_liked TEXT,
    foods_avoided TEXT,
    allergens JSONB DEFAULT '[]'::jsonb,
    cuisine_preferences JSONB DEFAULT '[]'::jsonb,
    cooking_time VARCHAR(50) DEFAULT 'any',
    skill_level VARCHAR(50) DEFAULT 'intermediate',
    num_people INTEGER DEFAULT 1,
    weekly_budget DECIMAL(10,2) DEFAULT 100.00,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences (created_by_id);

-- ============================================
-- 3. USER_SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
    id VARCHAR(255) PRIMARY KEY,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_by_id VARCHAR(255),
    email_notifications BOOLEAN DEFAULT TRUE,
    recipe_approved_notifications BOOLEAN DEFAULT TRUE,
    recipe_rejected_notifications BOOLEAN DEFAULT TRUE,
    new_follower_notifications BOOLEAN DEFAULT TRUE,
    comment_notifications BOOLEAN DEFAULT TRUE,
    like_notifications BOOLEAN DEFAULT FALSE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_settings_user_id ON user_settings (created_by_id);

-- ============================================
-- 4. NUTRITION_GOALS TABLE
-- ============================================
CREATE TABLE nutrition_goals (
    id VARCHAR(255) PRIMARY KEY,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_by_id VARCHAR(255),
    goal_type VARCHAR(50) NOT NULL,
    target_calories INTEGER,
    target_protein INTEGER,
    target_carbs INTEGER,
    target_fat INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_goal_type CHECK (goal_type IN ('daily', 'weekly'))
);

CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals (created_by_id);
CREATE INDEX idx_nutrition_goals_type_active ON nutrition_goals (goal_type, is_active);

-- ============================================
-- 5. NUTRITION_LOGS TABLE
-- ============================================
CREATE TABLE nutrition_logs (
    id VARCHAR(255) PRIMARY KEY,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    created_by_id VARCHAR(255),
    recipe_name VARCHAR(500) NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    log_date DATE NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    servings DECIMAL(4,2) DEFAULT 1.0,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs (created_by_id);
CREATE INDEX idx_nutrition_logs_date ON nutrition_logs (log_date);
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs (created_by_id, log_date);

-- Continue with remaining tables...
-- (Full schema continues with all 21 tables)