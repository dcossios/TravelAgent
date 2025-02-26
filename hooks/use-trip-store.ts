import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type Trip = Database['public']['Tables']['trips']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];
type Itinerary = Database['public']['Tables']['itineraries']['Row'];

interface TripState {
  currentTrip: Trip | null;
  itineraries: Itinerary[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  setCurrentTrip: (trip: Trip | null) => void;
  setItineraries: (itineraries: Itinerary[]) => void;
  setActivities: (activities: Activity[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchTripData: (tripId: string) => Promise<void>;
  updateActivity: (activity: Partial<Activity> & { id: string }) => Promise<void>;
  createActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteActivity: (activityId: string) => Promise<void>;
  reorderActivities: (activities: { id: string; order: number }[]) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  itineraries: [],
  activities: [],
  isLoading: false,
  error: null,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setItineraries: (itineraries) => set({ itineraries }),
  setActivities: (activities) => set({ activities }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchTripData: async (tripId: string) => {
    if (!supabase) return;
    
    set({ isLoading: true, error: null });
    try {
      // Fetch trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      // Fetch itineraries
      const { data: itineraries, error: itinerariesError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');

      if (itinerariesError) throw itinerariesError;

      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .in('itinerary_id', itineraries.map(i => i.id))
        .order('order');

      if (activitiesError) throw activitiesError;

      set({
        currentTrip: trip,
        itineraries: itineraries,
        activities: activities,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateActivity: async (activity) => {
    if (!supabase) return;
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(activity)
        .eq('id', activity.id)
        .select()
        .single();

      if (error) throw error;

      const activities = get().activities.map(a =>
        a.id === activity.id ? { ...a, ...data } : a
      );

      set({ activities, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createActivity: async (activity) => {
    if (!supabase) return;
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;

      set({
        activities: [...get().activities, data],
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteActivity: async (activityId) => {
    if (!supabase) return;
    
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      set({
        activities: get().activities.filter(a => a.id !== activityId),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  reorderActivities: async (activities) => {
    if (!supabase) return;
    
    set({ isLoading: true, error: null });
    try {
      const updates = activities.map(({ id, order }) => ({
        id,
        order,
      }));

      const { error } = await supabase
        .from('activities')
        .upsert(updates);

      if (error) throw error;

      const currentActivities = get().activities;
      const updatedActivities = currentActivities.map(activity => {
        const update = activities.find(a => a.id === activity.id);
        return update ? { ...activity, order: update.order } : activity;
      });

      set({
        activities: updatedActivities,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));