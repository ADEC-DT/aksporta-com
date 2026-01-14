import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Download, FileText, Users, Building2, User, Plus } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  type: string;
  primaryUnit: string;
  contact: string;
  email: string;
  dob: string;
  gender: string;
  nationality: string;
  occupation: string;
};

const initialCustomers: Customer[] = [
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

const emptyForm = {
  name: "",
  type: "Individual",
  primaryUnit: "",
  contact: "",
  email: "",
  dob: "",
  gender: "",
  nationality: "",
  occupation: "",
};

export default function CustomerDBPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const handleAddCustomer = () => {
    const newId = `C${String(customers.length + 1).padStart(3, "0")}`;
    const newCustomer: Customer = {
      id: newId,
      name: formData.name,
      type: formData.type,
      primaryUnit: formData.primaryUnit,
      contact: formData.contact,
      email: formData.email,
      dob: formData.dob || "N/A",
      gender: formData.gender || "N/A",
      nationality: formData.nationality,
      occupation: formData.occupation,
    };
    setCustomers([...customers, newCustomer]);
    setFormData(emptyForm);
    setDialogOpen(false);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = customers.length;
  const individualCount = customers.filter((c) => c.type === "Individual").length;
  const corporateCount = customers.filter((c) => c.type === "Corporate").length;

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Type", "Primary Unit", "Contact", "Email"];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map((c) =>
        [c.id, `"${c.name}"`, c.type, `"${c.primaryUnit}"`, c.contact, c.email].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Master Customer Database</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>Master Customer Database</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Primary Unit</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                ${filteredCustomers
                  .map(
                    (c) => `
                  <tr>
                    <td>${c.name}</td>
                    <td>${c.type}</td>
                    <td>${c.primaryUnit}</td>
                    <td>${c.contact}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Master Customer Database</h1>
          <p className="text-muted-foreground">View and manage all customer records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="w-[280px] pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-customers"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} data-testid="button-export-csv">
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} data-testid="button-export-pdf">
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-customer">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the customer details below to add them to the database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="select-customer-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Phone *</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+1 555-0100"
                      data-testid="input-customer-contact"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryUnit">Primary Unit *</Label>
                    <Input
                      id="primaryUnit"
                      value={formData.primaryUnit}
                      onChange={(e) => setFormData({ ...formData, primaryUnit: e.target.value })}
                      placeholder="Unit 100A"
                      data-testid="input-customer-unit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      placeholder="DD/MM/YYYY"
                      data-testid="input-customer-dob"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger data-testid="select-customer-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="United States"
                      data-testid="input-customer-nationality"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Software Engineer"
                    data-testid="input-customer-occupation"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-add">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomer}
                  disabled={!formData.name || !formData.email || !formData.contact || !formData.primaryUnit || !formData.nationality || !formData.occupation}
                  data-testid="button-submit-customer"
                >
                  Add Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="stat-total-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-individual-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{individualCount}</p>
              <p className="text-sm text-muted-foreground">Individual</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-corporate-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{corporateCount}</p>
              <p className="text-sm text-muted-foreground">Corporate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Customer Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Primary Unit</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No customers found matching your search
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell>
                      <Link
                        href={`/applications/customer-db/${customer.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        data-testid={`link-customer-${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          customer.type === "Corporate"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                        }
                      >
                        {customer.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.primaryUnit}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.contact}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
