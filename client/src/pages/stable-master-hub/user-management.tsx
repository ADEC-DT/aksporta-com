import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATIC_USERS = [
  { id: 1, name: "Admin User", email: "admin@stablemaster.com", role: "Admin", status: "Active" },
  { id: 2, name: "Stable Manager", email: "manager@stablemaster.com", role: "Manager", status: "Active" },
  { id: 3, name: "Staff Member", email: "staff@stablemaster.com", role: "Staff", status: "Active" },
];

export default function UserManagementPage() {
  return (
    <div data-testid="smh-user-management-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-smh-users-title">User Management</h1>
        <p className="text-muted-foreground">Manage system users and roles</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATIC_USERS.map((user) => (
                <TableRow key={user.id} data-testid={`row-smh-user-${user.id}`}>
                  <TableCell className="font-medium" data-testid={`text-smh-user-name-${user.id}`}>{user.name}</TableCell>
                  <TableCell data-testid={`text-smh-user-email-${user.id}`}>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-smh-user-role-${user.id}`}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" data-testid={`badge-smh-user-status-${user.id}`}>{user.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
