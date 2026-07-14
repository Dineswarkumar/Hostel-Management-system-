"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Hourglass,
  BusIcon,
} from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import {
  busService,
  BUS_STATUS_LABEL,
  BUS_STATUS_TONE,
  BUS_STATUS_ORDER,
  type Bus,
  type BusStatus,
} from "@/features/bus";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatTime, timeAgo, cn } from "@/lib/utils";

const STATUS_ICON: Record<BusStatus, React.ComponentType<{ className?: string }>> = {
  SCHEDULED: Hourglass,
  RUNNING: Loader2,
  LEFT: CheckCircle2,
  CANCELLED: XCircle,
  DELAYED: AlertCircle,
};

export default function BusPage() {
  return (
    <RoleGuard>
      <BusContent />
    </RoleGuard>
  );
}

function BusContent() {
  const { user } = useAuth();
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Bus | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { toast } = useToast();

  // Per-user votes (read from service initially, then updated optimistically)
  const [myVotes, setMyVotes] = React.useState<Record<string, "UP" | "DOWN">>({});

  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canVote = user?.role === "STUDENT";

  const refresh = React.useCallback(async () => {
    const list = await busService.list(user?.id);
    setBuses(list);
    if (user) {
      const v: Record<string, "UP" | "DOWN"> = {};
      list.forEach((b) => {
        const vote = busService.getUserVote(user.id, b.id);
        if (vote) v[b.id] = vote;
      });
      setMyVotes(v);
    }
    setLoading(false);
  }, [user]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource(`/api/realtime?userId=${user.id}`);

    es.addEventListener("NEW_BUS", () => {
      refresh();
    });
    es.addEventListener("UPDATE_BUS", (e: any) => {
      try {
        const updatedBus = JSON.parse(e.data);
        setBuses((curr) => curr.map((b) => (b.id === updatedBus.id ? updatedBus : b)));
      } catch {
        refresh();
      }
    });
    es.addEventListener("USER_VOTE_UPDATE", (e: any) => {
      try {
        const { busId, userId, userVote } = JSON.parse(e.data);
        if (userId === user.id) {
          setMyVotes((v) => {
            const next = { ...v };
            if (userVote) next[busId] = userVote;
            else delete next[busId];
            return next;
          });
        }
      } catch {}
    });
    es.addEventListener("DELETE_BUS", (e: any) => {
      try {
        const { id } = JSON.parse(e.data);
        setBuses((curr) => curr.filter((b) => b.id !== id));
      } catch {
        refresh();
      }
    });

    return () => {
      es.close();
    };
  }, [user, refresh]);

  // Open create form if ?new=1
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1" && canManage) setShowCreate(true);
  }, [canManage]);

  const handleVote = async (bus: Bus, type: "UP" | "DOWN") => {
    if (!user) return;
    // Optimistic update
    const previous = myVotes[bus.id];
    setMyVotes((v) => {
      const next = { ...v };
      if (v[bus.id] === type) delete next[bus.id];
      else next[bus.id] = type;
      return next;
    });
    // Adjust displayed counts optimistically
    setBuses((curr) =>
      curr.map((b) => {
        if (b.id !== bus.id) return b;
        let upvotes = b.upvotes;
        let downvotes = b.downvotes;
        if (previous === "UP") upvotes = Math.max(0, upvotes - 1);
        if (previous === "DOWN") downvotes = Math.max(0, downvotes - 1);
        if (previous !== type) {
          if (type === "UP") upvotes += 1;
          else downvotes += 1;
        }
        return { ...b, upvotes, downvotes };
      })
    );
    const { bus: updated, userVote } = await busService.vote(bus.id, user.id, type);
    if (updated) setBuses((curr) => curr.map((b) => (b.id === updated.id ? updated : b)));
    if (userVote) setMyVotes((v) => ({ ...v, [bus.id]: userVote }));
    else setMyVotes((v) => { const n = { ...v }; delete n[bus.id]; return n; });
  };

  const handleStatus = async (bus: Bus, status: BusStatus) => {
    setBusyId(bus.id);
    try {
      const updated = await busService.updateStatus(bus.id, status);
      if (updated) {
        setBuses((curr) => curr.map((b) => (b.id === updated.id ? updated : b)));
        toast({ title: `${updated.name} → ${BUS_STATUS_LABEL[status]}`, tone: "success" });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bus: Bus) => {
    if (!confirm(`Delete bus "${bus.name}"?`)) return;
    await busService.remove(bus.id);
    setBuses((curr) => curr.filter((b) => b.id !== bus.id));
    toast({ title: "Bus deleted", tone: "default" });
  };

  const handleCreate = async (data: { name: string; time: string; description: string }) => {
    if (!user) return;
    const created = await busService.create({ ...data, createdById: user.id, createdByName: user.name });
    setBuses((curr) => [created, ...curr]);
    setShowCreate(false);
    toast({ title: "Bus created", description: `${created.name} at ${formatTime(created.time)}`, tone: "success" });
  };

  const handleEdit = async (id: string, data: { name: string; time: string; description: string }) => {
    // Service doesn't have an explicit edit fn; we mutate the store via a generic update
    const updated = await busService.update(id, data);
    if (updated) {
      setBuses((curr) => curr.map((b) => (b.id === updated.id ? updated : b)));
      setEditing(null);
      toast({ title: "Bus updated", tone: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BusIcon className="h-7 w-7 text-primary" /> Bus
          </h1>
          <p className="text-muted text-sm">
            {canManage ? "Add buses, update live status, students vote below." : "Live bus schedule. Vote on buses you'll take."}
          </p>
        </div>
        {canManage && (
          <Button variant="skeuo" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" /> {showCreate ? "Cancel" : "Add bus"}
          </Button>
        )}
      </div>

      {showCreate && canManage && (
        <BusForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && canManage && (
        <BusForm
          initial={editing}
          onSubmit={(data) => handleEdit(editing.id, data)}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : buses.length === 0 ? (
        <GlassSurface className="p-12 text-center text-sm text-muted">
          No buses yet. {canManage && "Add one above."}
        </GlassSurface>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              myVote={myVotes[bus.id]}
              canManage={canManage}
              canVote={canVote}
              busy={busyId === bus.id}
              onVote={(t) => handleVote(bus, t)}
              onStatus={(s) => handleStatus(bus, s)}
              onEdit={() => setEditing(bus)}
              onDelete={() => handleDelete(bus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BusCard({
  bus, myVote, canManage, canVote, busy,
  onVote, onStatus, onEdit, onDelete,
}: {
  bus: Bus;
  myVote?: "UP" | "DOWN";
  canManage: boolean;
  canVote: boolean;
  busy: boolean;
  onVote: (type: "UP" | "DOWN") => void;
  onStatus: (s: BusStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const StatusIcon = STATUS_ICON[bus.status];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <GlassSurface className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{bus.name}</h3>
                  <Badge tone={BUS_STATUS_TONE[bus.status]} className="shrink-0">
                    <StatusIcon className={"h-3 w-3 " + (bus.status === "RUNNING" ? "animate-spin" : "")} />
                    {BUS_STATUS_LABEL[bus.status]}
                  </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono font-semibold text-text">{formatTime(bus.time)}</span>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit bus">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete bus">
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-muted leading-relaxed">{bus.description}</p>

        <div className="text-xs text-muted mt-2">
          Updated {timeAgo(bus.updatedAt)}
        </div>

        {/* Status controls (admin only) */}
        {canManage && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="text-xs text-muted mb-2">Update status</div>
            <div className="flex flex-wrap gap-1.5">
              {BUS_STATUS_ORDER.map((s) => {
                const active = bus.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onStatus(s)}
                    disabled={busy}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-2 text-muted hover:text-text border border-border"
                    )}
                  >
                    {BUS_STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Voting (students only) */}
        {canVote && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onVote("UP")}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                myVote === "UP" ? "neu-inset text-success" : "neu hover:brightness-105"
              )}
              aria-pressed={myVote === "UP"}
            >
              <ThumbsUp className="h-4 w-4" /> {bus.upvotes}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onVote("DOWN")}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                myVote === "DOWN" ? "neu-inset text-danger" : "neu hover:brightness-105"
              )}
              aria-pressed={myVote === "DOWN"}
            >
              <ThumbsDown className="h-4 w-4" /> {bus.downvotes}
            </motion.button>
          </div>
        )}
      </GlassSurface>
    </motion.div>
  );
}

function BusForm({
  initial, onSubmit, onCancel,
}: {
  initial?: Bus;
  onSubmit: (data: { name: string; time: string; description: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [time, setTime] = React.useState(initial?.time ?? "07:30");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const valid = name.trim().length > 1 && /^\d{1,2}:\d{2}$/.test(time) && description.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast({ title: "Check the form", description: "Name, valid time, and description are required.", tone: "warning" });
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name, time, description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <GlassSurface intensity="strong" className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bus-name">Bus name</Label>
            <Input
              id="bus-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Center"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bus-time">Time (24h, HH:MM)</Label>
            <Input
              id="bus-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="07:30"
              pattern="^\d{1,2}:\d{2}$"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bus-desc">Description</Label>
          <Textarea
            id="bus-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pickup and drop between…"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="skeuo" loading={loading}>
            {initial ? <><Check className="h-4 w-4" /> Save</> : <><Plus className="h-4 w-4" /> Add bus</>}
          </Button>
        </div>
      </GlassSurface>
    </motion.form>
  );
}
