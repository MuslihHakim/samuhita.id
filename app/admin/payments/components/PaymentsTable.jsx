'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PaymentsTable({
  submissions,
  selectedSubmissions,
  onSelectSubmission,
  onSelectAll,
  allSelected,
  onNavigatePayment,
}) {
  return (
    <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow>
              <TableHead className="font-semibold text-foreground text-sm w-12">
                <Checkbox checked={allSelected} onCheckedChange={onSelectAll} className="translate-x-1" />
              </TableHead>
              <TableHead className="font-semibold text-foreground text-sm">Full Name</TableHead>
              <TableHead className="font-semibold text-foreground text-sm">Status</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden md:table-cell">Created</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Add By</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Coordinator</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Sent To</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Profession</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Placement</TableHead>
              <TableHead className="font-semibold text-foreground text-sm hidden sm:table-cell">Payment For</TableHead>
              <TableHead className="font-semibold text-foreground text-sm text-right min-w-[120px]">Payments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selectedSubmissions.has(submission.id)}
                    onCheckedChange={(checked) => onSelectSubmission(submission.id, checked)}
                    className="translate-x-1"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {submission.fullName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-sm">{submission.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs rounded-full px-2 py-1 bg-muted text-foreground capitalize">
                    {submission.status}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{submission.addedBy?.trim() ? submission.addedBy : 'Unassigned'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{submission.coordinator?.trim() ? submission.coordinator : 'Unassigned'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{submission.sentTo?.trim() ? submission.sentTo : 'Unassigned'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{submission.profession?.trim() ? submission.profession : 'Unassigned'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{submission.placement?.trim() ? submission.placement : 'Unassigned'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className={`text-sm ${submission.latestPaymentFor ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {submission.latestPaymentFor || 'Belum ada'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => onNavigatePayment(submission.id)}
                    variant="outline"
                    className="border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 min-h-[36px] px-2"
                  >
                    <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-8c2.21 0 4 .895 4 2" />
                    </svg>
                    payment
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
