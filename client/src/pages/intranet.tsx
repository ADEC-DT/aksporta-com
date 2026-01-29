import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock,
  Ticket,
  Headphones,
  Plus
} from "lucide-react";

export default function IntranetPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Headphones className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">DT Support</h1>
          </div>
          <p className="text-blue-100">
            Your centralized hub for IT support and service requests.
          </p>
        </CardContent>
      </Card>

      <Link href="/tickets/new">
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 hover-elevate cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create New Ticket</h3>
              <p className="text-blue-100 text-sm">
                Submit a new support request for IT, HR, or Facility issues.
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <Link href="/my-tickets">
          <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0 hover-elevate cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 mb-4">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">View My Tickets</h3>
              <p className="text-green-100 text-sm">
                Track the status of your submitted support requests.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No announcements at this time.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
