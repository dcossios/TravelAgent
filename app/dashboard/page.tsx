import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Share2 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user's saved trips
  const { data: savedTrips } = await supabase
    .from("saved_trips")
    .select(`
      *,
      trips (
        id,
        destination,
        start_date,
        end_date,
        status
      )
    `)
    .eq("user_id", session.user.id);

  // Fetch shared trips
  const { data: sharedTrips } = await supabase
    .from("shared_trips")
    .select(`
      *,
      trips (
        id,
        destination,
        start_date,
        end_date,
        status
      )
    `)
    .eq("shared_with", session.user.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

      <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">My Saved Trips</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedTrips?.map((saved) => (
              <Card key={saved.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize">
                        {saved.trips.destination}
                      </CardTitle>
                      <CardDescription>
                        {new Date(saved.trips.start_date).toLocaleDateString()} -{" "}
                        {new Date(saved.trips.end_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Trip
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Remove from Dashboard
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      Status: {saved.trips.status}
                    </span>
                    <Button asChild>
                      <Link href={`/trips/${saved.trips.id}`}>View Trip</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shared With Me</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedTrips?.map((shared) => (
              <Card key={shared.id}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {shared.trips.destination}
                  </CardTitle>
                  <CardDescription>
                    {new Date(shared.trips.start_date).toLocaleDateString()} -{" "}
                    {new Date(shared.trips.end_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      Status: {shared.trips.status}
                    </span>
                    <Button asChild>
                      <Link href={`/trips/${shared.trips.id}`}>View Trip</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 