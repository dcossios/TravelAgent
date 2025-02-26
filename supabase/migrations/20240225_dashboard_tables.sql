-- Create saved_trips table
CREATE TABLE IF NOT EXISTS saved_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, trip_id)
);

-- Create shared_trips table
CREATE TABLE IF NOT EXISTS shared_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'edit')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, shared_with)
);

-- Add RLS policies
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;

-- Policies for saved_trips
CREATE POLICY "Users can view their own saved trips"
    ON saved_trips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save trips"
    ON saved_trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved trips"
    ON saved_trips FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for shared_trips
CREATE POLICY "Users can view trips shared with them"
    ON shared_trips FOR SELECT
    USING (auth.uid() = shared_with OR auth.uid() = shared_by);

CREATE POLICY "Users can share their trips"
    ON shared_trips FOR INSERT
    WITH CHECK (
        auth.uid() = shared_by
        AND EXISTS (
            SELECT 1 FROM trips
            WHERE id = trip_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their shared trips"
    ON shared_trips FOR DELETE
    USING (auth.uid() = shared_by);

-- Add triggers to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_trips_updated_at
    BEFORE UPDATE ON saved_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_trips_updated_at
    BEFORE UPDATE ON shared_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 