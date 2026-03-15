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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {stats && (
        <>
          <StatsBar stats={stats} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ApplicationsChart data={stats.monthlyApplications} />
            <StatusChart statusBreakdown={stats.statusBreakdown} />
          </div>
        </>
      )}

      <ApplicationsTable onDataChange={fetchStats} />
    </div>
  );
}
