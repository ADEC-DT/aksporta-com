import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Palette, Shield, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import type { ManagedUser } from "@shared/schema";

type ProfileData = Omit<ManagedUser, "password" | "mfaSecret" | "mfaBackupCodes">;

export default function SettingsPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    email: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    phoneNumber: "",
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [mfaSetupDialogOpen, setMfaSetupDialogOpen] = useState(false);
  const [mfaDisableDialogOpen, setMfaDisableDialogOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [mfaToken, setMfaToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/settings/profile"],
    enabled: !!authUser,
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || "",
        email: profile.email,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        jobTitle: profile.jobTitle || "",
        phoneNumber: profile.phoneNumber || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      return apiRequest("PATCH", "/api/settings/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { theme?: string; emailNotifications?: boolean }) => {
      return apiRequest("PATCH", "/api/settings/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({ title: "Preferences updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update preferences", description: error.message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest("POST", "/api/settings/change-password", data);
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password changed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    },
  });

  const setupMfaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/mfa/setup", {});
      return res.json();
    },
    onSuccess: (data) => {
      setMfaSetupData(data);
      setMfaSetupDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to setup MFA", description: error.message, variant: "destructive" });
    },
  });

  const enableMfaMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/settings/mfa/enable", { token });
      return res.json();
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setMfaSetupDialogOpen(false);
      setMfaToken("");
      setMfaSetupData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({ title: "MFA enabled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to enable MFA", description: error.message, variant: "destructive" });
    },
  });

  const disableMfaMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest("POST", "/api/settings/mfa/disable", { password });
    },
    onSuccess: () => {
      setMfaDisableDialogOpen(false);
      setDisablePassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({ title: "MFA disabled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to disable MFA", description: error.message, variant: "destructive" });
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      toast({ title: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  }

  function handleThemeChange(theme: string) {
    updatePreferencesMutation.mutate({ theme });
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  function handleNotificationsChange(enabled: boolean) {
    updatePreferencesMutation.mutate({ emailNotifications: enabled });
  }

  function handleMfaToggle() {
    if (profile?.mfaEnabled) {
      setMfaDisableDialogOpen(true);
    } else {
      setupMfaMutation.mutate();
    }
  }

  function handleEnableMfa(e: React.FormEvent) {
    e.preventDefault();
    if (mfaToken.length !== 6) {
      toast({ title: "Please enter a 6-digit code", variant: "destructive" });
      return;
    }
    enableMfaMutation.mutate(mfaToken);
  }

  function handleDisableMfa(e: React.FormEvent) {
    e.preventDefault();
    disableMfaMutation.mutate(disablePassword);
  }

  function copySecret() {
    if (mfaSetupData?.secret) {
      navigator.clipboard.writeText(mfaSetupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Unable to load settings</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || profile.username[0].toUpperCase();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList data-testid="settings-tabs">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          {/* COMMENTED OUT: Security and Preferences tabs - can be restored later
          <TabsTrigger value="security" data-testid="tab-security">
            <Lock className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Palette className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          */}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.profilePicture || undefined} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.displayName || profile.username}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      placeholder="Your display name"
                      data-testid="input-display-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="First name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder="Last name"
                      data-testid="input-last-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profileForm.jobTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                      placeholder="Your job title"
                      data-testid="input-job-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-phone-number"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMMENTED OUT: Security TabsContent - can be restored later
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Unknown
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordDialogOpen(true)}
                  data-testid="button-change-password"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Shield className={`h-10 w-10 ${profile.mfaEnabled ? "text-green-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-medium">
                      {profile.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.mfaEnabled 
                        ? "Your account is protected with MFA" 
                        : "Protect your account with a one-time code"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={profile.mfaEnabled ? "destructive" : "default"}
                  onClick={handleMfaToggle}
                  disabled={setupMfaMutation.isPending}
                  data-testid="button-toggle-mfa"
                >
                  {setupMfaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {profile.mfaEnabled ? "Disable MFA" : "Enable MFA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        */}

        {/* COMMENTED OUT: Preferences TabsContent - can be restored later
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose between light, dark, or system theme
                  </p>
                </div>
                <Select
                  value={profile.theme || "system"}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger className="w-32" data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch
                  checked={profile.emailNotifications}
                  onCheckedChange={handleNotificationsChange}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        */}
      </Tabs>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                data-testid="input-confirm-password"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={changePasswordMutation.isPending}
                data-testid="button-submit-password"
              >
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MFA Setup Dialog */}
      <Dialog open={mfaSetupDialogOpen} onOpenChange={setMfaSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the code to verify
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnableMfa} className="space-y-4">
            {mfaSetupData && (
              <>
                <div className="flex justify-center">
                  <img 
                    src={mfaSetupData.qrCode} 
                    alt="MFA QR Code" 
                    className="rounded-lg border"
                    data-testid="img-mfa-qrcode"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Manual Entry Key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                      {mfaSetupData.secret}
                    </code>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={copySecret}
                      data-testid="button-copy-secret"
                    >
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mfaToken">Verification Code</Label>
              <Input
                id="mfaToken"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                required
                data-testid="input-mfa-token"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setMfaSetupDialogOpen(false);
                  setMfaToken("");
                  setMfaSetupData(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={enableMfaMutation.isPending || mfaToken.length !== 6}
                data-testid="button-verify-mfa"
              >
                {enableMfaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Enable
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Backup Codes</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code 
                key={index} 
                className="rounded bg-muted px-3 py-2 text-center font-mono text-sm"
                data-testid={`text-backup-code-${index}`}
              >
                {code}
              </code>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)} data-testid="button-close-backup-codes">
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MFA Disable Dialog */}
      <Dialog open={mfaDisableDialogOpen} onOpenChange={setMfaDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling MFA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisableMfa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disablePassword">Password</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                data-testid="input-disable-mfa-password"
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setMfaDisableDialogOpen(false);
                  setDisablePassword("");
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={disableMfaMutation.isPending}
                data-testid="button-confirm-disable-mfa"
              >
                {disableMfaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable MFA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
