import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Package, Box } from "lucide-react";
import type { SmItemService } from "@shared/schema";

function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ItemsServicesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeOnly, setActiveOnly] = useState(true);

  const { data: items, isLoading } = useQuery<SmItemService[]>({
    queryKey: ["/api/sm/item-services"],
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (activeOnly && !item.isActive) return false;
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchId = item.netsuiteItemId?.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [items, search, categoryFilter, activeOnly]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Items & Services" />
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>
        </Card>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Items & Services" description="Read-only catalogue of billable items and services" />

      <Card className="p-4 mb-6" data-testid="card-items-filter">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or NetSuite ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-items-search"
              />
            </div>
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-items-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="ITEM">Item</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch
              id="active-only"
              checked={activeOnly}
              onCheckedChange={setActiveOnly}
              data-testid="switch-items-active-only"
            />
            <Label htmlFor="active-only" className="text-sm cursor-pointer">Active only</Label>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center" data-testid="empty-items">
          <Box className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium text-lg">No items found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || categoryFilter !== "ALL" || activeOnly
              ? "Try adjusting your filters"
              : "No items or services have been created yet"}
          </p>
        </Card>
      ) : (
        <Card data-testid="table-items">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NetSuite ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Unit</TableHead>
                <TableHead className="text-right">Default Price</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-netsuite-id-${item.id}`}>
                    {item.netsuiteItemId || "—"}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-item-name-${item.id}`}>
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.category === "SERVICE" ? "default" : "secondary"} data-testid={`badge-item-category-${item.id}`}>
                      {item.category === "SERVICE" ? <Package className="h-3 w-3 mr-1" /> : <Box className="h-3 w-3 mr-1" />}
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-item-unit-${item.id}`}>
                    {item.defaultUnit}
                  </TableCell>
                  <TableCell className="text-right font-mono" data-testid={`text-item-price-${item.id}`}>
                    {formatPrice(item.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.isActive ? "default" : "secondary"}
                      className={item.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                      data-testid={`badge-item-active-${item.id}`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
