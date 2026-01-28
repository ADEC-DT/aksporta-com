import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Shield, 
  FileText, 
  Palette,
  ChevronRight,
  Clock,
  Download,
  Ticket,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const categories = [
  { id: "hr", name: "HR Policies", count: 12, icon: Users, iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-900/30" },
  { id: "security", name: "IT & Security", count: 8, icon: Shield, iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { id: "procurement", name: "Procurement Guidelines", count: 5, icon: FileText, iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
  { id: "branding", name: "Corporate Branding", count: 3, icon: Palette, iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
];

const recentDocuments = [
  { id: 1, name: "2026 Employee Handbook", type: "PDF", size: "2.4 MB", date: "Jan 10, 2026" },
  { id: 2, name: "Remote Work Guidelines", type: "PDF", size: "1.1 MB", date: "Jan 08, 2026" },
  { id: 3, name: "Travel Expense Policy v2", type: "DOCX", size: "850 KB", date: "Jan 05, 2026" },
  { id: 4, name: "Brand Assets & Logos", type: "ZIP", size: "43 MB", date: "Dec 28, 2025" },
];

const announcements = [
  { 
    id: 1, 
    title: "System Maintenance: NetSuite", 
    content: "Planned downtime this Saturday from 2:00 AM to 6:00 AM for quarterly updates.",
    time: "2 hours ago",
    isNew: true
  },
  { 
    id: 2, 
    title: "Welcome New Chief Strategy Officer", 
    content: "We are pleased to announce the appointment of Sarah Jenkins as CSO effective next week.",
    time: "Yesterday",
    isNew: false
  },
];

export default function IntranetPage() {
  const { toast } = useToast();
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
            <Ticket className="h-8 w-8" />
            <h1 className="text-2xl font-bold font-outfit">Create Support Ticket</h1>
          </div>
          <p className="text-blue-100">
            Submit a new support request for IT, HR, or Facility Management issues.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">IT Support</SelectItem>
                      <SelectItem value="hr">HR Request</SelectItem>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
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
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>

              <Button 
                onClick={handleSubmitTicket} 
                disabled={createTicketMutation.isPending}
                className="w-full md:w-auto"
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
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Browse Categories
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((cat) => (
                <Card 
                  key={cat.id} 
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-category-${cat.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${cat.iconBg}`}>
                          <cat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{cat.name}</h3>
                          <p className="text-sm text-muted-foreground">{cat.count} articles</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Documents
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentDocuments.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                      data-testid={`doc-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {doc.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className={`h-2 w-2 rounded-full mt-2 ${announcement.isNew ? "bg-blue-500" : "bg-gray-400"}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">{announcement.time}</p>
                      <p className="font-medium text-sm">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" data-testid="button-view-announcements">
                View All Announcements
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">Include screenshots for IT issues</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">Set correct priority for faster response</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">Check existing tickets before creating new</p>
              </div>
            </CardContent>
          </Card>

          <Link href="/my-tickets">
            <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0 hover-elevate cursor-pointer">
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
        </div>
      </div>
    </div>
  );
}
