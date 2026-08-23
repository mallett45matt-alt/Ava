import { requireSession } from "@/server/auth/require";
import { logOut } from "@/server/auth/actions";
import { updateBusinessName } from "@/server/data/business";
import { listStaff } from "@/server/data/staff";
import { setStaffActive } from "@/server/data/staff-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AddStaffForm } from "@/components/settings/AddStaffForm";

export default async function SettingsPage() {
  const session = await requireSession();
  const staff = await listStaff();

  return (
    <div>
      <PageHeader title="Settings" description="Your business, your team, your account." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm action={updateBusinessName} defaultValue={session.businessName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted">
              Add the people who do the work so you can assign jobs to them. They don&apos;t
              need to log in to Ava for this — it&apos;s just so their name shows up on the
              calendar.
            </p>

            {staff.length > 0 && (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {staff.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.name}</p>
                      {(member.phone || member.email) && (
                        <p className="truncate text-xs text-muted">
                          {[member.phone, member.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!member.active && <Badge tone="neutral">Inactive</Badge>}
                      <form action={setStaffActive.bind(null, member.id, !member.active)}>
                        <Button type="submit" variant="ghost" size="sm">
                          {member.active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AddStaffForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">{session.name}</p>
              <p className="text-muted">{session.email}</p>
            </div>
            <form action={logOut}>
              <Button type="submit" variant="secondary">
                Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
