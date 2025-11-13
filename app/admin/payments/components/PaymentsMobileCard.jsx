'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function PaymentsMobileCard({
  submission,
  selected,
  onSelect,
  onNavigatePayment,
}) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card dark:border-border/60">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {submission.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{submission.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{submission.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          Created: <span className="text-foreground">{submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : '-'}</span>
        </p>
        <p>
          Add By: <span className="text-foreground">{submission.addedBy?.trim() ? submission.addedBy : 'Unassigned'}</span>
        </p>
        <p>
          Coordinator: <span className="text-foreground">{submission.coordinator?.trim() ? submission.coordinator : 'Unassigned'}</span>
        </p>
        <p>
          Sent To: <span className="text-foreground">{submission.sentTo?.trim() ? submission.sentTo : 'Unassigned'}</span>
        </p>
        <p>
          Profession: <span className="text-foreground">{submission.profession?.trim() ? submission.profession : 'Unassigned'}</span>
        </p>
        <p>
          Placement: <span className="text-foreground">{submission.placement?.trim() ? submission.placement : 'Unassigned'}</span>
        </p>
        <p>
          Payment For:{' '}
          <span className={submission.latestPaymentFor ? 'text-foreground' : 'text-muted-foreground'}>
            {submission.latestPaymentFor || 'Belum ada'}
          </span>
        </p>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button
          size="sm"
          onClick={() => onNavigatePayment(submission.id)}
          variant="outline"
          className="flex-1 border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 min-h-[36px] text-xs"
        >
          payment
        </Button>
      </div>
    </div>
  );
}
