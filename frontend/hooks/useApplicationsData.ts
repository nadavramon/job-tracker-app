'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteApplication, getApplications } from '@/lib/applicationService';
import { Application, PagedResponse, Status } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';

type SortDir = 'asc' | 'desc';
type PageSize = 10 | 20 | 50;

interface UseApplicationsDataOptions {
    onDataChange?: () => void;
}

export default function useApplicationsData({ onDataChange }: UseApplicationsDataOptions = {}) {
    const { toast } = useToast();

    const [page, setPage]                         = useState(0);
    const [pageSize, setPageSize]                 = useState<PageSize>(20);
    const [sortDir, setSortDir]                   = useState<SortDir>('desc');
    const [search, setSearch]                     = useState('');
    const [statusFilter, setStatusFilter]         = useState<Status | ''>('');
    const [data, setData]                         = useState<PagedResponse<Application> | null>(null);
    const [loading, setLoading]                   = useState(true);
    const [error, setError]                       = useState('');
    const [pendingDeleteApp, setPendingDeleteApp] = useState<Application | null>(null);
    const [deleting, setDeleting]                 = useState(false);
    const [editingApp, setEditingApp]             = useState<Application | null>(null);

    const fetchPage = useCallback(async (
        p: number,
        sz: number,
        sort: string,
        srch: string,
        status: string,
    ) => {
        setLoading(true);
        setError('');
        try {
            const result = await getApplications(
                p, sz, sort,
                srch || undefined,
                status || undefined,
            );
            setData(result);
        } catch {
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(page, pageSize, `appliedDate,${sortDir}`, search, statusFilter);
    }, [page, pageSize, sortDir, search, statusFilter, fetchPage]);

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val);
        setPage(0);
    }, []);

    const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value as Status | '');
        setPage(0);
    }, []);

    const handleSortToggle = useCallback(() => {
        setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'));
        setPage(0);
    }, []);

    const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value) as PageSize);
        setPage(0);
    }, []);

    const handlePageChange = useCallback((p: number) => {
        setPage(p);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!pendingDeleteApp) return;
        setDeleting(true);
        try {
            await deleteApplication(pendingDeleteApp.id);
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    content: prev.content.filter(a => a.id !== pendingDeleteApp.id),
                    page: { ...prev.page, totalElements: prev.page.totalElements - 1 },
                };
            });
            toast.success('Application deleted');
            setPendingDeleteApp(null);
            onDataChange?.();
        } catch (error) {
            toast.error(getErrorMessage(error));
            setPendingDeleteApp(null);
        } finally {
            setDeleting(false);
        }
    }, [pendingDeleteApp, toast, onDataChange]);

    const handleDeleteCancel = useCallback(() => {
        setPendingDeleteApp(null);
    }, []);

    const handleRowStatusChange = useCallback((id: string, newStatus: Status) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                content: prev.content.map(app =>
                    app.id === id ? { ...app, status: newStatus } : app,
                ),
            };
        });
        onDataChange?.();
    }, [onDataChange]);

    const handleEditSaved = useCallback((updated: Application) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                content: prev.content.map(app => app.id === updated.id ? updated : app),
            };
        });
        onDataChange?.();
    }, [onDataChange]);

    const retry = useCallback(() => {
        fetchPage(page, pageSize, `appliedDate,${sortDir}`, search, statusFilter);
    }, [fetchPage, page, pageSize, sortDir, search, statusFilter]);

    return {
        data,
        loading,
        error,
        page,
        pageSize,
        sortDir,
        search,
        statusFilter,
        pendingDeleteApp,
        setPendingDeleteApp,
        editingApp,
        setEditingApp,
        deleting,
        handleSearchChange,
        handleStatusFilterChange,
        handleSortToggle,
        handlePageSizeChange,
        handlePageChange,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleRowStatusChange,
        handleEditSaved,
        retry,
    };
}
