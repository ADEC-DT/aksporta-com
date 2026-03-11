import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  SmStable,
  SmBox,
  SmHorse,
  SmCustomer,
  SmItemService,
  SmBillingElement,
  SmLiveryPackage,
  SmLiveryAgreement,
  SmInvoice,
} from "@shared/schema";
import { SearchableSelect } from "@/components/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Receipt,
  FileText,
  FilePlus,
  Settings,
  Users,
  Package,
  Shield,
  Cog,
  Plus,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Building,
  Box,
  DollarSign,
  Search,
  AlertCircle,
  Fence,
  Upload,
  Loader2,
} from "lucide-react";

function formatAED(cents: number): string {
  return `AED ${(cents / 100).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type NavItem = {
  id: string;
  label: string;
  icon?: typeof Calendar;
  children?: NavItem[];
};

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "MANAGEMENT",
    items: [
      {
        id: "activities",
        label: "Activities",
        icon: Calendar,
        children: [
          { id: "schedule", label: "Schedule", icon: Calendar },
          { id: "post-billing", label: "Post Billing Element", icon: Receipt },
        ],
      },
      {
        id: "livery",
        label: "Livery Agreements",
        icon: FileText,
        children: [
          { id: "agreements-list", label: "Agreements", icon: FileText },
          { id: "agreement-new", label: "New Agreement", icon: FilePlus },
          { id: "livery-packages", label: "Packages", icon: Settings },
        ],
      },
      { id: "horses", label: "Horses", icon: Fence },
      { id: "customers", label: "Customers", icon: Users },
      {
        id: "stable-section",
        label: "Stable",
        icon: Building,
        children: [
          { id: "stables", label: "Stables", icon: Building },
          { id: "boxes", label: "Boxes", icon: Box },
        ],
      },
      { id: "items", label: "Items", icon: Package },
      { id: "billing", label: "Billing", icon: DollarSign },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { id: "admin-users", label: "Users", icon: Shield },
      { id: "admin-settings", label: "Settings", icon: Cog },
    ],
  },
];

const ROUTE_MAP: Record<string, string> = {
  schedule: "schedule",
  "post-billing": "post-billing",
  "agreements-list": "agreements",
  "agreement-new": "agreement-new",
  "livery-packages": "livery-packages",
  horses: "horses",
  customers: "customers",
  stables: "stables",
  boxes: "boxes",
  items: "items",
  billing: "billing",
  "admin-users": "admin-users",
  "admin-settings": "admin-settings",
};

const REVERSE_ROUTE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([k, v]) => [v, k])
);

function SubSidebar({
  activeItem,
  onSelect,
  collapsed,
  onToggle,
}: {
  activeItem: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ activities: true, livery: true, "stable-section": true });

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div
      className={`flex flex-col border-r border-border bg-muted/30 dark:bg-muted/10 transition-all duration-200 ${collapsed ? "w-12" : "w-[220px]"} flex-shrink-0`}
      data-testid="sidebar-stable-master"
    >
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 border-b border-border">
          <div className="text-sm font-bold text-foreground">StableMaster</div>
          <div className="text-xs text-muted-foreground">Equestrian Management</div>
        </div>
      )}
      <div className="flex items-center justify-end px-1 py-1 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onToggle} data-testid="button-toggle-sidebar">
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  const isOpen = expanded[item.id] ?? false;
                  return (
                    <div key={item.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 px-4 h-7 text-xs text-muted-foreground rounded-none"
                        onClick={() => toggle(item.id)}
                        data-testid={`button-expand-${item.id}`}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span className="flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </Button>
                      {isOpen &&
                        item.children.map((child) => {
                          const CIcon = child.icon;
                          return (
                            <Button
                              key={child.id}
                              variant="ghost"
                              className={`w-full justify-start gap-2 pl-9 pr-4 h-7 text-xs rounded-none ${
                                activeItem === child.id
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground"
                              }`}
                              onClick={() => onSelect(child.id)}
                              data-testid={`button-nav-${child.id}`}
                            >
                              {CIcon && <CIcon className="h-3.5 w-3.5" />}
                              <span className="truncate">{child.label}</span>
                            </Button>
                          );
                        })}
                    </div>
                  );
                }
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start gap-2 px-4 h-7 text-xs rounded-none ${
                      activeItem === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => onSelect(item.id)}
                    data-testid={`button-nav-${item.id}`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SchedulePage() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Schedule</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground" data-testid="text-schedule-placeholder">Scheduled activities will be built later.</p>
      </CardContent>
    </Card>
  );
}

function StablesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: stables = [], isLoading } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });

  const resetForm = () => { setName(""); setNotes(""); setIsActive(true); setEditingId(null); };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/stables/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/stables", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/stables"] });
      toast({ title: editingId ? "Stable updated" : "Stable created" });
      setDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/stables/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/stables"] }); queryClient.invalidateQueries({ queryKey: ["/api/sm/boxes"] }); toast({ title: "Stable deleted" }); },
  });

  const openEdit = (s: SmStable) => {
    setEditingId(s.id); setName(s.name); setNotes(s.notes || ""); setIsActive(s.isActive); setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-stables-title">Stables</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-stable"><Plus className="h-4 w-4 mr-1" /> Add Stable</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="grid gap-4">
          {stables.map((s) => {
            const sBoxes = boxes.filter((b) => b.stableId === s.id);
            const available = sBoxes.filter((b) => b.status === "AVAILABLE").length;
            const occupied = sBoxes.filter((b) => b.status === "OCCUPIED").length;
            return (
              <Card key={s.id} data-testid={`card-stable-${s.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 py-3">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.isActive ? "default" : "secondary"} className="no-default-active-elevate">{s.isActive ? "Active" : "Inactive"}</Badge>
                    <span className="text-xs text-muted-foreground">{sBoxes.length} boxes ({available} avail, {occupied} occ)</span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)} data-testid={`button-edit-stable-${s.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} data-testid={`button-delete-stable-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
          {stables.length === 0 && <p className="text-center text-muted-foreground py-8">No stables found.</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Stable" : "Add Stable"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-stable-name" /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-stable-notes" /></div>
            <div className="flex items-center gap-2"><Label>Active</Label><Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-stable-active" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; } mutation.mutate({ name, notes: notes || null, isActive }); }} disabled={mutation.isPending} data-testid="button-submit-stable">{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoxesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stableId, setStableId] = useState("");
  const [boxType, setBoxType] = useState("STALL");
  const [status, setStatus] = useState("AVAILABLE");
  const [boxNotes, setBoxNotes] = useState("");
  const [filterStable, setFilterStable] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const { data: boxes = [], isLoading } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });

  const stableMap = useMemo(() => Object.fromEntries(stables.map((s) => [s.id, s])), [stables]);

  const filtered = useMemo(() => {
    return boxes.filter((b) => {
      if (filterStable && b.stableId !== filterStable) return false;
      if (filterType && b.boxType !== filterType) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      if (searchQ && !b.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [boxes, filterStable, filterType, filterStatus, searchQ]);

  const resetForm = () => { setName(""); setStableId(""); setBoxType("STALL"); setStatus("AVAILABLE"); setBoxNotes(""); setEditingId(null); };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/boxes/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/boxes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/boxes"] });
      toast({ title: editingId ? "Box updated" : "Box created" });
      setDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/boxes/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/boxes"] }); toast({ title: "Box deleted" }); },
  });

  const openEdit = (b: SmBox) => {
    setEditingId(b.id); setName(b.name); setStableId(b.stableId); setBoxType(b.boxType); setStatus(b.status); setBoxNotes(b.notes || ""); setDialogOpen(true);
  };

  const statusBadge = (s: string) => {
    if (s === "AVAILABLE") return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 no-default-active-elevate">Available</Badge>;
    if (s === "OCCUPIED") return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 no-default-active-elevate">Occupied</Badge>;
    if (s === "MAINTENANCE") return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 no-default-active-elevate">Maintenance</Badge>;
    return <Badge variant="secondary" className="no-default-active-elevate">{s}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-boxes-title">Boxes</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-box"><Plus className="h-4 w-4 mr-1" /> Add Box</Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative"><Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search boxes..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-7 h-9 w-[180px]" data-testid="input-search-boxes" /></div>
        <Select value={filterStable} onValueChange={setFilterStable}>
          <SelectTrigger className="w-[150px] h-9" data-testid="select-filter-stable"><SelectValue placeholder="All stables" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All stables</SelectItem>{stables.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] h-9" data-testid="select-filter-type"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="STALL">Stall</SelectItem><SelectItem value="PADDOCK">Paddock</SelectItem><SelectItem value="STORAGE">Storage</SelectItem></SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-filter-status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="AVAILABLE">Available</SelectItem><SelectItem value="OCCUPIED">Occupied</SelectItem><SelectItem value="MAINTENANCE">Maintenance</SelectItem></SelectContent>
        </Select>
        {(filterStable || filterType || filterStatus || searchQ) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStable(""); setFilterType(""); setFilterStatus(""); setSearchQ(""); }} data-testid="button-clear-filters">Clear</Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Name</th><th className="py-2 px-3">Stable</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Notes</th><th className="py-2 px-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border/50" data-testid={`row-box-${b.id}`}>
                  <td className="py-2 px-3 font-medium">{b.name}</td>
                  <td className="py-2 px-3">{stableMap[b.stableId]?.name || "-"}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="no-default-active-elevate">{b.boxType}</Badge></td>
                  <td className="py-2 px-3">{statusBadge(b.status)}</td>
                  <td className="py-2 px-3 text-xs max-w-[200px] truncate">{b.notes || "-"}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)} data-testid={`button-edit-box-${b.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)} data-testid={`button-delete-box-${b.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No boxes found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Box" : "Add Box"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-box-name" /></div>
            <div className="space-y-1">
              <Label>Stable *</Label>
              <Select value={stableId} onValueChange={setStableId}>
                <SelectTrigger data-testid="select-box-stable"><SelectValue placeholder="Select stable" /></SelectTrigger>
                <SelectContent>{stables.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Box Type</Label>
              <Select value={boxType} onValueChange={setBoxType}>
                <SelectTrigger data-testid="select-box-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="STALL">Stall</SelectItem><SelectItem value="PADDOCK">Paddock</SelectItem><SelectItem value="STORAGE">Storage</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-box-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="AVAILABLE">Available</SelectItem><SelectItem value="OCCUPIED">Occupied</SelectItem><SelectItem value="MAINTENANCE">Maintenance</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={boxNotes} onChange={(e) => setBoxNotes(e.target.value)} data-testid="input-box-notes" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim() || !stableId) { toast({ title: "Name and stable required", variant: "destructive" }); return; } mutation.mutate({ name, stableId, boxType, status, notes: boxNotes || null }); }} disabled={mutation.isPending} data-testid="button-submit-box">{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HorsesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [searchQ, setSearchQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "result">("upload");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [filePreview, setFilePreview] = useState<Record<string, string>[]>([]);
  const [fileTotalRows, setFileTotalRows] = useState(0);
  const [fileData, setFileData] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({ name: "", color: "", sex: "", dob: "", remarks: "", status: "" });
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; totalRows: number; errors: string[]; skipReasons?: { empty_row: number; duplicate_name: number; error: number } } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: horses = [], isLoading } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });

  const filtered = useMemo(() => {
    if (!searchQ) return horses;
    const q = searchQ.toLowerCase();
    return horses.filter((h) =>
      h.name.toLowerCase().includes(q) ||
      (h.color && h.color.toLowerCase().includes(q)) ||
      (h.sex && h.sex.toLowerCase().includes(q)) ||
      (h.status && h.status.toLowerCase().includes(q))
    );
  }, [horses, searchQ]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedHorses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const resetForm = () => { setName(""); setColor(""); setSex(""); setDob(""); setRemarks(""); setStatus("ACTIVE"); setEditingId(null); };

  const resetImportDialog = () => {
    setImportStep("upload");
    setFileColumns([]);
    setFilePreview([]);
    setFileTotalRows(0);
    setFileData("");
    setColumnMapping({ name: "", color: "", sex: "", dob: "", remarks: "", status: "" });
    setImportResult(null);
  };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/horses/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/horses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/horses"] });
      toast({ title: editingId ? "Horse updated" : "Horse created" });
      setDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/horses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/horses"] }); toast({ title: "Horse deleted" }); },
  });

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/sm/horses/import/preview", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to parse file"); }
      return res.json() as Promise<{ columns: string[]; preview: Record<string, string>[]; totalRows: number; fileData: string }>;
    },
    onSuccess: (data) => {
      setFileColumns(data.columns);
      setFilePreview(data.preview);
      setFileTotalRows(data.totalRows);
      setFileData(data.fileData);
      setColumnMapping({ name: "", color: "", sex: "", dob: "", remarks: "", status: "" });
      setImportStep("mapping");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to read file", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { fileData: string; mapping: Record<string, string> }) => {
      const res = await fetch("/api/sm/horses/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Import failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/horses"] });
      setImportResult(data);
      setImportStep("result");
      toast({ title: "Import completed", description: `${data.imported} horses imported, ${data.skipped} skipped.` });
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (h: SmHorse) => {
    setEditingId(h.id); setName(h.name); setColor(h.color || ""); setSex(h.sex || ""); setDob(h.dob || ""); setRemarks(h.remarks || ""); setStatus(h.status); setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    previewMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportSubmit = () => {
    if (!columnMapping.name) {
      toast({ title: "Horse name mapping is required", description: "Please map at least the Name column", variant: "destructive" });
      return;
    }
    importMutation.mutate({ fileData, mapping: columnMapping });
  };

  const HORSE_FIELDS = [
    { key: "name", label: "Name", required: true },
    { key: "color", label: "Color", required: false },
    { key: "sex", label: "Sex (Stallion/Mare/Gelding/Colt/Filly)", required: false },
    { key: "dob", label: "Date of Birth", required: false },
    { key: "remarks", label: "Remarks", required: false },
    { key: "status", label: "Status (Active/Inactive/Retired)", required: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-horses-title">Horses</h2>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} data-testid="input-horse-import-file" />
          <Button variant="outline" onClick={() => { resetImportDialog(); setImportDialogOpen(true); }} disabled={previewMutation.isPending} data-testid="button-import-horses">
            {previewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import Excel
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-horse"><Plus className="h-4 w-4 mr-1" /> Add Horse</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search horses..." value={searchQ} onChange={(e) => { setSearchQ(e.target.value); setCurrentPage(1); }} className="pl-7 h-9 w-[200px]" data-testid="input-search-horses" />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Name</th><th className="py-2 px-3">Color</th><th className="py-2 px-3">Sex</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Date of Birth</th><th className="py-2 px-3"></th>
            </tr></thead>
            <tbody>
              {paginatedHorses.map((h) => (
                <tr key={h.id} className="border-b border-border/50" data-testid={`row-horse-${h.id}`}>
                  <td className="py-2 px-3 font-medium">{h.name}</td>
                  <td className="py-2 px-3">{h.color || "-"}</td>
                  <td className="py-2 px-3">{h.sex || "-"}</td>
                  <td className="py-2 px-3"><Badge variant={h.status === "ACTIVE" ? "default" : "secondary"} className="no-default-active-elevate">{h.status}</Badge></td>
                  <td className="py-2 px-3">{h.dob || "-"}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(h)} data-testid={`button-edit-horse-${h.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(h.id)} data-testid={`button-delete-horse-${h.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{searchQ ? "No horses match your search." : "No horses found. Add manually or import from an Excel file."}</td></tr>}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground" data-testid="text-horses-showing">
                Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  data-testid="button-horses-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className="px-2 text-sm text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="min-w-[36px]"
                        onClick={() => setCurrentPage(p as number)}
                        data-testid={`button-horses-page-${p}`}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  data-testid="button-horses-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Horse" : "Add Horse"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-horse-name" /></div>
            <div className="space-y-1"><Label>Color</Label><Input value={color} onChange={(e) => setColor(e.target.value)} data-testid="input-horse-color" /></div>
            <div className="space-y-1">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger data-testid="select-horse-sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STALLION">Stallion</SelectItem><SelectItem value="MARE">Mare</SelectItem><SelectItem value="GELDING">Gelding</SelectItem><SelectItem value="COLT">Colt</SelectItem><SelectItem value="FILLY">Filly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} data-testid="input-horse-dob" /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-horse-remarks" /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-horse-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem><SelectItem value="RETIRED">Retired</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; } mutation.mutate({ name, color: color || null, sex: sex || null, dob: dob || null, remarks: remarks || null, status }); }} disabled={mutation.isPending} data-testid="button-submit-horse">{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImportDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {importStep === "upload" && "Import Horses from Excel"}
              {importStep === "mapping" && "Map Columns"}
              {importStep === "result" && "Import Results"}
            </DialogTitle>
            <DialogDescription>
              {importStep === "upload" && "Upload an Excel file (.xlsx, .xls, .csv) with horse data."}
              {importStep === "mapping" && `File loaded with ${fileTotalRows} rows. Select which column from your file maps to each horse field.`}
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
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={previewMutation.isPending} data-testid="button-select-horse-file">
                  {previewMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading file...</> : <>Select File</>}
                </Button>
              </div>
            </div>
          )}

          {importStep === "mapping" && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                {HORSE_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <Label className="text-sm font-medium shrink-0 w-[200px]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[field.key] || "__none__"}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [field.key]: v === "__none__" ? "" : v })}
                    >
                      <SelectTrigger data-testid={`select-horse-map-${field.key}`} className="w-[220px] overflow-hidden">
                        <SelectValue placeholder="Select column..." className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 max-w-[300px] overflow-y-auto" position="popper" sideOffset={4}>
                        <SelectItem value="__none__">-- Skip --</SelectItem>
                        {fileColumns.map((col) => (
                          <SelectItem key={col} value={col} className="truncate">{col}</SelectItem>
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
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-background">
                        <tr className="border-b border-border">
                          {fileColumns.map((col) => (
                            <th key={col} className="py-1.5 px-2 text-left whitespace-nowrap text-muted-foreground font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filePreview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {fileColumns.map((col) => (
                              <td key={col} className="py-1 px-2 whitespace-nowrap">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {importStep === "result" && importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-import-imported">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-import-skipped">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-import-total">{importResult.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
              </div>

              {importResult.skipped > 0 && importResult.skipReasons && (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Why were records skipped?</p>
                  <div className="space-y-2">
                    {importResult.skipReasons.duplicate_name > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Duplicate name (already in database)</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.duplicate_name}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${(importResult.skipReasons.duplicate_name / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {importResult.skipReasons.empty_row > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Empty row (no horse name)</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.empty_row}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500" style={{ width: `${(importResult.skipReasons.empty_row / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {importResult.skipReasons.error > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Import error</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.error}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-red-700" style={{ width: `${(importResult.skipReasons.error / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <details className="border rounded-lg">
                  <summary className="text-xs font-medium cursor-pointer px-3 py-2 text-muted-foreground">
                    Show detailed log ({importResult.errors.length} entries)
                  </summary>
                  <div className="text-xs space-y-1 max-h-40 overflow-y-auto px-3 pb-3">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1 text-yellow-700 dark:text-yellow-400">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === "mapping" && (
              <>
                <Button variant="outline" onClick={() => setImportStep("upload")} data-testid="button-horse-import-back">Back</Button>
                <Button onClick={handleImportSubmit} disabled={!columnMapping.name || importMutation.isPending} data-testid="button-horse-start-import">
                  {importMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <>Import {fileTotalRows} rows</>}
                </Button>
              </>
            )}
            {importStep === "result" && (
              <Button onClick={() => { setImportDialogOpen(false); resetImportDialog(); }} data-testid="button-horse-import-close">Close</Button>
            )}
            {importStep === "upload" && (
              <Button variant="outline" onClick={() => setImportDialogOpen(false)} data-testid="button-horse-import-cancel">Cancel</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const { data: customers = [], isLoading } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });

  const resetForm = () => { setName(""); setEmail(""); setPhone(""); setRemarks(""); setStatus("ACTIVE"); setEditingId(null); };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/customers/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/customers"] });
      toast({ title: editingId ? "Customer updated" : "Customer created" });
      setDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/customers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/customers"] }); toast({ title: "Customer deleted" }); },
  });

  const openEdit = (c: SmCustomer) => {
    setEditingId(c.id); setName(c.name); setEmail(c.email || ""); setPhone(c.phone || ""); setRemarks(c.remarks || ""); setStatus(c.status); setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-customers-title">Customers</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-customer"><Plus className="h-4 w-4 mr-1" /> Add Customer</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Name</th><th className="py-2 px-3">Email</th><th className="py-2 px-3">Phone</th><th className="py-2 px-3">Status</th><th className="py-2 px-3"></th>
            </tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50" data-testid={`row-customer-${c.id}`}>
                  <td className="py-2 px-3 font-medium">{c.name}</td>
                  <td className="py-2 px-3">{c.email || "-"}</td>
                  <td className="py-2 px-3">{c.phone || "-"}</td>
                  <td className="py-2 px-3"><Badge variant={c.status === "ACTIVE" ? "default" : "secondary"} className="no-default-active-elevate">{c.status}</Badge></td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} data-testid={`button-edit-customer-${c.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-customer-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-customer-name" /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-customer-email" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-customer-phone" /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-customer-remarks" /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-customer-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; } mutation.mutate({ name, email: email || null, phone: phone || null, remarks: remarks || null, status }); }} disabled={mutation.isPending} data-testid="button-submit-customer">{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemsPage() {
  const { toast } = useToast();
  const [searchQ, setSearchQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("");

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "mapping" | "result">("upload");
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [filePreview, setFilePreview] = useState<Record<string, string>[]>([]);
  const [fileTotalRows, setFileTotalRows] = useState(0);
  const [fileData, setFileData] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({ name: "", category: "", defaultUnit: "", unitPrice: "", isActive: "" });
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; totalRows: number; errors: string[]; skipReasons?: { empty_row: number; duplicate_name: number; error: number } } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCategory && filterCategory !== "all" && i.category !== filterCategory) return false;
      if (filterActive === "active" && !i.isActive) return false;
      if (filterActive === "inactive" && i.isActive) return false;
      if (searchQ && !i.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [items, filterCategory, filterActive, searchQ]);

  const resetImportDialog = () => {
    setImportStep("upload");
    setFileColumns([]);
    setFilePreview([]);
    setFileTotalRows(0);
    setFileData("");
    setColumnMapping({ name: "", category: "", defaultUnit: "", unitPrice: "", isActive: "" });
    setImportResult(null);
  };

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/sm/item-services/import/preview", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to parse file"); }
      return res.json() as Promise<{ columns: string[]; preview: Record<string, string>[]; totalRows: number; fileData: string }>;
    },
    onSuccess: (data) => {
      setFileColumns(data.columns);
      setFilePreview(data.preview);
      setFileTotalRows(data.totalRows);
      setFileData(data.fileData);
      setColumnMapping({ name: "", category: "", defaultUnit: "", unitPrice: "", isActive: "" });
      setImportStep("mapping");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to read file", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { fileData: string; mapping: Record<string, string> }) => {
      const res = await fetch("/api/sm/item-services/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Import failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/item-services"] });
      setImportResult(data);
      setImportStep("result");
      toast({ title: "Import completed", description: `${data.imported} items imported, ${data.skipped} skipped.` });
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
    if (!columnMapping.name) {
      toast({ title: "Item name mapping is required", description: "Please map at least the Name column", variant: "destructive" });
      return;
    }
    importMutation.mutate({ fileData, mapping: columnMapping });
  };

  const ITEM_FIELDS = [
    { key: "name", label: "Name", required: true },
    { key: "category", label: "Category (Service/Item)", required: false },
    { key: "defaultUnit", label: "Default Unit", required: false },
    { key: "unitPrice", label: "Unit Price (AED)", required: false },
    { key: "isActive", label: "Active (Yes/No)", required: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-items-title">Items & Services</h2>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} data-testid="input-item-import-file" />
          <Button variant="outline" onClick={() => { resetImportDialog(); setImportDialogOpen(true); }} disabled={previewMutation.isPending} data-testid="button-import-items">
            {previewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import Excel
          </Button>
          <Button disabled className="opacity-50 cursor-not-allowed" data-testid="button-add-item-disabled">
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-400" data-testid="text-netsuite-message">Items are mastered in NetSuite. Use Import to sync items from exported NetSuite data.</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative"><Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search items..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-7 h-9 w-[180px]" data-testid="input-search-items" /></div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-filter-category"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All categories</SelectItem><SelectItem value="SERVICE">Service</SelectItem><SelectItem value="ITEM">Item</SelectItem></SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] h-9" data-testid="select-filter-active"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Name</th><th className="py-2 px-3">Category</th><th className="py-2 px-3">Default Unit</th><th className="py-2 px-3">Unit Price</th><th className="py-2 px-3">Active</th>
            </tr></thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-border/50" data-testid={`row-item-${i.id}`}>
                  <td className="py-2 px-3 font-medium">{i.name}</td>
                  <td className="py-2 px-3"><Badge variant={i.category === "SERVICE" ? "default" : "secondary"} className="no-default-active-elevate">{i.category}</Badge></td>
                  <td className="py-2 px-3">{i.defaultUnit}</td>
                  <td className="py-2 px-3">{formatAED(i.unitPrice)}</td>
                  <td className="py-2 px-3"><Badge variant={i.isActive ? "default" : "secondary"} className="no-default-active-elevate">{i.isActive ? "Yes" : "No"}</Badge></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No items found. Import from an Excel file to add items.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) resetImportDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {importStep === "upload" && "Import Items from Excel"}
              {importStep === "mapping" && "Map Columns"}
              {importStep === "result" && "Import Results"}
            </DialogTitle>
            <DialogDescription>
              {importStep === "upload" && "Upload an Excel file (.xlsx, .xls, .csv) with item/service data."}
              {importStep === "mapping" && `File loaded with ${fileTotalRows} rows. Select which column from your file maps to each item field.`}
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
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={previewMutation.isPending} data-testid="button-select-item-file">
                  {previewMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reading file...</> : <>Select File</>}
                </Button>
              </div>
            </div>
          )}

          {importStep === "mapping" && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                {ITEM_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <Label className="text-sm font-medium shrink-0 w-[180px]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[field.key] || "__none__"}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [field.key]: v === "__none__" ? "" : v })}
                    >
                      <SelectTrigger data-testid={`select-item-map-${field.key}`} className="w-[220px] overflow-hidden">
                        <SelectValue placeholder="Select column..." className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 max-w-[300px] overflow-y-auto" position="popper" sideOffset={4}>
                        <SelectItem value="__none__">-- Skip --</SelectItem>
                        {fileColumns.map((col) => (
                          <SelectItem key={col} value={col} className="truncate">{col}</SelectItem>
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
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-background">
                        <tr className="border-b border-border">
                          {fileColumns.map((col) => (
                            <th key={col} className="py-1.5 px-2 text-left whitespace-nowrap text-muted-foreground font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filePreview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            {fileColumns.map((col) => (
                              <td key={col} className="py-1 px-2 whitespace-nowrap">{row[col]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {importStep === "result" && importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-item-import-imported">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-item-import-skipped">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-item-import-total">{importResult.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
              </div>

              {importResult.skipped > 0 && importResult.skipReasons && (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">Why were records skipped?</p>
                  <div className="space-y-2">
                    {importResult.skipReasons.duplicate_name > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Duplicate name (already in database)</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.duplicate_name}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${(importResult.skipReasons.duplicate_name / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {importResult.skipReasons.empty_row > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Empty row (no item name)</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.empty_row}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500" style={{ width: `${(importResult.skipReasons.empty_row / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {importResult.skipReasons.error > 0 && (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Import error</span>
                          <span className="text-xs font-medium">{importResult.skipReasons.error}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-red-700" style={{ width: `${(importResult.skipReasons.error / importResult.skipped) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <details className="border rounded-lg">
                  <summary className="text-xs font-medium cursor-pointer px-3 py-2 text-muted-foreground">
                    Show detailed log ({importResult.errors.length} entries)
                  </summary>
                  <div className="text-xs space-y-1 max-h-40 overflow-y-auto px-3 pb-3">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1 text-yellow-700 dark:text-yellow-400">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === "mapping" && (
              <>
                <Button variant="outline" onClick={() => setImportStep("upload")} data-testid="button-item-import-back">Back</Button>
                <Button onClick={handleImportSubmit} disabled={!columnMapping.name || importMutation.isPending} data-testid="button-item-start-import">
                  {importMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <>Import {fileTotalRows} rows</>}
                </Button>
              </>
            )}
            {importStep === "result" && (
              <Button onClick={() => { setImportDialogOpen(false); resetImportDialog(); }} data-testid="button-item-import-close">Close</Button>
            )}
            {importStep === "upload" && (
              <Button variant="outline" onClick={() => setImportDialogOpen(false)} data-testid="button-item-import-cancel">Cancel</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LiveryPackagesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");

  const { data: packages = [], isLoading } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const resetForm = () => { setName(""); setMonthlyPrice(""); setEditingId(null); };

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingId) await apiRequest("PATCH", `/api/sm/livery-packages/${editingId}`, data);
      else await apiRequest("POST", "/api/sm/livery-packages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] });
      toast({ title: editingId ? "Updated" : "Package created" });
      setDialogOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/livery-packages/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-packages"] }); toast({ title: "Deleted" }); },
  });

  const openEdit = (p: SmLiveryPackage) => {
    setEditingId(p.id); setName(p.name); setMonthlyPrice((p.monthlyPrice / 100).toFixed(2)); setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-packages-title">Livery Packages</h2>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-package"><Plus className="h-4 w-4 mr-1" /> Add Package</Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-3">Name</th><th className="py-2 px-3">Monthly Price</th><th className="py-2 px-3"></th>
            </tr></thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-border/50" data-testid={`row-package-${p.id}`}>
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3">{formatAED(p.monthlyPrice)}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-package-${p.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-package-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No packages found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Package" : "Add Package"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-package-name" /></div>
            <div className="space-y-1"><Label>Monthly Price (AED)</Label><Input type="number" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} data-testid="input-package-price" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; } mutation.mutate({ name, monthlyPrice: Math.round(parseFloat(monthlyPrice || "0") * 100) }); }} disabled={mutation.isPending} data-testid="button-submit-package">{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewAgreementPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<SmBox | null>(null);
  const [filterStable, setFilterStable] = useState("");
  const [showAvailOnly, setShowAvailOnly] = useState(true);

  const [agrType, setAgrType] = useState("PERMANENT_AUTO_RENEW");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [horseId, setHorseId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [packageId, setPackageId] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });
  const { data: agreements = [] } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });

  const stableMap = useMemo(() => Object.fromEntries(stables.map((s) => [s.id, s])), [stables]);
  const activeAgreementBoxIds = useMemo(() => new Set(agreements.filter(a => a.status === "ACTIVE" && a.boxId).map(a => a.boxId!)), [agreements]);

  const filteredBoxes = useMemo(() => {
    return boxes.filter((b) => {
      if (filterStable && filterStable !== "all" && b.stableId !== filterStable) return false;
      if (showAvailOnly && (b.status !== "AVAILABLE" || activeAgreementBoxIds.has(b.id))) return false;
      return true;
    });
  }, [boxes, filterStable, showAvailOnly, activeAgreementBoxIds]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/livery-agreements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-agreements"] });
      toast({ title: "Livery agreement created" });
      setDialogOpen(false);
      setSelectedBox(null);
      onNavigate("agreements-list");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreate = (box: SmBox) => {
    setSelectedBox(box);
    setAgrType("PERMANENT_AUTO_RENEW"); setStartDate(""); setEndDate("");
    setHorseId(""); setCustomerId(""); setCustomerContact(""); setRefNumber(""); setPackageId(""); setRemarks("");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!startDate || !customerId) { toast({ title: "Start date and customer are required", variant: "destructive" }); return; }
    createMutation.mutate({
      agreementType: agrType,
      startDate,
      endDate: endDate || null,
      stableId: selectedBox?.stableId || null,
      boxId: selectedBox?.id || null,
      horseId: horseId || null,
      customerId,
      customerContact: customerContact || null,
      refNumber: refNumber || null,
      liveryPackageId: packageId || null,
      remarks: remarks || null,
      status: "ACTIVE",
    });
  };

  const isBoxOccupied = (boxId: string) => activeAgreementBoxIds.has(boxId);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="text-new-agreement-title">New Livery Agreement</h2>
      <p className="text-sm text-muted-foreground mb-4">Select a box to create a new livery agreement. Only available boxes are shown by default.</p>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <Select value={filterStable} onValueChange={setFilterStable}>
          <SelectTrigger className="w-[150px] h-9" data-testid="select-newagr-filter-stable"><SelectValue placeholder="All stables" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All stables</SelectItem>{stables.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch checked={showAvailOnly} onCheckedChange={setShowAvailOnly} data-testid="switch-available-only" />
          <span className="text-xs text-muted-foreground">Available only</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 px-3">Box</th><th className="py-2 px-3">Stable</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Agreement</th><th className="py-2 px-3"></th>
          </tr></thead>
          <tbody>
            {filteredBoxes.map((b) => {
              const occupied = isBoxOccupied(b.id);
              return (
                <tr key={b.id} className="border-b border-border/50" data-testid={`row-newagr-box-${b.id}`}>
                  <td className="py-2 px-3 font-medium">{b.name}</td>
                  <td className="py-2 px-3">{stableMap[b.stableId]?.name || "-"}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="no-default-active-elevate">{b.boxType}</Badge></td>
                  <td className="py-2 px-3">
                    {b.status === "AVAILABLE" ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 no-default-active-elevate">Available</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 no-default-active-elevate">{b.status}</Badge>
                    )}
                  </td>
                  <td className="py-2 px-3">{occupied ? <Badge variant="secondary" className="no-default-active-elevate">Has Agreement</Badge> : <span className="text-xs text-muted-foreground">None</span>}</td>
                  <td className="py-2 px-3">
                    {!occupied && b.status === "AVAILABLE" && (
                      <Button size="sm" onClick={() => handleCreate(b)} data-testid={`button-create-agr-${b.id}`}><Plus className="h-3.5 w-3.5 mr-1" /> Create</Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredBoxes.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No boxes found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Agreement - {selectedBox?.name} ({stableMap[selectedBox?.stableId || ""]?.name})</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Agreement Type</Label>
              <Select value={agrType} onValueChange={setAgrType}>
                <SelectTrigger data-testid="select-agreement-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT_AUTO_RENEW">Permanent (Auto Renew)</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} data-testid="input-agreement-start" />
            </div>
            {agrType === "TEMPORARY" && (
              <div className="space-y-1"><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} data-testid="input-agreement-end" /></div>
            )}
            <div className="space-y-1">
              <Label>Customer *</Label>
              <SearchableSelect options={customers.map(c => ({ value: c.id, label: c.name, sublabel: c.email || undefined }))} value={customerId} onValueChange={setCustomerId} placeholder="Select customer" data-testid="select-agreement-customer" />
            </div>
            <div className="space-y-1">
              <Label>Horse (optional)</Label>
              <SearchableSelect options={[{ value: "none", label: "No horse (unassigned)" }, ...horses.map(h => ({ value: h.id, label: h.name }))]} value={horseId} onValueChange={setHorseId} placeholder="Select horse" data-testid="select-agreement-horse" />
            </div>
            <div className="space-y-1">
              <Label>Livery Package</Label>
              <SearchableSelect options={packages.map(p => ({ value: p.id, label: p.name, sublabel: `${formatAED(p.monthlyPrice)}/mo` }))} value={packageId} onValueChange={setPackageId} placeholder="Select package" data-testid="select-agreement-package" />
            </div>
            <div className="space-y-1"><Label>Customer Contact</Label><Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} data-testid="input-agreement-contact" /></div>
            <div className="space-y-1"><Label>Ref Number</Label><Input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} data-testid="input-agreement-ref" /></div>
            <div className="col-span-1 md:col-span-2 space-y-1"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} data-testid="input-agreement-remarks" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-agreement">{createMutation.isPending ? "Creating..." : "Create Agreement"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AgreementsListPage() {
  const { toast } = useToast();
  const { data: agreements = [], isLoading } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const horseMap = useMemo(() => Object.fromEntries(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const stableMap = useMemo(() => Object.fromEntries(stables.map((s) => [s.id, s])), [stables]);
  const boxMap = useMemo(() => Object.fromEntries(boxes.map((b) => [b.id, b])), [boxes]);
  const packageMap = useMemo(() => Object.fromEntries(packages.map((p) => [p.id, p])), [packages]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/livery-agreements/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/livery-agreements"] }); toast({ title: "Agreement deleted" }); },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="text-agreements-title">Livery Agreements</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-2">Ref #</th><th className="py-2 px-2">Type</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Horse</th><th className="py-2 px-2">Customer</th><th className="py-2 px-2">Stable</th><th className="py-2 px-2">Box</th><th className="py-2 px-2">Package</th><th className="py-2 px-2">Start</th><th className="py-2 px-2">End</th><th className="py-2 px-2"></th>
            </tr></thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id} className="border-b border-border/50" data-testid={`row-agreement-${a.id}`}>
                  <td className="py-2 px-2">{a.refNumber || "-"}</td>
                  <td className="py-2 px-2">
                    <Badge variant={a.agreementType?.includes("PERMANENT") ? "default" : "secondary"} className="no-default-active-elevate text-[10px]">
                      {a.agreementType?.includes("PERMANENT") ? "Permanent" : "Temporary"}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"} className="no-default-active-elevate text-[10px]">{a.status}</Badge>
                  </td>
                  <td className="py-2 px-2">{horseMap[a.horseId || ""]?.name || <span className="text-muted-foreground italic">Unassigned</span>}</td>
                  <td className="py-2 px-2">{customerMap[a.customerId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{stableMap[a.stableId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{boxMap[a.boxId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{packageMap[a.liveryPackageId || ""]?.name || "-"}</td>
                  <td className="py-2 px-2">{a.startDate}</td>
                  <td className="py-2 px-2">{a.endDate || "-"}</td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)} data-testid={`button-delete-agr-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
              {agreements.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-muted-foreground">No livery agreements found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PostBillingPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<SmBox | null>(null);
  const [filterStable, setFilterStable] = useState("");
  const [filterHorse, setFilterHorse] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const [formDate, setFormDate] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formHorse, setFormHorse] = useState("");
  const [formCustomer, setFormCustomer] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formItemUnit, setFormItemUnit] = useState("");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [editPrice, setEditPrice] = useState(false);

  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: itemServices = [] } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });
  const { data: agreements = [] } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });

  const stableMap = useMemo(() => Object.fromEntries(stables.map((s) => [s.id, s])), [stables]);
  const horseMap = useMemo(() => Object.fromEntries(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const activeItems = useMemo(() => itemServices.filter((i) => i.isActive), [itemServices]);
  const selectedItem = useMemo(() => itemServices.find((i) => i.id === formItem), [itemServices, formItem]);

  const activeAgreements = useMemo(() => agreements.filter(a => a.status === "ACTIVE"), [agreements]);
  const activeAgreementByBoxId = useMemo(() => {
    const map: Record<string, SmLiveryAgreement> = {};
    activeAgreements.forEach(a => { if (a.boxId) map[a.boxId] = a; });
    return map;
  }, [activeAgreements]);

  useEffect(() => {
    if (selectedItem) {
      setFormUnitPrice((selectedItem.unitPrice / 100).toFixed(2));
      if (selectedItem.unitOptions?.length) setFormItemUnit(selectedItem.defaultUnit || selectedItem.unitOptions[0]);
      setEditPrice(false);
    }
  }, [selectedItem]);

  const boxesWithAgreements = useMemo(() => {
    return boxes.filter((b) => activeAgreementByBoxId[b.id]);
  }, [boxes, activeAgreementByBoxId]);

  const filteredBoxes = useMemo(() => {
    return boxesWithAgreements.filter((b) => {
      const agr = activeAgreementByBoxId[b.id];
      if (filterStable && filterStable !== "all" && b.stableId !== filterStable) return false;
      if (filterHorse && filterHorse !== "all" && agr?.horseId !== filterHorse) return false;
      if (filterCustomer && filterCustomer !== "all" && agr?.customerId !== filterCustomer) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const horseName = horseMap[agr?.horseId || ""]?.name?.toLowerCase() || "";
        const custName = customerMap[agr?.customerId || ""]?.name?.toLowerCase() || "";
        if (!b.name.toLowerCase().includes(q) && !horseName.includes(q) && !custName.includes(q)) return false;
      }
      return true;
    });
  }, [boxesWithAgreements, filterStable, filterHorse, filterCustomer, searchQ, activeAgreementByBoxId, horseMap, customerMap]);

  const uniqueHorses = useMemo(() => {
    const ids = new Set(activeAgreements.map(a => a.horseId).filter(Boolean) as string[]);
    return horses.filter(h => ids.has(h.id));
  }, [activeAgreements, horses]);

  const uniqueCustomers = useMemo(() => {
    const ids = new Set(activeAgreements.map(a => a.customerId).filter(Boolean) as string[]);
    return customers.filter(c => ids.has(c.id));
  }, [activeAgreements, customers]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await apiRequest("POST", "/api/sm/billing-elements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      toast({ title: "Billing element created" });
      setDialogOpen(false); setSelectedBox(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleOpenCreate = (box: SmBox) => {
    setSelectedBox(box);
    const agr = activeAgreementByBoxId[box.id];
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormRef(""); setFormRemarks("");
    setFormHorse(agr?.horseId || "");
    setFormCustomer(agr?.customerId || "");
    setFormItem(""); setFormItemUnit(""); setFormUnitPrice(""); setFormQty("1"); setEditPrice(false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formDate || !formCustomer || !formItem) { toast({ title: "Date, customer and item are required", variant: "destructive" }); return; }
    const qty = parseFloat(formQty);
    if (!qty || qty <= 0) { toast({ title: "Quantity must be > 0", variant: "destructive" }); return; }
    createMutation.mutate({
      stableId: selectedBox?.stableId || null,
      boxId: selectedBox?.id || null,
      transactionDate: formDate,
      refNumber: formRef || null,
      remarks: formRemarks || null,
      horseId: formHorse || null,
      customerId: formCustomer,
      itemServiceId: formItem,
      unit: formItemUnit || null,
      unitPrice: Math.round(parseFloat(formUnitPrice) * 100),
      quantity: formQty,
      source: "MANUAL",
    });
  };

  const horseOptions = useMemo(() => horses.map(h => ({ value: h.id, label: h.name })), [horses]);
  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name, sublabel: c.email || undefined })), [customers]);
  const itemOptions = useMemo(() => activeItems.map(i => ({ value: i.id, label: i.name, sublabel: i.category || undefined })), [activeItems]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2" data-testid="text-post-billing-title">Post Billing Element</h2>
      <p className="text-sm text-muted-foreground mb-4">Boxes with active livery agreements. Select one to create a billing element.</p>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative"><Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-7 h-9 w-[180px]" data-testid="input-search-pb-boxes" /></div>
        <div className="w-[160px]">
          <SearchableSelect options={[{ value: "all", label: "All stables" }, ...stables.map(s => ({ value: s.id, label: s.name }))]} value={filterStable || "all"} onValueChange={(v) => setFilterStable(v === "all" ? "" : v)} placeholder="All stables" data-testid="select-pb-filter-stable" />
        </div>
        <div className="w-[160px]">
          <SearchableSelect options={[{ value: "all", label: "All horses" }, ...uniqueHorses.map(h => ({ value: h.id, label: h.name }))]} value={filterHorse || "all"} onValueChange={(v) => setFilterHorse(v === "all" ? "" : v)} placeholder="All horses" data-testid="select-pb-filter-horse" />
        </div>
        <div className="w-[160px]">
          <SearchableSelect options={[{ value: "all", label: "All customers" }, ...uniqueCustomers.map(c => ({ value: c.id, label: c.name }))]} value={filterCustomer || "all"} onValueChange={(v) => setFilterCustomer(v === "all" ? "" : v)} placeholder="All customers" data-testid="select-pb-filter-customer" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 px-3">Box</th><th className="py-2 px-3">Stable</th><th className="py-2 px-3">Horse</th><th className="py-2 px-3">Customer</th><th className="py-2 px-3">Type</th><th className="py-2 px-3"></th>
          </tr></thead>
          <tbody>
            {filteredBoxes.map((b) => {
              const agr = activeAgreementByBoxId[b.id];
              return (
                <tr key={b.id} className="border-b border-border/50" data-testid={`row-pb-box-${b.id}`}>
                  <td className="py-2 px-3 font-medium">{b.name}</td>
                  <td className="py-2 px-3">{stableMap[b.stableId]?.name || "-"}</td>
                  <td className="py-2 px-3">{horseMap[agr?.horseId || ""]?.name || "-"}</td>
                  <td className="py-2 px-3">{customerMap[agr?.customerId || ""]?.name || "-"}</td>
                  <td className="py-2 px-3"><Badge variant="outline" className="no-default-active-elevate">{b.boxType}</Badge></td>
                  <td className="py-2 px-3">
                    <Button size="sm" onClick={() => handleOpenCreate(b)} data-testid={`button-create-be-${b.id}`}><Receipt className="h-3.5 w-3.5 mr-1" /> Create</Button>
                  </td>
                </tr>
              );
            })}
            {filteredBoxes.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{boxesWithAgreements.length === 0 ? "No boxes with active livery agreements." : "No boxes match the current filters."}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Billing Element - {selectedBox?.name} ({stableMap[selectedBox?.stableId || ""]?.name})</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Stable</Label>
              <Input value={stableMap[selectedBox?.stableId || ""]?.name || ""} readOnly className="opacity-70" data-testid="input-pb-stable" />
            </div>
            <div className="space-y-1">
              <Label>Box</Label>
              <Input value={selectedBox?.name || ""} readOnly className="opacity-70" data-testid="input-pb-box" />
            </div>
            <div className="space-y-1">
              <Label>Transaction Date *</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} data-testid="input-pb-date" />
            </div>
            <div className="space-y-1">
              <Label>Ref Number</Label>
              <Input value={formRef} onChange={(e) => setFormRef(e.target.value)} data-testid="input-pb-ref" />
            </div>
            <div className="space-y-1">
              <Label>Horse</Label>
              <SearchableSelect options={horseOptions} value={formHorse} onValueChange={setFormHorse} placeholder="Select horse" data-testid="select-pb-horse" />
            </div>
            <div className="space-y-1">
              <Label>Customer *</Label>
              <SearchableSelect options={customerOptions} value={formCustomer} onValueChange={setFormCustomer} placeholder="Select customer" data-testid="select-pb-customer" />
            </div>
            <div className="space-y-1">
              <Label>Item *</Label>
              <SearchableSelect options={itemOptions} value={formItem} onValueChange={setFormItem} placeholder="Select item" data-testid="select-pb-item" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <SearchableSelect options={(selectedItem?.unitOptions || []).map(u => ({ value: u, label: u }))} value={formItemUnit} onValueChange={setFormItemUnit} placeholder="Select unit" data-testid="select-pb-item-unit" />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                Unit Price
                <button className="text-[10px] text-primary underline" onClick={() => setEditPrice(!editPrice)} data-testid="button-toggle-edit-price">
                  {editPrice ? "Lock" : "Edit"}
                </button>
              </Label>
              <Input type="number" step="0.01" value={formUnitPrice} onChange={(e) => setFormUnitPrice(e.target.value)} readOnly={!editPrice} className={!editPrice ? "opacity-70" : ""} data-testid="input-pb-unit-price" />
            </div>
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input type="number" step="0.01" min="0.01" value={formQty} onChange={(e) => setFormQty(e.target.value)} data-testid="input-pb-qty" />
            </div>
            <div className="col-span-2 space-y-1"><Label>Remarks</Label><Textarea value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} data-testid="input-pb-remarks" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-pb">{createMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingPage() {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [bFilterHorse, setBFilterHorse] = useState("");
  const [bFilterCustomer, setBFilterCustomer] = useState("");

  const { data: billingElements = [], isLoading } = useQuery<SmBillingElement[]>({ queryKey: ["/api/sm/billing-elements", "unbilled"], queryFn: () => fetch("/api/sm/billing-elements?unbilledOnly=true", { credentials: "include" }).then(r => r.json()) });
  const { data: invoices = [] } = useQuery<SmInvoice[]>({ queryKey: ["/api/sm/invoices"] });
  const { data: stables = [] } = useQuery<SmStable[]>({ queryKey: ["/api/sm/stables"] });
  const { data: boxes = [] } = useQuery<SmBox[]>({ queryKey: ["/api/sm/boxes"] });
  const { data: horses = [] } = useQuery<SmHorse[]>({ queryKey: ["/api/sm/horses"] });
  const { data: customers = [] } = useQuery<SmCustomer[]>({ queryKey: ["/api/sm/customers"] });
  const { data: itemServices = [] } = useQuery<SmItemService[]>({ queryKey: ["/api/sm/item-services"] });
  const { data: agreements = [] } = useQuery<SmLiveryAgreement[]>({ queryKey: ["/api/sm/livery-agreements"] });
  const { data: packages = [] } = useQuery<SmLiveryPackage[]>({ queryKey: ["/api/sm/livery-packages"] });

  const stableMap = useMemo(() => Object.fromEntries(stables.map((s) => [s.id, s])), [stables]);
  const boxMap = useMemo(() => Object.fromEntries(boxes.map((b) => [b.id, b])), [boxes]);
  const horseMap = useMemo(() => Object.fromEntries(horses.map((h) => [h.id, h])), [horses]);
  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);
  const itemMap = useMemo(() => Object.fromEntries(itemServices.map((i) => [i.id, i])), [itemServices]);
  const packageMap = useMemo(() => Object.fromEntries(packages.map((p) => [p.id, p])), [packages]);

  const activeAgreements = useMemo(() => agreements.filter(a => a.status === "ACTIVE" && a.customerId && a.liveryPackageId), [agreements]);

  const liveryLines = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return activeAgreements.map(a => {
      const pkg = packageMap[a.liveryPackageId!];
      return {
        id: `livery-${a.id}-${currentMonth}`,
        isVirtual: true,
        agreementId: a.id,
        stableId: a.stableId,
        boxId: a.boxId,
        horseId: a.horseId,
        customerId: a.customerId!,
        itemName: `Monthly Livery - ${pkg?.name || "Package"}`,
        quantity: "1",
        unit: "month",
        unitPrice: pkg?.monthlyPrice || 0,
        transactionDate: `${currentMonth}-01`,
        source: "LIVERY_AUTO" as const,
      };
    });
  }, [activeAgreements, packageMap]);

  const allLines = useMemo(() => {
    const manual = billingElements.map(be => ({
      id: be.id,
      isVirtual: false,
      stableId: be.stableId,
      boxId: be.boxId,
      horseId: be.horseId,
      customerId: be.customerId || "",
      itemName: itemMap[be.itemServiceId || ""]?.name || "Unknown",
      quantity: be.quantity,
      unit: be.unit,
      unitPrice: be.unitPrice,
      transactionDate: be.transactionDate,
      source: be.source || "MANUAL",
    }));
    return [...manual, ...liveryLines];
  }, [billingElements, liveryLines, itemMap]);

  const filteredLines = useMemo(() => {
    return allLines.filter(l => {
      if (bFilterHorse && bFilterHorse !== "all" && l.horseId !== bFilterHorse) return false;
      if (bFilterCustomer && bFilterCustomer !== "all" && l.customerId !== bFilterCustomer) return false;
      return true;
    });
  }, [allLines, bFilterHorse, bFilterCustomer]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredLines.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredLines.map(l => l.id)));
  };

  const selectedLines = useMemo(() => filteredLines.filter(l => selectedIds.has(l.id)), [filteredLines, selectedIds]);
  const selectedCustomerIds = useMemo(() => new Set(selectedLines.map(l => l.customerId)), [selectedLines]);
  const canGenerate = selectedLines.length > 0 && selectedCustomerIds.size === 1;

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      const customerId = Array.from(selectedCustomerIds)[0];
      const today = new Date().toISOString().split("T")[0];
      const invNum = `INV-${Date.now()}`;
      const lines = selectedLines.map(l => ({
        description: l.itemName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        totalPrice: l.unitPrice * (parseFloat(l.quantity) || 1),
        billingElementId: l.isVirtual ? null : l.id,
      }));
      const totalAmount = lines.reduce((s, l) => s + l.totalPrice, 0);
      const realBEIds = selectedLines.filter(l => !l.isVirtual).map(l => l.id);
      await apiRequest("POST", "/api/sm/invoices", {
        invoice: { invoiceNumber: invNum, customerId, status: "DRAFT", totalAmount, invoiceDate: today },
        lines,
        billingElementIds: realBEIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sm/invoices"] });
      toast({ title: "Invoice draft created" });
      setSelectedIds(new Set());
      setConfirmDialog(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/billing-elements/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/billing-elements"] }); toast({ title: "Deleted" }); },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/sm/invoices/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sm/invoices"] }); toast({ title: "Invoice deleted" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-billing-title">Billing</h2>
        <div className="flex items-center gap-2">
          {selectedLines.length > 0 && (
            <span className="text-xs text-muted-foreground">{selectedLines.length} selected</span>
          )}
          <Button
            onClick={() => setConfirmDialog(true)}
            disabled={!canGenerate}
            data-testid="button-generate-invoice"
          >
            <DollarSign className="h-4 w-4 mr-1" /> Generate Invoice Draft
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="w-[160px]">
          <SearchableSelect options={[{ value: "all", label: "All horses" }, ...horses.map(h => ({ value: h.id, label: h.name }))]} value={bFilterHorse || "all"} onValueChange={(v) => setBFilterHorse(v === "all" ? "" : v)} placeholder="All horses" data-testid="select-billing-filter-horse" />
        </div>
        <div className="w-[160px]">
          <SearchableSelect options={[{ value: "all", label: "All customers" }, ...customers.map(c => ({ value: c.id, label: c.name }))]} value={bFilterCustomer || "all"} onValueChange={(v) => setBFilterCustomer(v === "all" ? "" : v)} placeholder="All customers" data-testid="select-billing-filter-customer" />
        </div>
      </div>

      {!canGenerate && selectedLines.length > 0 && selectedCustomerIds.size > 1 && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-700 dark:text-red-400">Selected lines belong to different customers. Select lines for the same customer only.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 px-2"><Checkbox checked={selectedIds.size === filteredLines.length && filteredLines.length > 0} onCheckedChange={toggleAll} data-testid="checkbox-select-all" /></th>
              <th className="py-2 px-2">Source</th><th className="py-2 px-2">Date</th><th className="py-2 px-2">Customer</th><th className="py-2 px-2">Horse</th><th className="py-2 px-2">Stable</th><th className="py-2 px-2">Box</th><th className="py-2 px-2">Item</th><th className="py-2 px-2">Qty</th><th className="py-2 px-2">Unit Price</th><th className="py-2 px-2">Total</th><th className="py-2 px-2"></th>
            </tr></thead>
            <tbody>
              {filteredLines.map((l) => {
                const qty = parseFloat(l.quantity) || 0;
                const total = l.unitPrice * qty;
                return (
                  <tr key={l.id} className={`border-b border-border/50 ${l.isVirtual ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`} data-testid={`row-billing-${l.id}`}>
                    <td className="py-2 px-2"><Checkbox checked={selectedIds.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} data-testid={`checkbox-billing-${l.id}`} /></td>
                    <td className="py-2 px-2"><Badge variant={l.source === "LIVERY_AUTO" ? "default" : "secondary"} className="no-default-active-elevate text-[10px]">{l.source === "LIVERY_AUTO" ? "Livery" : "Manual"}</Badge></td>
                    <td className="py-2 px-2">{l.transactionDate}</td>
                    <td className="py-2 px-2">{customerMap[l.customerId]?.name || "-"}</td>
                    <td className="py-2 px-2">{horseMap[l.horseId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{stableMap[l.stableId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{boxMap[l.boxId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2">{l.itemName}</td>
                    <td className="py-2 px-2">{l.quantity}</td>
                    <td className="py-2 px-2">{formatAED(l.unitPrice)}</td>
                    <td className="py-2 px-2 font-medium">{formatAED(total)}</td>
                    <td className="py-2 px-2">
                      {!l.isVirtual && (
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(l.id)} data-testid={`button-delete-be-${l.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLines.length === 0 && <tr><td colSpan={12} className="py-8 text-center text-muted-foreground">No unbilled elements.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" data-testid="text-invoices-title">Generated Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-2">Invoice #</th><th className="py-2 px-2">Customer</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Total</th><th className="py-2 px-2">Date</th><th className="py-2 px-2"></th>
              </tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50" data-testid={`row-invoice-${inv.id}`}>
                    <td className="py-2 px-2 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-2 px-2">{customerMap[inv.customerId || ""]?.name || "-"}</td>
                    <td className="py-2 px-2"><Badge variant={inv.status === "DRAFT" ? "secondary" : "default"} className="no-default-active-elevate text-[10px]">{inv.status}</Badge></td>
                    <td className="py-2 px-2">{formatAED(inv.totalAmount)}</td>
                    <td className="py-2 px-2">{inv.invoiceDate}</td>
                    <td className="py-2 px-2">
                      <Button variant="ghost" size="icon" onClick={() => deleteInvoiceMutation.mutate(inv.id)} data-testid={`button-delete-invoice-${inv.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Invoice Generation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Generate a draft invoice for <strong>{customerMap[Array.from(selectedCustomerIds)[0] || ""]?.name}</strong> with {selectedLines.length} line(s)?</p>
            <p className="text-sm font-medium">Total: {formatAED(selectedLines.reduce((s, l) => s + l.unitPrice * (parseFloat(l.quantity) || 1), 0))}</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button onClick={() => invoiceMutation.mutate()} disabled={invoiceMutation.isPending} data-testid="button-confirm-invoice">{invoiceMutation.isPending ? "Generating..." : "Generate Invoice Draft"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminUsersPage() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Users</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground" data-testid="text-users-placeholder">User management will be configured later.</p></CardContent>
    </Card>
  );
}

function AdminSettingsPage() {
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/sm/reset-demo-data", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "Demo data reset successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Demo Data</h3>
          <p className="text-xs text-muted-foreground mb-3">Reset all StableMaster data to the default demo dataset. This will delete all current data and recreate it from scratch.</p>
          <Button variant="destructive" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} data-testid="button-reset-demo-data">
            {resetMutation.isPending ? "Resetting..." : "Reset Demo Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StableMasterPage() {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const basePath = location.startsWith("/equestrian/stable-master") ? "/equestrian/stable-master" : "/equestrian/stable-assets";

  const activeFromRoute = useMemo(() => {
    const suffix = location.replace(basePath, "").replace(/^\//, "");
    return REVERSE_ROUTE_MAP[suffix] || "post-billing";
  }, [location]);

  const [activeItem, setActiveItem] = useState(activeFromRoute);

  useEffect(() => {
    setActiveItem(activeFromRoute);
  }, [activeFromRoute]);

  const handleSelect = (id: string) => {
    setActiveItem(id);
    const route = ROUTE_MAP[id];
    if (route) setLocation(`${basePath}/${route}`);
  };

  const renderContent = () => {
    switch (activeItem) {
      case "schedule": return <SchedulePage />;
      case "post-billing": return <PostBillingPage />;
      case "horses": return <HorsesPage />;
      case "customers": return <CustomersPage />;
      case "stables": return <StablesPage />;
      case "boxes": return <BoxesPage />;
      case "items": return <ItemsPage />;
      case "agreements-list": return <AgreementsListPage />;
      case "agreement-new": return <NewAgreementPage onNavigate={handleSelect} />;
      case "livery-packages": return <LiveryPackagesPage />;
      case "billing": return <BillingPage />;
      case "admin-users": return <AdminUsersPage />;
      case "admin-settings": return <AdminSettingsPage />;
      default: return <PostBillingPage />;
    }
  };

  return (
    <div className="flex h-full" data-testid="page-stable-master">
      <SubSidebar
        activeItem={activeItem}
        onSelect={handleSelect}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 overflow-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
}
