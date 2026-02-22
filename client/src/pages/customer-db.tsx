import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

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
import { Search, Download, FileText, Users, Building2, User, Plus, Loader2, Store, CircleDot, Briefcase, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, CustomerWithProfile } from "@shared/schema";
import { useRef } from "react";

const businessUnits = [
  { id: "mall", name: "Boutique Mall", icon: Store },
  { id: "equestrian", name: "Equestrian Center", icon: CircleDot },
  { id: "corporate", name: "Corporate", icon: Briefcase },
];

const emptyForm = {
  name: "",
  type: "Individual",
  primaryUnit: "Boutique Mall",
  contact: "",
  email: "",
  externalCode: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  occupation: "",
};

export default function CustomerDBPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; totalRows: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: ["/api/customers", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/customers?search=${encodeURIComponent(searchQuery)}`
        : "/api/customers";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCustomer: typeof formData) => {
      return apiRequest("POST", "/api/customers", newCustomer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"], refetchType: "all" });
      setFormData(emptyForm);
      setDialogOpen(false);
      toast({
        title: "Customer created",
        description: "The customer has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"], refetchType: "all" });
      setImportResult(data);
      toast({
        title: "Import completed",
        description: `${data.imported} customers imported, ${data.skipped} skipped.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    importMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddCustomer = () => {
    const code = `C${String(Date.now()).slice(-6)}`;
    createMutation.mutate({
      ...formData,
      externalCode: code,
    });
  };

  const customers = data?.customers || [];
  const totalCustomers = data?.total || 0;
  const mallCount = customers.filter((c) => c.primaryUnit === "Boutique Mall").length;
  const equestrianCount = customers.filter((c) => c.primaryUnit === "Equestrian Center").length;
  const corporateCount = customers.filter((c) => c.primaryUnit === "Corporate").length;

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Type", "Primary Unit", "Contact", "Email"];
    const csvContent = [
      headers.join(","),
      ...customers.map((c) =>
        [c.externalCode, `"${c.name}"`, c.type, `"${c.primaryUnit}"`, c.contact, c.email].join(",")
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
                ${customers
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Master Customer Database</h1>
          <p className="text-muted-foreground">View and manage all customer records</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
            data-testid="input-import-file"
          />
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            disabled={importMutation.isPending}
            data-testid="button-import-file"
          >
            {importMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import File
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResult(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Customers from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx, .xls) with customer data. The file should have columns for: Customer Name, Phone Number, Email, and Resource/Source.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to select an Excel file</p>
                    <p className="text-xs text-muted-foreground mt-1">Supported formats: .xlsx, .xls, .csv (max 10MB)</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importMutation.isPending}
                    data-testid="button-select-file"
                  >
                    {importMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                    ) : (
                      <>Select File</>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-sm">Expected columns:</p>
                  <p>- <strong>Customer Name</strong> (required)</p>
                  <p>- <strong>Phone Number</strong> / Mobile / Contact</p>
                  <p>- <strong>Email</strong> (required)</p>
                  <p>- <strong>Resource</strong> / Source / Channel (where the customer came from)</p>
                </div>

                {importResult && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Import Results</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{importResult.imported}</p>
                        <p className="text-xs text-muted-foreground">Imported</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{importResult.skipped}</p>
                        <p className="text-xs text-muted-foreground">Skipped</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{importResult.totalRows}</p>
                        <p className="text-xs text-muted-foreground">Total Rows</p>
                      </div>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-1 text-yellow-700 dark:text-yellow-400">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportResult(null); }} data-testid="button-close-import">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <Label htmlFor="primaryUnit">Business Unit *</Label>
                    <Select
                      value={formData.primaryUnit}
                      onValueChange={(value) => setFormData({ ...formData, primaryUnit: value })}
                    >
                      <SelectTrigger data-testid="select-customer-unit">
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.name}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                  disabled={!formData.name || !formData.email || !formData.contact || !formData.primaryUnit || !formData.nationality || !formData.occupation || createMutation.isPending}
                  data-testid="button-submit-customer"
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totalCustomers}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-mall-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Store className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{mallCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Boutique Mall</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-equestrian-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CircleDot className="h-6 w-6 text-green-600" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{equestrianCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Equestrian</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-corporate-customers">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{corporateCount}</p>
              )}
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
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Business Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No customers found matching your search" : "No customers yet. Add your first customer or import from an Excel file."}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
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
                    <TableCell className="text-muted-foreground">{customer.contact}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                    <TableCell>
                      {customer.source ? (
                        <Badge variant="outline" className="text-xs">
                          {customer.source}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
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
                    <TableCell>
                      <Badge
                        className={
                          customer.primaryUnit === "Corporate"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0"
                            : customer.primaryUnit === "Equestrian Center"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                            : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-0"
                        }
                      >
                        {customer.primaryUnit}
                      </Badge>
                    </TableCell>
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
