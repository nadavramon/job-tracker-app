'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStats } from '@/lib/applicationService';
import { isAuthenticated } from '@/lib/auth';
import { StatsResponse } from '@/types';
import Spinner from '@/components/ui/Spinner';
import StatsBar from '@/components/dashboard/StatsBar';
import ApplicationsChart from '@/components/dashboard/ApplicationsChart';
import StatusChart from '@/components/dashboard/StatusChart';
import ApplicationsTable from '@/components/applications/ApplicationsTable';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [router, fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="dashboard-scope relative min-h-full">
      <div
        className="-mx-4 -mt-8 px-4 pt-8 pb-8"
        style={{ background: 'var(--dash-bg)' }}
      >
        {/* Mesh gradient — top-left */}
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--dash-mesh-1) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        {/* Mesh gradient — bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--dash-mesh-2) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto space-y-8">
          {/* Page header */}
          <div className="animate-[fade-in_0.4s_ease-out]">
            <h1 className="text-2xl font-bold text-[var(--dash-heading)]">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--dash-subtext)]">
              Track your job application progress
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--dash-card-border)] bg-[var(--dash-card)] px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {stats && (
            <>
              <StatsBar stats={stats} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ApplicationsChart data={stats.monthlyApplications} />
                </div>
                <StatusChart statusBreakdown={stats.statusBreakdown} />
              </div>
            </>
          )}

          <ApplicationsTable onDataChange={fetchStats} title="Application Tracker" />
        </div>
      </div>
    </div>
  );
}
