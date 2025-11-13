'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STATUS_LABEL = {
  pending: 'Pending',
  verified: 'Verified',
  registered: 'Registered',
};

export default function DeleteConfirmationDialog({ open, context, onConfirm, onCancel }) {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleOpenChange = (value) => {
    if (!value) {
      onCancel?.();
    }
  };

  const mode = context?.mode ?? 'single';
  const submission = context?.submission ?? {};
  const summary = context?.summary;
  const statusCount = summary?.statusCount ?? {};

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-destructive">
            {mode === 'bulk' ? `Hapus ${summary?.count ?? 0} User` : 'Hapus User'}
          </DialogTitle>
          <DialogDescription>
            Penghapusan bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda sudah mengecek data kandidat
            yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Semua data terkait kandidat akan hilang (CV, dokumen, kredensial, dan akun Supabase).
          </div>

          {mode === 'single' ? (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium text-foreground">{submission.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{submission.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground">
                  {STATUS_LABEL[submission.status] ?? submission.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total User</span>
                <span className="font-medium text-foreground">{summary?.count ?? 0}</span>
              </div>
              {['pending', 'verified', 'registered'].map((key) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{STATUS_LABEL[key] ?? key}</span>
                  <span className="font-medium text-foreground">{statusCount?.[key] ?? 0}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-4">
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} className="h-11 px-6">
              Konfirmasi Hapus
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
