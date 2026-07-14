"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, UserPlus, ShieldCheck, Wrench, GraduationCap, Code2, Edit2, Trash2, X } from "lucide-react";
import { useAuth, RoleGuard, ROLE_LABEL, type Role } from "@/features/auth";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  STUDENT: GraduationCap,
  STAFF: Wrench,
  ADMIN: ShieldCheck,
  SUPER_ADMIN: Code2,
};

export default function AdminUsersPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPER_ADMIN"]}>
      <UsersContent />
    </RoleGuard>
  );
}

function UsersContent() {
  const { user } = useAuth();
  const [query, setQuery] = React.useState("");
  const [selectedRoom, setSelectedRoom] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const { toast } = useToast();

  const isSuperAdmin = user?.role === "SUPER_ADMIN"; // Developer Account rights

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      toast({ title: "Failed to list users", description: e.message, tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user account? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast({ title: "User deleted", tone: "success" });
      refresh();
      setSelectedUser(null);
    } catch (e: any) {
      toast({ title: "Deletion failed", description: e.message, tone: "danger" });
    }
  };

  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(query.toLowerCase())) ||
      (u.roomNumber && u.roomNumber.toLowerCase().includes(query.toLowerCase()));

    const matchesRoom = !selectedRoom || u.roomNumber === selectedRoom;
    return matchesQuery && matchesRoom;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.roomNumber && b.roomNumber) {
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" });
    }
    return a.roomNumber ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Users
          </h1>
          <p className="text-muted text-sm">Manage students, wardens, staff, and administrators.</p>
        </div>
        {isSuperAdmin && (
          <Button variant="skeuo" onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Add user
          </Button>
        )}
      </div>

      <GlassSurface className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="pl-10"
          />
        </div>
      </GlassSurface>

      {selectedRoom && (
        <div className="flex items-center justify-between bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-2.5 text-xs">
          <span className="font-medium">
            Filtering list to Room {selectedRoom} ({sorted.filter((u) => u.role === "STUDENT").length} students)
          </span>
          <button
            onClick={() => setSelectedRoom(null)}
            className="font-bold hover:text-primary-fg bg-primary/15 hover:bg-primary px-2 py-0.5 rounded-lg transition-all"
          >
            Clear Filter ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : sorted.length === 0 ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No users match your search.
        </GlassSurface>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((u) => {
            const Icon = ROLE_ICON[u.role as Role] || GraduationCap;
            return (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassSurface
                  className={cn(
                    "p-4 flex items-center justify-between gap-4 transition-all",
                    isSuperAdmin ? "hover:border-primary/30 cursor-pointer group" : ""
                  )}
                  onClick={() => isSuperAdmin && setSelectedUser(u)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl neu grid place-items-center text-sm font-semibold shrink-0 group-hover:bg-primary/10 transition-colors">
                      {u.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        {u.name}
                        {u.id === user?.id && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-normal">You</span>}
                      </div>
                      <div className="text-xs text-muted truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col text-right text-xs">
                      {u.roomNumber && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoom(u.roomNumber === selectedRoom ? null : u.roomNumber);
                          }}
                          className="text-text font-medium hover:text-primary hover:underline cursor-pointer bg-surface-2 px-2 py-0.5 rounded-lg border border-border/30 transition-colors"
                          title="Click to view roommates"
                        >
                          Room {u.roomNumber}
                        </span>
                      )}
                      {u.blockName && <span className="text-muted text-[10px] mt-0.5">{u.blockName}</span>}
                    </div>
                    <Badge tone="primary" className="flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {ROLE_LABEL[u.role as Role]}
                    </Badge>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </GlassSurface>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <UserAddModal
            onClose={() => setIsAddOpen(false)}
            onSave={() => {
              setIsAddOpen(false);
              refresh();
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSave={() => {
              setSelectedUser(null);
              refresh();
            }}
            onDelete={() => handleDelete(selectedUser.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserAddModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("demo1234");
  const [role, setRole] = React.useState<Role>("STUDENT");
  const [phone, setPhone] = React.useState("");
  const [roomNumber, setRoomNumber] = React.useState("");
  const [blockName, setBlockName] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          phone,
          roomNumber,
          blockName,
          parentPhone,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }

      toast({ title: "User created successfully", tone: "success" });
      onSave();
    } catch (e: any) {
      toast({ title: "Creation failed", description: e.message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative max-w-lg w-full max-h-[90vh] overflow-hidden z-10">
        <GlassSurface intensity="strong" className="p-6 flex flex-col max-h-[90vh] border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <h2 className="font-bold text-lg flex items-center gap-1.5"><UserPlus className="h-5 w-5 text-primary" /> Add New User</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-text"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="add-name">Full Name</Label>
                  <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-email">Email Address</Label>
                  <Input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="add-password">Initial Password</Label>
                  <Input id="add-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-role">Role</Label>
                  <select
                    id="add-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff / Warden</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SUPER_ADMIN">Developer (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="add-phone">Phone Number (Mobile)</Label>
                <Input id="add-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="add-room">Room Number</Label>
                  <Input id="add-room" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 204" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-block">Block Name</Label>
                  <Input id="add-block" value={blockName} onChange={(e) => setBlockName(e.target.value)} placeholder="e.g. Block B" />
                </div>
              </div>

              {role === "STUDENT" && (
                <div className="space-y-1">
                  <Label htmlFor="add-parent">Parent Phone Number</Label>
                  <Input id="add-parent" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border/40 justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" variant="skeuo" loading={saving}>Create User</Button>
            </div>
          </form>
        </GlassSurface>
      </motion.div>
    </div>
  );
}

function UserEditModal({ user, onClose, onSave, onDelete }: { user: any; onClose: () => void; onSave: () => void; onDelete: () => void }) {
  const [name, setName] = React.useState(user.name || "");
  const [email, setEmail] = React.useState(user.email || "");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>(user.role as Role);
  const [phone, setPhone] = React.useState(user.phone || "");
  const [roomNumber, setRoomNumber] = React.useState(user.roomNumber || "");
  const [blockName, setBlockName] = React.useState(user.blockName || "");
  const [parentPhone, setParentPhone] = React.useState(user.parentPhone || "");
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password: password.trim() ? password : undefined,
          role,
          phone,
          roomNumber,
          blockName,
          parentPhone,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }

      toast({ title: "User details updated", tone: "success" });
      onSave();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative max-w-lg w-full max-h-[90vh] overflow-hidden z-10">
        <GlassSurface intensity="strong" className="p-6 flex flex-col max-h-[90vh] border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <h2 className="font-bold text-lg flex items-center gap-1.5"><Edit2 className="h-4 w-4 text-primary" /> Edit User details</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-text"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-password">Password (leave blank to keep)</Label>
                  <Input id="edit-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Keep unchanged" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-role">Role</Label>
                  <select
                    id="edit-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff / Warden</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SUPER_ADMIN">Developer (Super Admin)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-phone">Phone Number (Mobile)</Label>
                <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-room">Room Number</Label>
                  <Input id="edit-room" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-block">Block Name</Label>
                  <Input id="edit-block" value={blockName} onChange={(e) => setBlockName(e.target.value)} />
                </div>
              </div>

              {role === "STUDENT" && (
                <div className="space-y-1">
                  <Label htmlFor="edit-parent">Parent Phone Number</Label>
                  <Input id="edit-parent" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border/40 justify-between items-center">
              <Button type="button" variant="neu" onClick={onDelete} className="text-danger flex items-center gap-1">
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="skeuo" loading={saving}>Save Changes</Button>
              </div>
            </div>
          </form>
        </GlassSurface>
      </motion.div>
    </div>
  );
}
