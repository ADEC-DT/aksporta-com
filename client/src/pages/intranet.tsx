import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock,
  Ticket,
  Headphones,
  Plus,
  Loader2
} from "lucide-react";

export default function IntranetPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("it");

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string; priority: string; category: string }) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      toast({ title: "Ticket Created", description: "Your support ticket has been submitted successfully." });
      setSubject("");
      setDescription("");
      setPriority("medium");
      setCategory("it");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create ticket", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitTicket = () => {
    if (!subject.trim() || !description.trim()) {
      toast({ title: "Missing information", description: "Please fill in subject and description", variant: "destructive" });
      return;
    }
    createTicketMutation.mutate({ subject, description, priority, category });
  };

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

      <Card 
        className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 hover-elevate cursor-pointer"
        onClick={() => setDialogOpen(true)}
        data-testid="button-create-ticket"
      >
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Create New Ticket
            </DialogTitle>
            <DialogDescription>
              Submit a new support request. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">IT Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority" data-testid="select-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Brief description of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide details about your request..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTicket} 
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
