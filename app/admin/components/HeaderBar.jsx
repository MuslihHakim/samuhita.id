'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function HeaderBar({ onSyncSheets, onLogout, showBackToAdmin = false }) {
  const router = useRouter();
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [paymentsPassword, setPaymentsPassword] = useState('');
  const [paymentsError, setPaymentsError] = useState('');
  const [paymentsSubmitting, setPaymentsSubmitting] = useState(false);

  const resetPaymentsState = () => {
    setPaymentsPassword('');
    setPaymentsError('');
    setPaymentsSubmitting(false);
  };

  const handleOpenPaymentsDialog = () => {
    resetPaymentsState();
    setPaymentsDialogOpen(true);
  };

  const handlePaymentsDialogChange = (open) => {
    setPaymentsDialogOpen(open);
    if (!open) {
      resetPaymentsState();
    }
  };

  const handlePaymentsAccess = async (event) => {
    event.preventDefault();
    if (paymentsSubmitting) {
      return;
    }
    if (!paymentsPassword.trim()) {
      setPaymentsError('Password wajib diisi');
      return;
    }

    setPaymentsSubmitting(true);
    setPaymentsError('');

    try {
      const response = await fetch('/api/admin/payments/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: paymentsPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setPaymentsError(data?.error || 'Password salah');
        return;
      }

      const redirectTargetParam =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('paymentsRedirect') ?? ''
          : '';
      const sanitizedRedirect =
        typeof redirectTargetParam === 'string' && redirectTargetParam.startsWith('/admin')
          ? redirectTargetParam
          : '/admin/payments';

      resetPaymentsState();
      setPaymentsDialogOpen(false);
      router.push(sanitizedRedirect);
    } catch (error) {
      console.error('Failed to verify payments password:', error);
      setPaymentsError('Terjadi kesalahan, coba lagi.');
    } finally {
      setPaymentsSubmitting(false);
    }
  };

  return (
    <>
      <header className="bg-card/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50 dark:bg-card/95 dark:border-border/60">
        <div className="container mx-auto px-4 py-3 sm:py-4 md:py-4 lg:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-xl">A</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Kelola Pendaftaran</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {showBackToAdmin && (
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/40 text-foreground hover:bg-muted/50 transition-all duration-200 min-h-[44px] px-2 sm:px-3"
                >
                  <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Admin</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            )}
            <div className="hidden sm:block">
              <Button
                onClick={handleOpenPaymentsDialog}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 min-h-[44px] px-2 sm:px-3"
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-8c2.21 0 4 .895 4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Payments</span>
              </Button>
            </div>
            <ThemeToggle />
            <Button
              onClick={onSyncSheets}
              variant="outline"
              size="sm"
              className="border-success/20 text-success hover:bg-success/10 hover:border-success/30 transition-all duration-200 min-h-[44px] px-2 sm:px-3"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Sync Sheets</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 min-h-[44px] px-2 sm:px-3"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={paymentsDialogOpen} onOpenChange={handlePaymentsDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan Password Payments</DialogTitle>
            <DialogDescription>
              Password diperlukan sebelum membuka halaman Payments.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePaymentsAccess}>
            <div className="grid gap-2">
              <Label htmlFor="payments-password">Password</Label>
              <Input
                id="payments-password"
                type="password"
                autoComplete="current-password"
                value={paymentsPassword}
                onChange={(event) => setPaymentsPassword(event.target.value)}
                disabled={paymentsSubmitting}
              />
            </div>
            {paymentsError && <p className="text-sm text-destructive">{paymentsError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePaymentsDialogChange(false)}
                className="min-h-[36px]"
                disabled={paymentsSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={paymentsSubmitting} className="min-h-[36px]">
                {paymentsSubmitting ? 'Memeriksa...' : 'Masuk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
