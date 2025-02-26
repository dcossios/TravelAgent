import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Use service role key
);

async function generateItineraryWithAI(tripId: string, days: number) {
  console.log('Calling FastAPI backend with:', { tripId, days });
  
  const response = await fetch('http://localhost:8000/generate-itinerary/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      trip_id: tripId,
      days: days,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('FastAPI error:', errorData);
    throw new Error(errorData.detail || 'Failed to generate itinerary with AI');
  }

  const data = await response.json();
  console.log('FastAPI response:', data);
  
  // Return the generated content directly
  return data.content;
}

export async function POST(request: Request) {
  try {
    const { tripId } = await request.json();
    console.log('Generation request received for trip:', tripId);

    // Fetch trip details with retries
    let trip = null;
    let tripError = null;
    for (let i = 0; i < 3; i++) {
      const result = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (!result.error) {
        trip = result.data;
        break;
      }
      tripError = result.error;
      console.log(`Attempt ${i + 1} failed, retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!trip) {
      console.error('Error fetching trip after retries:', tripError);
      return NextResponse.json(
        { error: 'Failed to fetch trip details', details: tripError },
        { status: 404 }
      );
    }

    console.log('Trip found:', trip);

    // Fetch itineraries with retries
    let itineraries = null;
    let itineraryError = null;
    for (let i = 0; i < 3; i++) {
      const result = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');
      
      if (!result.error) {
        itineraries = result.data;
        break;
      }
      itineraryError = result.error;
      console.log(`Attempt ${i + 1} failed, retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!itineraries) {
      console.error('Error fetching itineraries after retries:', itineraryError);
      return NextResponse.json(
        { error: 'Failed to fetch itineraries', details: itineraryError },
        { status: 404 }
      );
    }

    console.log('Itineraries found:', itineraries);

    // Calculate number of days
    const days = itineraries.length;
    console.log('Generating for days:', days);

    // Generate content using AI - this will now update the itineraries in the backend
    await generateItineraryWithAI(tripId, days);
    console.log('Generation completed');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in generation process:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate itinerary', details: error },
      { status: 500 }
    );
  }
} 