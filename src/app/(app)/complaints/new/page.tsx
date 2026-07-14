"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench, Upload, X, ImageIcon } from "lucide-react";
import { useAuth, RoleGuard } from "@/features/auth";
import { complaintsService, CATEGORY_LABEL, type ComplaintCategory, type Priority } from "@/features/complaints";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CATEGORIES: ComplaintCategory[] = ["ELECTRICAL", "PLUMBING", "WIFI", "FURNITURE", "CLEANING", "OTHER"];
const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function NewComplaintPage() {
  return (
    <RoleGuard allow={["STUDENT"]}>
      <NewComplaintForm />
    </RoleGuard>
  );
}

function NewComplaintForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [category, setCategory] = React.useState<ComplaintCategory>("WIFI");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("NORMAL");
  const [photos, setPhotos] = React.useState<Array<{ id: string; dataUrl: string; name: string; size: number }>>([]);
  const [loading, setLoading] = React.useState(false);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast({ title: `Max ${MAX_PHOTOS} photos`, tone: "warning" });
      return;
    }
    const accepted = arr.slice(0, remaining);
    const tooBig = accepted.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooBig.length > 0) {
      toast({
        title: "Some files are too large",
        description: `Max size is 5 MB. ${tooBig.length} skipped.`,
        tone: "warning",
      });
    }
    const valid = accepted.filter((f) => f.size <= MAX_FILE_SIZE && f.type.startsWith("image/"));
    const read = await Promise.all(
      valid.map(
        (f) =>
          new Promise<{ id: string; dataUrl: string; name: string; size: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                dataUrl: reader.result as string,
                name: f.name,
                size: f.size,
              });
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(f);
          })
      )
    );
    setPhotos((prev) => [...prev, ...read]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    // reset input so the same file can be picked again
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const c = await complaintsService.create({
        userId: user.id,
        userName: user.name,
        userRoom: user.roomNumber ? `Room ${user.roomNumber}${user.blockName ? ` / ${user.blockName}` : ""}` : undefined,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        photos: photos.map((p) => p.dataUrl),
      });
      toast({
        title: `Submitted — ticket ${c.id}`,
        description: "We'll notify you on updates.",
        tone: "success",
      });
      router.push("/complaints");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Raise a complaint</h1>
        <p className="text-muted text-sm">We'll assign it to the right person. You can track status live.</p>
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <GlassSurface intensity="strong" className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
                    category === c
                      ? "bg-primary/15 border border-primary text-primary"
                      : "bg-surface border border-border hover:bg-surface-2/40"
                  )}
                >
                  <span>{CATEGORY_LABEL[c]}</span>
                  {category === c && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary, e.g. WiFi drops in room 204"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When does it happen? How often? What have you tried?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
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

          {/* Photo upload — real file picker, max 4, with previews */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Photos</Label>
              <span className="text-xs text-muted">{photos.length} / {MAX_PHOTOS}</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="hidden"
            />

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.dataUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 hover:bg-danger grid place-items-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.name} · {(p.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length < MAX_PHOTOS && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center gap-2 text-muted">
                  <div className="h-10 w-10 rounded-xl neu grid place-items-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-text">Click or drag photos here</div>
                  <div className="text-xs">
                    Up to {MAX_PHOTOS - photos.length} more · max 5 MB each · image files only
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassSurface>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" variant="skeuo" loading={loading}>
            <Wrench className="h-4 w-4" /> Submit complaint
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
