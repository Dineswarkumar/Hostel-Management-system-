export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen mesh-bg grid place-items-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
