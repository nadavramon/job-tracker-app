'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { getProfile, updateProfile } from '@/lib/userService';
import { UserProfileResponse, UpdateProfileRequest } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ProfileErrors {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

function validate(
    showPasswordFields: boolean,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
): ProfileErrors {
    const errors: ProfileErrors = {};

    if (showPasswordFields) {
        if (!currentPassword) {
            errors.currentPassword = 'Enter your current password';
        }
        if (newPassword.length < 8 || newPassword.length > 14) {
            errors.newPassword = 'Password must be 8–14 characters';
        } else if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
    }

    return errors;
}

export default function ProfileSection() {
    const { toast } = useToast();

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<ProfileErrors>({});

    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const p = await getProfile();
                setProfile(p);
                setEmail(p.email);
            } catch {
                setLoadError('Failed to load profile. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const togglePasswordFields = useCallback(() => {
        setShowPasswordFields(v => !v);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
    }, []);

    const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }, []);

    const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPassword(e.target.value);
        setErrors(prev => ({ ...prev, currentPassword: undefined }));
    }, []);

    const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewPassword(e.target.value);
        setErrors(prev => ({ ...prev, newPassword: undefined }));
    }, []);

    const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }, []);

    const handleSave = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(showPasswordFields, currentPassword, newPassword, confirmPassword);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        const payload: UpdateProfileRequest = {};
        if (email !== profile?.email) payload.email = email;
        if (showPasswordFields && newPassword) {
            payload.currentPassword = currentPassword;
            payload.password = newPassword;
        }

        if (Object.keys(payload).length === 0) {
            toast.info('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const updated = await updateProfile(payload);
            setProfile(updated);
            setEmail(updated.email);
            toast.success('Profile updated');
            if (showPasswordFields) {
                setShowPasswordFields(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    }, [email, profile, showPasswordFields, currentPassword, newPassword, confirmPassword, toast]);

    if (loading) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                <div className="h-4 w-16 rounded bg-[var(--muted)] animate-pulse" />
                <div className="h-10 rounded bg-[var(--muted)] animate-pulse" />
                <div className="h-10 rounded bg-[var(--muted)] animate-pulse" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
                <p className="text-sm text-[var(--destructive)]">{loadError}</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <div>
                <h2 id="profile-heading" className="text-base font-semibold text-[var(--foreground)]">Profile</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Update your email address and password.
                </p>
            </div>

            <form onSubmit={handleSave} noValidate className="space-y-4">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@example.com"
                />

                {!showPasswordFields ? (
                    <button
                        type="button"
                        onClick={togglePasswordFields}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
                    >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Change password
                    </button>
                ) : (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                Change Password
                            </p>
                            <button
                                type="button"
                                onClick={togglePasswordFields}
                                className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                                Cancel
                            </button>
                        </div>
                        <Input
                            label="Current password"
                            type="password"
                            value={currentPassword}
                            onChange={handleCurrentPasswordChange}
                            error={errors.currentPassword}
                            placeholder="Your current password"
                        />
                        <Input
                            label="New password"
                            type="password"
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            error={errors.newPassword}
                            placeholder="8–14 characters"
                        />
                        <Input
                            label="Confirm new password"
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            error={errors.confirmPassword}
                            placeholder="Repeat new password"
                        />
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button type="submit" loading={saving}>
                        Save changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
