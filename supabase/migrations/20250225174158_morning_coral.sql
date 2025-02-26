/*
  # Initial Schema Setup for Travel Planning Application

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, matches auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `trips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `destination` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `budget` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `itineraries`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips)
      - `day_number` (integer)
      - `generated_content` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `activities`
      - `id` (uuid, primary key)
      - `itinerary_id` (uuid, references itineraries)
      - `name` (text)
      - `time` (time)
      - `location` (text)
      - `description` (text)
      - `duration` (interval)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `preference_type` (text)
      - `value` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read and write their own data
      - Share trips with other users (future feature)
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  budget numeric,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create itineraries table
CREATE TABLE itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) NOT NULL,
  day_number integer NOT NULL,
  generated_content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, day_number)
);

-- Create activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES itineraries(id) NOT NULL,
  name text NOT NULL,
  time time NOT NULL,
  location text,
  description text,
  duration interval,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  preference_type text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, preference_type)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Itineraries
CREATE POLICY "Users can view itineraries of own trips"
  ON itineraries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create itineraries for own trips"
  ON itineraries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itineraries of own trips"
  ON itineraries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete itineraries of own trips"
  ON itineraries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Activities
CREATE POLICY "Users can view activities of own itineraries"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      JOIN trips ON trips.id = itineraries.trip_id
      WHERE itineraries.id = activities.itinerary_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for own itineraries"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries
      JOIN trips ON trips.id = itineraries.trip_id
      WHERE itineraries.id = activities.itinerary_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities of own itineraries"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      JOIN trips ON trips.id = itineraries.trip_id
      WHERE itineraries.id = activities.itinerary_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities of own itineraries"
  ON activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itineraries
      JOIN trips ON trips.id = itineraries.trip_id
      WHERE itineraries.id = activities.itinerary_id
      AND trips.user_id = auth.uid()
    )
  );

-- User Preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();