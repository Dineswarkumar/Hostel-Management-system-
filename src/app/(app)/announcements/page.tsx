"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pin, Trash2, Plus, Megaphone, AlertTriangle } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import {
  announcementsService,
  type Announcement,
  type Priority,
} from "@/features/announcements";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo, cn } from "@/lib/utils";

export default function AnnouncementsPage() {
  return (
    <RoleGuard>
      <AnnouncementsContent />
    </RoleGuard>
  );
}

function AnnouncementsContent() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const { toast } = useToast();

  const refresh = React.useCallback(() => {
    if (!user) return;
    announcementsService.list({ viewerRole: user.role }).then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, [user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!user) return;
    const es = new EventSource(`/api/realtime?userId=${user.id}`);

    const handleUpdate = () => {
      refresh();
    };

    es.addEventListener("NEW_ANNOUNCEMENT", handleUpdate);
    es.addEventListener("UPDATE_ANNOUNCEMENT", handleUpdate);
    es.addEventListener("DELETE_ANNOUNCEMENT", handleUpdate);

    return () => {
      es.close();
    };
  }, [user, refresh]);

  // Auto-open form if ?new=1
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") setShowForm(true);
  }, []);

  const canPost = !!user && (user.role === "ADMIN" || user.role === "STAFF" || user.role === "SUPER_ADMIN");

  const handleCreate = async (data: {
    title: string;
    body: string;
    priority: Priority;
    pinned: boolean;
  }) => {
    if (!user) return;
    await announcementsService.create({
      ...data,
      postedById: user.id,
      postedByName: user.name,
    });
    toast({ title: "Announcement posted", tone: "success" });
    setShowForm(false);
    refresh();
  };

  const handleTogglePin = async (id: string) => {
    await announcementsService.togglePin(id);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await announcementsService.remove(id);
    toast({ title: "Announcement removed", tone: "default" });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Announcements</h1>
          <p className="text-muted text-sm">Notices from staff and administration.</p>
        </div>
        {canPost && (
          <Button variant="skeuo" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New announcement"}
          </Button>
        )}
      </div>

      {showForm && canPost && user && (
        <NewAnnouncementForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AnnouncementCard
                a={a}
                canManage={canPost}
                onTogglePin={() => handleTogglePin(a.id)}
                onDelete={() => handleDelete(a.id)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  a, canManage, onTogglePin, onDelete,
}: {
  a: Announcement;
  canManage: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const priorityTone = {
    LOW: "default",
    NORMAL: "primary",
    HIGH: "warning",
    URGENT: "danger",
  }[a.priority] as "default" | "primary" | "warning" | "danger";

  return (
    <GlassSurface className="p-5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl grid place-items-center shrink-0",
            a.priority === "URGENT" ? "skeuo-btn-accent" : "skeuo-btn"
          )}
        >
          {a.priority === "URGENT" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Megaphone className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{a.title}</h3>
            {a.pinned && <Badge tone="primary">📌 Pinned</Badge>}
            <Badge tone={priorityTone}>{a.priority}</Badge>
            {a.targetRole && <Badge tone="accent">For {a.targetRole}</Badge>}
          </div>
          <p className="text-sm text-muted mt-1 whitespace-pre-line">{a.body}</p>
          <div className="text-xs text-muted mt-3">
            {a.postedByName} · {timeAgo(a.createdAt)}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onTogglePin} aria-label="Toggle pin">
              <Pin className={"h-4 w-4 " + (a.pinned ? "text-primary" : "")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        )}
      </div>
    </GlassSurface>
  );
}

function NewAnnouncementForm({
  onSubmit, onCancel,
}: {
  onSubmit: (data: { title: string; body: string; priority: Priority; pinned: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("NORMAL");
  const [pinned, setPinned] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim(), priority, pinned });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <GlassSurface intensity="strong" className="p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water tank cleaning Sunday 10 AM"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Details</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add the full message…"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex flex-wrap gap-2">
              {(["LOW", "NORMAL", "HIGH", "URGENT"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    priority === p ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pin to top</Label>
            <button
              type="button"
              onClick={() => setPinned((v) => !v)}
              className={cn(
                "h-9 px-4 rounded-xl text-sm font-medium transition-colors",
                pinned ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"
              )}
            >
              {pinned ? "📌 Pinned" : "Not pinned"}
            </button>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="skeuo" loading={loading}>Post announcement</Button>
        </div>
      </GlassSurface>
    </motion.form>
  );
}

function EmptyState() {
  return (
    <GlassSurface className="p-12 text-center">
      <div className="text-4xl mb-2">📭</div>
      <div className="font-medium">No announcements yet</div>
      <div className="text-sm text-muted mt-1">You'll see them here when posted.</div>
    </GlassSurface>
  );
}
