'use client';

import SegmentedThemeToggle from '@/components/ui/SegmentedThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--auth-bg)">
      {/* Mesh gradient — top-left */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--auth-mesh-1) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      {/* Mesh gradient — bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--auth-mesh-2) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Auth card */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-(--auth-glass-border) bg-(--auth-glass-bg) p-8 shadow-xl shadow-black/5 dark:shadow-black/30 backdrop-blur-xl animate-[fade-in_0.4s_ease-out]">
        {children}

        {/* Theme toggle */}
        <div className="mt-6 flex justify-center">
          <SegmentedThemeToggle />
        </div>
      </div>
    </div>
  );
}
