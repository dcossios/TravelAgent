'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { useAuth } from '@/components/auth-provider';
import { PlaneTakeoff, MapPin, Calendar, PlusCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Itinerary {
  id: string;
  day_number: number;
  generated_content: {
    interests: string[];
    preferences: string[];
    status: string;
    activities?: {
      time: string;
      description: string;
      location?: string;
      notes?: string;
    }[];
    recommendations?: string[];
    summary?: string;
  };
}

async function addToDashboard(tripId: string) {
  "use server";
  
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("saved_trips")
    .insert({
      user_id: session.user.id,
      trip_id: tripId,
    })
    .select()
    .single();

  if (error?.code === "23505") {
    return { error: "Trip already saved to dashboard" };
  }

  if (error) {
    return { error: "Failed to save trip" };
  }

  return { success: true };
}

async function shareTrip(tripId: string, email: string) {
  "use server";
  
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { error: "Not authenticated" };
  }

  // Get user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return { error: "User not found" };
  }

  const { error } = await supabase
    .from("shared_trips")
    .insert({
      trip_id: tripId,
      shared_by: session.user.id,
      shared_with: user.id,
      permission_level: "view",
    })
    .select()
    .single();

  if (error?.code === "23505") {
    return { error: "Trip already shared with this user" };
  }

  if (error) {
    return { error: "Failed to share trip" };
  }

  return { success: true };
}

export default function TripDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTripData() {
      if (!supabase || !user) return;

      try {
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

        // Fetch itineraries
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itineraries')
          .select('*')
          .eq('trip_id', id)
          .order('day_number');

        if (itineraryError) throw itineraryError;
        setItineraries(itineraryData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTripData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6">
          <h1 className="text-xl font-bold text-center mb-4">Error</h1>
          <p className="text-muted-foreground">
            {error || 'Trip not found'}
          </p>
          <Link href="/" className="text-primary hover:underline block mt-4 text-center">
            Return to Home
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <PlaneTakeoff className="h-6 w-6" />
            <span className="text-xl font-bold">AI Travel Agent</span>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold capitalize">{trip.destination}</h1>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const result = await addToDashboard(id);
                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success("Trip added to dashboard");
                }
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Dashboard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const email = (e.target as HTMLFormElement).email.value;
                    const result = await shareTrip(id, email);
                    if (result.error) {
                      toast.error(result.error);
                    } else {
                      toast.success("Trip shared successfully");
                      (e.target as HTMLFormElement).reset();
                    }
                  }}
                  className="p-2"
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    className="w-full p-2 mb-2 border rounded"
                    required
                  />
                  <Button type="submit" className="w-full">
                    Share Trip
                  </Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Trip to {trip.destination}</h1>
        </div>
        
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <p className="text-muted-foreground">
            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="grid gap-8">
          {itineraries.map((itinerary) => (
            <Card key={itinerary.id} className="p-6">
              <h2 className="text-xl font-semibold mb-4">Day {itinerary.day_number}</h2>
              {itinerary.generated_content.status === 'pending' ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner />
                  <span className="ml-2">Generating itinerary...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {itinerary.generated_content.summary && (
                    <div>
                      <h3 className="font-medium mb-2">Day Overview</h3>
                      <p className="text-muted-foreground">{itinerary.generated_content.summary}</p>
                    </div>
                  )}

                  {itinerary.generated_content.activities && itinerary.generated_content.activities.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Activities</h3>
                      <div className="space-y-4">
                        {itinerary.generated_content.activities.map((activity, index) => (
                          <div key={index} className="border-l-2 border-primary pl-4">
                            <div className="font-medium">{activity.time}</div>
                            <div className="text-muted-foreground">{activity.description}</div>
                            {activity.location && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {activity.location}
                              </div>
                            )}
                            {activity.notes && (
                              <div className="text-sm text-muted-foreground mt-1 italic">
                                Note: {activity.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {itinerary.generated_content.recommendations && itinerary.generated_content.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Additional Recommendations</h3>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {itinerary.generated_content.recommendations.map((recommendation, index) => (
                          <li key={index}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">Interests</h3>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {itinerary.generated_content.interests.map((interest, index) => (
                            <li key={index}>{interest}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Preferences</h3>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {itinerary.generated_content.preferences.map((preference, index) => (
                            <li key={index}>{preference}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}