-- ============================================================
-- CampusQuest Go - Database Initialization Script
-- ============================================================

-- Create Users Table (shared across services)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    quest_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fitness Activities Table (Service A)
CREATE TABLE IF NOT EXISTS fitness_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    distance_miles DECIMAL(10, 2) NOT NULL,
    calories_burned INTEGER,
    points_earned INTEGER NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Canteens Table (Services B, C)
CREATE TABLE IF NOT EXISTS canteens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_name VARCHAR(100),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Menu Items Table (Service B)
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    canteen_id INTEGER REFERENCES canteens(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    calories INTEGER,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Locations Table (Service C)
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    nearby_canteen_id INTEGER REFERENCES canteens(id),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Merchandise Table (Service D)
CREATE TABLE IF NOT EXISTS merchandise (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost_in_points INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Rewards Transactions Table (Service D)
CREATE TABLE IF NOT EXISTS rewards_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    merchandise_id INTEGER REFERENCES merchandise(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    points_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_canteen_id ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_quest_points ON users(quest_points DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Sample Users
INSERT INTO users (username, email, password_hash, quest_points) VALUES
    ('student_alex', 'alex@campus.edu', '$2b$10$samplehash1', 850),
    ('student_bella', 'bella@campus.edu', '$2b$10$samplehash2', 420),
    ('student_charlie', 'charlie@campus.edu', '$2b$10$samplehash3', 1200),
    ('student_diana', 'diana@campus.edu', '$2b$10$samplehash4', 310),
    ('student_evan', 'evan@campus.edu', '$2b$10$samplehash5', 750)
ON CONFLICT (username) DO NOTHING;

-- Sample Canteens (update coordinates to match your actual school!)
INSERT INTO canteens (name, location_name, latitude, longitude) VALUES
    ('North Canteen', 'Block A, Level 1', 1.3429, 103.6818),
    ('South Canteen', 'Block C, Level 2', 1.3415, 103.6830),
    ('Central Food Court', 'Student Hub, Level 3', 1.3422, 103.6824)
ON CONFLICT DO NOTHING;

-- Sample Menu Items
INSERT INTO menu_items (canteen_id, name, description, price, calories) VALUES
    (1, 'Chicken Rice', 'Fragrant steamed chicken with rice', 3.50, 580),
    (1, 'Vegetable Stir Fry', 'Seasonal vegetables with tofu', 2.80, 320),
    (1, 'Laksa', 'Spicy coconut noodle soup', 4.00, 650),
    (1, 'Fruit Bowl', 'Fresh seasonal fruits', 3.00, 180),
    (2, 'Nasi Lemak', 'Coconut rice with sambal, egg, and anchovies', 4.50, 720),
    (2, 'Mee Goreng', 'Spicy fried noodles', 3.50, 560),
    (2, 'Iced Milo', 'Classic cold chocolate malt drink', 1.50, 150),
    (3, 'Western Set Meal', 'Grilled chicken chop with fries and salad', 6.50, 820),
    (3, 'Aglio Olio', 'Pasta with garlic, olive oil and herbs', 5.00, 540),
    (3, 'Fresh Juice', 'Choice of orange, apple, or watermelon', 2.50, 110)
ON CONFLICT DO NOTHING;

-- Sample Merchandise (update for your school!)
INSERT INTO merchandise (name, description, cost_in_points, stock_quantity, category) VALUES
    ('Campus Hoodie', 'Premium CampusQuest branded hoodie, sizes S-XXL', 500, 50, 'apparel'),
    ('Campus T-Shirt', 'Comfortable cotton tee with CampusQuest logo', 250, 100, 'apparel'),
    ('Stainless Steel Bottle', '500ml reusable water bottle with lid', 300, 75, 'accessories'),
    ('Campus Cap', 'Adjustable snapback cap with embroidered logo', 200, 60, 'accessories'),
    ('Study Planner', 'Academic planner with CampusQuest design', 150, 120, 'stationery'),
    ('Tote Bag', 'Eco-friendly canvas tote bag', 180, 80, 'accessories'),
    ('Free Lunch Voucher', 'Redeem for any meal at any campus canteen', 400, 200, 'voucher'),
    ('Campus Mug', 'Ceramic mug with campus crest', 220, 90, 'accessories')
ON CONFLICT DO NOTHING;

-- Sample Fitness Activities
INSERT INTO fitness_activities (user_id, activity_type, distance_miles, calories_burned, points_earned) VALUES
    (1, 'running', 5.5, 450, 55),
    (1, 'cycling', 10.0, 380, 100),
    (2, 'running', 3.2, 280, 32),
    (3, 'swimming', 2.0, 300, 20),
    (3, 'running', 8.0, 650, 80),
    (5, 'walking', 4.5, 200, 45)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Trigger to update users.updated_at automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchandise_updated_at
    BEFORE UPDATE ON merchandise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
