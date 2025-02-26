from fastapi import FastAPI, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from supabase import create_client, Client
import openai
import os
from dotenv import load_dotenv
from datetime import datetime
import jwt

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
IS_DEVELOPMENT = os.getenv("ENVIRONMENT") == "development"

print("Initializing with:", {
    "SUPABASE_URL": SUPABASE_URL,
    "SUPABASE_KEY": SUPABASE_KEY[:10] + "...",  # Only show first 10 chars for security
    "OPENAI_API_KEY": "..." if OPENAI_API_KEY else None,
    "ENVIRONMENT": "development" if IS_DEVELOPMENT else "production"
})

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = openai.OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# Data models
class TripCreate(BaseModel):
    user_id: str
    destination: str
    start_date: str
    end_date: str
    budget: float | None = None

class ItineraryGenerate(BaseModel):
    trip_id: str
    days: int

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    try:
        # Extract token from Bearer format
        token = authorization.split(" ")[1]
        
        # If it's the service role key, return a special admin user ID
        if token == SUPABASE_KEY:
            return "service_role"
            
        # Otherwise verify and decode the JWT token
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded.get("sub")  # This is the user ID in Supabase
    except Exception as e:
        print(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

def get_trip(trip_id: str, user_id: str):
    print(f"Fetching trip with ID: {trip_id} for user: {user_id}")
    try:
        # If user_id is service_role, don't filter by user_id
        query = supabase.table("trips").select("*").eq("id", trip_id)
        if user_id != "service_role":
            query = query.eq("user_id", user_id)
            
        response = query.single().execute()
        print("Trip fetch response:", response)
        if response.data:
            return response.data
        raise HTTPException(status_code=404, detail="Trip not found")
    except Exception as e:
        print(f"Error fetching trip: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch trip: {str(e)}")

def get_mock_itinerary(destination: str, days: int) -> dict:
    return {
        "content": f"""Here's your {days}-day itinerary for {destination}:

Day 1:
- Morning: Arrive and check into your hotel
- Afternoon: Walking tour of the city center
- Evening: Welcome dinner at a local restaurant

Day 2:
- Morning: Visit main tourist attractions
- Afternoon: Shopping and local markets
- Evening: Cultural show or performance

[... Additional days would be generated here ...]

Final Day:
- Morning: Last-minute shopping
- Afternoon: Pack and prepare for departure
- Evening: Farewell dinner

Note: This is a mock itinerary for development purposes.""",
        "interests": ["Sightseeing", "Local Culture", "Food & Dining", "Shopping"],
        "preferences": ["Moderate pace", "Mix of activities", "Local experiences"],
        "status": "completed",
        "day": 1
    }

@app.post("/trips/")
async def create_trip(trip: TripCreate, user_id: str = Depends(get_current_user)):
    print(f"Creating trip for user {user_id}:", trip.dict())
    try:
        data = trip.dict()
        data["user_id"] = user_id  # Override with authenticated user ID
        response = supabase.table("trips").insert(data).execute()
        
        print("Supabase response:", response)
        
        if response.data and len(response.data) > 0:
            return {"message": "Trip created successfully", "trip_id": response.data[0]["id"]}
        
        raise HTTPException(status_code=400, detail=f"Failed to create trip: {response}")
    except Exception as e:
        print(f"Error creating trip: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create trip: {str(e)}")

@app.post("/generate-itinerary/")
async def generate_itinerary(request: ItineraryGenerate, user_id: str = Depends(get_current_user)):
    try:
        print(f"Generating itinerary for trip {request.trip_id}, {request.days} days")
        
        # Get trip details
        trip = get_trip(request.trip_id, user_id)
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        print("Retrieved trip:", trip)

        # Get existing itineraries
        itineraries_response = supabase.table("itineraries").select("*").eq("trip_id", request.trip_id).execute()
        if not itineraries_response.data:
            raise HTTPException(status_code=404, detail="No itineraries found for this trip")
        print("Retrieved itineraries:", itineraries_response.data)

        # Generate content
        if IS_DEVELOPMENT:
            print("Using mock response in development mode")
            mock_response = get_mock_itinerary(trip['destination'], request.days)
            generated_content = mock_response
        else:
            # Generate with GPT-3.5
            prompt = f"Generate a {request.days}-day itinerary for a trip to {trip['destination']}."
            if trip.get('budget'):
                prompt += f" Budget: {trip['budget']} USD."
                
            print("Sending prompt to GPT-3.5:", prompt)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a travel assistant. Generate a detailed day-by-day itinerary."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            print("GPT-3.5 response received")
            generated_content = {
                "content": response.choices[0].message.content,
                "interests": ["Sightseeing", "Local Culture", "Food & Dining"],
                "preferences": ["Moderate pace", "Mix of activities"],
                "status": "completed",
                "day": 1
            }
        
        # Update existing itineraries in Supabase
        print("Updating itineraries in Supabase")
        
        for itinerary in itineraries_response.data:
            update_data = {
                "generated_content": generated_content
            }
            
            update_response = supabase.table("itineraries").update(update_data).eq("id", itinerary["id"]).execute()
            print(f"Supabase update response for itinerary {itinerary['id']}:", update_response)
            
            if not update_response.data:
                raise HTTPException(status_code=500, detail=f"Failed to update itinerary {itinerary['id']}")
        
        # Update trip status
        trip_update = supabase.table("trips").update({"status": "completed"}).eq("id", request.trip_id).execute()
        print("Trip status update response:", trip_update)
        
        return {"message": "Itinerary generated", "content": generated_content}
    except Exception as e:
        print(f"Error generating itinerary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))