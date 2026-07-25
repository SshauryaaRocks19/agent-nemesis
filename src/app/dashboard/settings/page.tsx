"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Bell, Shield, Key } from "lucide-react";

export default function SettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully.");
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Manage your account, API keys, and notification preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Navigation Sidebar (Mock) */}
        <div className="col-span-1 space-y-1">
          <Button variant="secondary" className="w-full justify-start gap-2">
            <Shield className="w-4 h-4" /> Account
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => toast.info("Coming soon")}>
            <Bell className="w-4 h-4" /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => toast.info("Coming soon")}>
            <Key className="w-4 h-4" /> API Keys
          </Button>
        </div>

        {/* Settings Form */}
        <div className="col-span-3 space-y-6">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and workspace settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Name</label>
                  <Input defaultValue="AgentNemesis HQ" className="max-w-md bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="flex items-center gap-4">
                    <Input defaultValue="vashishthragini81@gmail.com" disabled className="max-w-md bg-muted/50" />
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/10">Verified</Badge>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <label className="text-sm font-medium">SigNoz API URL</label>
                  <Input defaultValue="https://glad-guppy.us2.signoz.cloud" type="url" className="max-w-md bg-background font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">The endpoint for fetching OpenTelemetry traces.</p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end">
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
