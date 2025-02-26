export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination: string
          start_date: string
          end_date: string
          budget: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination: string
          start_date: string
          end_date: string
          budget?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination?: string
          start_date?: string
          end_date?: string
          budget?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      itineraries: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          generated_content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_number: number
          generated_content: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_number?: number
          generated_content?: Json
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          itinerary_id: string
          name: string
          time: string
          location: string | null
          description: string | null
          duration: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          name: string
          time: string
          location?: string | null
          description?: string | null
          duration?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          name?: string
          time?: string
          location?: string | null
          description?: string | null
          duration?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preference_type: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_type: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_type?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}