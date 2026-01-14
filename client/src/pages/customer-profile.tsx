import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Phone, Mail, Calendar, Users, Globe, Briefcase, Building2 } from "lucide-react";

const customers = [
  { id: "C001", name: "John Anderson", type: "Individual", primaryUnit: "Unit 101A", contact: "+1 555-0101", email: "john.anderson@email.com", dob: "15/03/1985", gender: "Male", nationality: "United States", occupation: "Software Engineer" },
  { id: "C002", name: "Sarah Mitchell", type: "Individual", primaryUnit: "Unit 205B", contact: "+1 555-0102", email: "sarah.mitchell@email.com", dob: "22/07/1990", gender: "Female", nationality: "Canada", occupation: "Marketing Manager" },
  { id: "C003", name: "Apex Industries Ltd", type: "Corporate", primaryUnit: "Suite 300", contact: "+1 555-0103", email: "info@apexindustries.com", dob: "N/A", gender: "N/A", nationality: "United Kingdom", occupation: "Manufacturing" },
  { id: "C004", name: "Michael Chen", type: "Individual", primaryUnit: "Unit 412C", contact: "+1 555-0104", email: "m.chen@email.com", dob: "08/11/1978", gender: "Male", nationality: "Singapore", occupation: "Financial Analyst" },
  { id: "C005", name: "Global Solutions Inc", type: "Corporate", primaryUnit: "Floor 5", contact: "+1 555-0105", email: "contact@globalsolutions.com", dob: "N/A", gender: "N/A", nationality: "Germany", occupation: "Consulting" },
  { id: "C006", name: "Emily Rodriguez", type: "Individual", primaryUnit: "Unit 108D", contact: "+1 555-0106", email: "emily.r@email.com", dob: "30/05/1992", gender: "Female", nationality: "Mexico", occupation: "Architect" },
  { id: "C007", name: "David Thompson", type: "Individual", primaryUnit: "Unit 315A", contact: "+1 555-0107", email: "d.thompson@email.com", dob: "12/09/1982", gender: "Male", nationality: "Australia", occupation: "Doctor" },
  { id: "C008", name: "TechStart Corp", type: "Corporate", primaryUnit: "Suite 450", contact: "+1 555-0108", email: "hello@techstart.io", dob: "N/A", gender: "N/A", nationality: "United States", occupation: "Technology" },
  { id: "C009", name: "Lisa Park", type: "Individual", primaryUnit: "Unit 220B", contact: "+1 555-0109", email: "lisa.park@email.com", dob: "25/01/1988", gender: "Female", nationality: "South Korea", occupation: "Designer" },
  { id: "C010", name: "Robert Williams", type: "Individual", primaryUnit: "Unit 505E", contact: "+1 555-0110", email: "r.williams@email.com", dob: "18/06/1975", gender: "Male", nationality: "United States", occupation: "Lawyer" },
];

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id;

  const customer = customers.find((c) => c.id === customerId);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 h-[50vh]">
        <h2 className="text-xl font-semibold">Customer Not Found</h2>
        <p className="text-muted-foreground">The customer record you're looking for doesn't exist.</p>
        <Link href="/applications/customer-db">
          <Button data-testid="button-back-to-list">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  const isIndividual = customer.type === "Individual";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/applications/customer-db">
          <Button variant="ghost" size="icon" data-testid="button-back-to-list">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Customer Profile</h1>
          <p className="text-muted-foreground">View detailed customer information</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isIndividual ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}>
              {isIndividual ? (
                <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              ) : (
                <Building2 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <Badge
                className={`mt-2 ${
                  isIndividual
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0"
                }`}
              >
                {customer.type}
              </Badge>
            </div>
            <Separator className="my-2" />
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.contact}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="break-all">{customer.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Full Name</span>
                </div>
                <p className="font-medium" data-testid="text-customer-name">{customer.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone Number</span>
                </div>
                <p className="font-medium" data-testid="text-customer-phone">{customer.contact}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </div>
                <p className="font-medium" data-testid="text-customer-email">{customer.email}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date of Birth</span>
                </div>
                <p className="font-medium" data-testid="text-customer-dob">{customer.dob}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Gender</span>
                </div>
                <p className="font-medium" data-testid="text-customer-gender">{customer.gender}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Country of Nationality</span>
                </div>
                <p className="font-medium" data-testid="text-customer-nationality">{customer.nationality}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Occupation</span>
                </div>
                <p className="font-medium" data-testid="text-customer-occupation">{customer.occupation}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Primary Unit</span>
                </div>
                <p className="font-medium" data-testid="text-customer-unit">{customer.primaryUnit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start">
        <Link href="/applications/customer-db">
          <Button variant="outline" data-testid="button-back-to-list-bottom">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>
    </div>
  );
}
