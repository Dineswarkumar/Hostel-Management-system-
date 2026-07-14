"use client";

import * as React from "react";
import { User as UserIcon, Mail, Phone, Shield, LogOut, Edit2 } from "lucide-react";
import { useAuth, RoleGuard, ROLE_LABEL } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function AccountPage() {
  return (
    <RoleGuard>
      <Content />
    </RoleGuard>
  );
}

function Content() {
  const { user, signOut, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [roomNumber, setRoomNumber] = React.useState("");
  const [blockName, setBlockName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRoomNumber(user.roomNumber || "");
      setBlockName(user.blockName || "");
    }
  }, [user, isEditing]);

  if (!user) return null;

  const isStudent = user.role === "STUDENT";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: isStudent ? undefined : name,
          email: isStudent ? undefined : email,
          phone: isStudent ? undefined : phone,
          roomNumber,
          blockName: isStudent ? undefined : blockName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile");
      }

      const updatedUser = await res.json();
      updateUser(updatedUser);
      toast({ title: "Profile updated", description: "Changes saved successfully.", tone: "success" });
      setIsEditing(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "Failed to save profile.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
          <p className="text-muted text-sm">Your account details.</p>
        </div>
        {!isEditing && (
          <Button variant="neu" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5">
            <Edit2 className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <GlassSurface intensity="strong" className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl neu grid place-items-center text-xl font-bold">
            {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">{user.name}</div>
            <div className="text-sm text-muted">{user.email}</div>
            <Badge tone="primary" className="mt-2">
              <Shield className="h-3 w-3" /> {ROLE_LABEL[user.role]}
            </Badge>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prof-name">Name</Label>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isStudent}
                  required
                />
                {isStudent && <span className="text-[11px] text-muted block">Student name is fixed and cannot be changed.</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-email">Email Address</Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isStudent}
                  required
                />
                {isStudent && <span className="text-[11px] text-muted block">Student email is fixed and cannot be changed.</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prof-phone">Phone Number</Label>
                <Input
                  id="prof-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isStudent}
                />
                {isStudent && <span className="text-[11px] text-muted block">Student mobile number is fixed and cannot be changed.</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prof-room">Room Number</Label>
                  <Input
                    id="prof-room"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>
                {!isStudent && (
                  <div className="space-y-2">
                    <Label htmlFor="prof-block">Block Name</Label>
                    <Input
                      id="prof-block"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border/40 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="skeuo" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <Row icon={UserIcon} label="Name" value={user.name} />
            <Row icon={Mail} label="Email" value={user.email} />
            {user.phone && <Row icon={Phone} label="Phone" value={user.phone} />}
            {(user.roomNumber || user.blockName) && (
              <Row
                icon={Shield}
                label="Room & Block"
                value={`${user.roomNumber ? `Room ${user.roomNumber}` : ""}${
                  user.blockName ? ` / ${user.blockName}` : ""
                }`}
              />
            )}
          </div>
        )}
      </GlassSurface>

      {!isEditing && (
        <Button variant="ghost" onClick={() => signOut()} className="text-danger">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40">
      <Icon className="h-4 w-4 text-muted" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
