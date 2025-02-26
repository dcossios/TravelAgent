'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, MapPinIcon, PlaneTakeoff } from 'lucide-react';
import Link from 'next/link';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { addDays, differenceInDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function CreateItineraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [destination, setDestination] = useState('');
  const [interests, setInterests] = useState('');
  const [preferences, setPreferences] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      console.log('User is not authenticated');
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create an itinerary.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Current user:', user);

    if (!destination || !dateRange?.from || !dateRange?.to) {
      console.log('Missing required fields');
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Checking Supabase configuration...');
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured properly');
      }

      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Check if profile exists
      console.log('Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      console.log('Profile check result:', { profile, profileError });

      if (profileError) {
        // Create profile if it doesn't exist
        console.log('Creating user profile...', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        });
        
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata.full_name,
          });

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          throw createProfileError;
        }
        
        console.log('Profile created successfully');
      }

      console.log('Inserting trip data...');
      // Create the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          destination,
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
          status: 'generating',
        })
        .select()
        .single();

      if (tripError) {
        console.error('Error inserting trip:', tripError);
        throw tripError;
      }

      console.log('Trip inserted successfully:', trip);

      // Calculate number of days
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      console.log('Calculating number of days:', days);

      // Create itineraries for each day
      const itineraryPromises = Array.from({ length: days }, (_, i) => {
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        return supabase
          .from('itineraries')
          .insert({
            trip_id: trip.id,
            day_number: i + 1,
            generated_content: {
              interests: interests.split('\n').filter(Boolean),
              preferences: preferences.split('\n').filter(Boolean),
              status: 'pending',
            },
          })
          .select();
      });

      console.log('Inserting itineraries...');
      await Promise.all(itineraryPromises);

      // Verify the trip exists before triggering generation
      console.log('Verifying trip exists...');
      const { data: verifyTrip, error: verifyError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', trip.id)
        .single();

      if (verifyError || !verifyTrip) {
        console.error('Error verifying trip:', verifyError);
        throw new Error('Failed to verify trip creation');
      }

      // Add a small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger the background generation
      console.log('Triggering background generation...');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId: trip.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to trigger generation:', errorData);
        throw new Error('Failed to trigger generation: ' + (errorData.error || 'Unknown error'));
      }

      // Navigate to the trip page
      console.log('Navigating to trip page...');
      router.push(`/trips/${trip.id}`);

      toast({
        title: 'Itinerary created!',
        description: 'Generating your personalized travel plan...',
      });
    } catch (error: any) {
      console.error('Error creating itinerary:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create itinerary',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleDestinationChange = (e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value);
  const handleInterestsChange = (e: ChangeEvent<HTMLTextAreaElement>) => setInterests(e.target.value);
  const handlePreferencesChange = (e: ChangeEvent<HTMLTextAreaElement>) => setPreferences(e.target.value);
  const handleDateRangeChange = (range: DateRange) => setDateRange(range);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
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
        <h1 className="text-3xl font-bold mb-8">Create Your Travel Itinerary</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="destinations">Destination</Label>
                <div className="flex gap-2">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="destinations"
                    placeholder="e.g., Paris, France"
                    value={destination}
                    onChange={handleDestinationChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Travel Dates</Label>
                <div className="flex gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <DatePickerWithRange
                    value={dateRange}
                    onChange={handleDateRangeChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests & Activities</Label>
                <Textarea
                  id="interests"
                  placeholder="Tell us what you enjoy: museums, outdoor activities, food experiences, etc."
                  className="min-h-[100px]"
                  value={interests}
                  onChange={handleInterestsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferences">Special Preferences</Label>
                <Textarea
                  id="preferences"
                  placeholder="Any dietary restrictions, accessibility needs, or specific requirements?"
                  className="min-h-[100px]"
                  value={preferences}
                  onChange={handlePreferencesChange}
                />
              </div>

              <Button type="submit" className="w-full">
                Generate Itinerary
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tips for Better Results</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Be specific about your destination</li>
                <li>• Include your preferred activities and interests</li>
                <li>• Mention any must-see attractions</li>
                <li>• Specify your travel style (luxury, budget, adventure, etc.)</li>
                <li>• Include any dietary restrictions or accessibility needs</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">What You&apos;ll Get</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Day-by-day itinerary</li>
                <li>• Recommended attractions and activities</li>
                <li>• Estimated timings and durations</li>
                <li>• Restaurant recommendations</li>
                <li>• Exportable PDF format</li>
                <li>• Shareable link for collaboration</li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
