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
import { Search, Download, FileText, Users, Loader2, Store, CircleDot, Briefcase, Upload, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@shared/schema";
import { useRef } from "react";

const businessUnits = [
  { id: "mall", name: "Boutique Mall", icon: Store },
  { id: "equestrian", name: "Equestrian Center", icon: CircleDot },
  { id: "corporate", name: "Corporate", icon: Briefcase },
];

export default function CustomerDBPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "result">("upload");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [filePreview, setFilePreview] = useState<Record<string, string>[]>([]);
  const [fileTotalRows, setFileTotalRows] = useState(0);
  const [fileData, setFileData] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({ firstName: "", lastName: "", contact: "", email: "", source: "" });
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

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/customers/import/preview", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to parse file");
      }
      return res.json() as Promise<{ columns: string[]; preview: Record<string, string>[]; totalRows: number; fileData: string }>;
    },
    onSuccess: (data) => {
      setFileColumns(data.columns);
      setFilePreview(data.preview);
      setFileTotalRows(data.totalRows);
      setFileData(data.fileData);
      setColumnMapping({ firstName: "", lastName: "", contact: "", email: "", source: "" });
      setImportStep("mapping");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to read file", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { fileData: string; mapping: Record<string, string> }) => {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setImportStep("result");
      toast({
        title: "Import completed",
        description: `${data.imported} customers imported, ${data.skipped} skipped.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    previewMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportSubmit = () => {
    if (!columnMapping.firstName) {
      toast({ title: "First Name is required", description: "Please select which column maps to First Name", variant: "destructive" });
      return;
    }
    importMutation.mutate({ fileData, mapping: columnMapping });
  };

  const resetImportDialog = () => {
    setImportStep("upload");
    setFileColumns([]);
    setFilePreview([]);
    setFileTotalRows(0);
    setFileData("");
    setColumnMapping({ firstName: "", lastName: "", contact: "", email: "", source: "" });
    setImportResult(null);
  };

  const customers = data?.customers || [];
  const totalCustomers = data?.total || 0;
  const mallCount = customers.filter((c) => c.primaryUnit === "Boutique Mall").length;
  const equestrianCount = customers.filter((c) => c.primaryUnit === "Equestrian Center").length;
  const corporateCount = customers.filter((c) => c.primaryUnit === "Corporate").length;

  const exportToCSV = () => {
    const headers = ["ID", "First Name", "Last Name", "Type", "Primary Unit", "Contact", "Email"];
    const csvContent = [
      headers.join(","),
      ...customers.map((c) =>
        [c.externalCode, `"${c.firstName}"`, `"${c.lastName}"`, c.type, `"${c.primaryUnit}"`, c.contact, c.email].join(",")
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
                  <th>First Name</th>
                  <th>Last Name</th>
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
                    <td>${c.firstName}</td>
                    <td>${c.lastName}</td>
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
            onClick={() => { resetImportDialog(); setImportDialogOpen(true); }}
            disabled={previewMutation.isPending}
            data-testid="button-import-file"
          >
            {previewMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import File
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImportDialog(); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {importStep === "upload" && "Import Customers from Excel"}
                  {importStep === "mapping" && "Map Columns"}
                  {importStep === "result" && "Import Results"}
                </DialogTitle>
                <DialogDescription>
                  {importStep === "upload" && "Upload an Excel file (.xlsx, .xls, .csv) with customer data."}
                  {importStep === "mapping" && `File loaded with ${fileTotalRows} rows. Select which column from your file maps to each field.`}
                  {importStep === "result" && "Import has been completed."}
                </DialogDescription>
              </DialogHeader>

              {importStep === "upload" && (
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
                      disabled={previewMutation.isPending}
                      data-testid="button-select-file"
                    >
                      {previewMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading file...</>
                      ) : (
                        <>Select File</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {importStep === "mapping" && (
                <div className="space-y-4 py-4">
                  <div className="grid gap-3">
                    {[
                      { key: "firstName", label: "First Name", required: true },
                      { key: "lastName", label: "Last Name", required: false },
                      { key: "contact", label: "Phone Number", required: false },
                      { key: "email", label: "Email", required: false },
                      { key: "source", label: "Resource", required: false },
                    ].map((field) => (
                      <div key={field.key} className="grid grid-cols-[140px_1fr] items-center gap-3">
                        <Label className="text-sm font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={columnMapping[field.key] || "__none__"}
                          onValueChange={(v) => setColumnMapping({ ...columnMapping, [field.key]: v === "__none__" ? "" : v })}
                        >
                          <SelectTrigger data-testid={`select-map-${field.key}`}>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">-- Skip --</SelectItem>
                            {fileColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {filePreview.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Preview (first {filePreview.length} rows):</p>
                      <div className="border rounded-lg overflow-auto max-h-48">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {fileColumns.map((col) => (
                                <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filePreview.map((row, i) => (
                              <TableRow key={i}>
                                {fileColumns.map((col) => (
                                  <TableCell key={col} className="text-xs py-1 whitespace-nowrap">{row[col]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importStep === "result" && importResult && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{importResult.imported}</p>
                      <p className="text-xs text-muted-foreground">Imported</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{importResult.skipped}</p>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{importResult.totalRows}</p>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto border rounded-lg p-3">
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

              <DialogFooter>
                {importStep === "mapping" && (
                  <>
                    <Button variant="outline" onClick={() => setImportStep("upload")} data-testid="button-back-upload">
                      Back
                    </Button>
                    <Button
                      onClick={handleImportSubmit}
                      disabled={!columnMapping.firstName || importMutation.isPending}
                      data-testid="button-start-import"
                    >
                      {importMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                      ) : (
                        <>Import {fileTotalRows} rows</>
                      )}
                    </Button>
                  </>
                )}
                {importStep === "result" && (
                  <Button onClick={() => { setImportDialogOpen(false); resetImportDialog(); }} data-testid="button-close-import">
                    Close
                  </Button>
                )}
                {importStep === "upload" && (
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)} data-testid="button-cancel-import">
                    Cancel
                  </Button>
                )}
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
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Resource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                        {customer.firstName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.lastName}</TableCell>
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
