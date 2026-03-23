"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FieldGroup, 
  Field, 
  FieldLabel, 
  FieldDescription 
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your error tracking preferences and integrations
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium text-card-foreground mb-6">
                General Settings
              </h3>
              <FieldGroup>
                <Field>
                  <FieldLabel>Organization Name</FieldLabel>
                  <Input 
                    defaultValue="Acme Corp" 
                    className="bg-secondary border-border max-w-md"
                  />
                </Field>

                <Field>
                  <FieldLabel>Default Environment</FieldLabel>
                  <Select defaultValue="production">
                    <SelectTrigger className="w-48 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Timezone</FieldLabel>
                  <Select defaultValue="utc">
                    <SelectTrigger className="w-64 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="cet">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium text-card-foreground mb-6">
                Data Retention
              </h3>
              <FieldGroup>
                <Field>
                  <FieldLabel>Error Data Retention</FieldLabel>
                  <FieldDescription>
                    How long to keep error event data
                  </FieldDescription>
                  <Select defaultValue="90">
                    <SelectTrigger className="w-48 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium text-card-foreground mb-6">
                Alert Notifications
              </h3>
              <FieldGroup>
                <Field className="flex items-center justify-between">
                  <div>
                    <FieldLabel>Email Notifications</FieldLabel>
                    <FieldDescription>
                      Receive email alerts for critical errors
                    </FieldDescription>
                  </div>
                  <Switch defaultChecked />
                </Field>

                <Field className="flex items-center justify-between">
                  <div>
                    <FieldLabel>Slack Notifications</FieldLabel>
                    <FieldDescription>
                      Send alerts to your Slack workspace
                    </FieldDescription>
                  </div>
                  <Switch defaultChecked />
                </Field>

                <Field className="flex items-center justify-between">
                  <div>
                    <FieldLabel>Weekly Digest</FieldLabel>
                    <FieldDescription>
                      Receive a weekly summary of errors
                    </FieldDescription>
                  </div>
                  <Switch />
                </Field>
              </FieldGroup>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium text-card-foreground mb-6">
                Alert Thresholds
              </h3>
              <FieldGroup>
                <Field>
                  <FieldLabel>Error Rate Alert</FieldLabel>
                  <FieldDescription>
                    Trigger an alert when error rate exceeds this percentage
                  </FieldDescription>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      defaultValue="5" 
                      className="w-20 bg-secondary border-border"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>New Error Alert</FieldLabel>
                  <FieldDescription>
                    Get notified when a new error type is detected
                  </FieldDescription>
                  <Switch defaultChecked />
                </Field>
              </FieldGroup>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-medium text-card-foreground mb-6">
                Connected Integrations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-[#4A154B] flex items-center justify-center text-primary font-bold">
                      S
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">Slack</p>
                      <p className="text-sm text-muted-foreground">
                        Connected to #engineering-alerts
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-[#171515] flex items-center justify-center text-primary font-bold">
                      G
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">GitHub</p>
                      <p className="text-sm text-muted-foreground">
                        Auto-create issues for new errors
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                      +
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">Add Integration</p>
                      <p className="text-sm text-muted-foreground">
                        Connect more tools to your workflow
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Browse</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-card-foreground">
                  Team Members
                </h3>
                <Button size="sm">Invite Member</Button>
              </div>
              <div className="space-y-3">
                {['John Doe', 'Jane Smith', 'Alex Johnson'].map((name, i) => (
                  <div 
                    key={name} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                        {name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {name.toLowerCase().replace(' ', '.')}@acme.com
                        </p>
                      </div>
                    </div>
                    <Select defaultValue={i === 0 ? 'admin' : 'member'}>
                      <SelectTrigger className="w-28 h-8 bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
