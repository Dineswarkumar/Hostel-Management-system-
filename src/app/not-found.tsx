import Link from "next/link";
import { GlassSurface } from "@/components/glass/glass-surface";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-bg grid place-items-center p-4">
      <GlassSurface intensity="strong" className="p-8 md:p-12 text-center max-w-md w-full">
        <div className="text-7xl mb-4">🛏️</div>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted mt-2">
          We can't find what you were looking for. Maybe a typo, maybe a link
          that has been moved.
        </p>
        <div className="flex gap-2 justify-center mt-6">
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="skeuo">Dashboard</Button>
          </Link>
        </div>
      </GlassSurface>
    </div>
  );
}
