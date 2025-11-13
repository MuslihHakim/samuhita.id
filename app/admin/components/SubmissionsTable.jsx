'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { professionOptions } from '@/lib/constants/professions';
import { addedByOptions, sentToOptions } from '@/lib/constants/submissionOptions';
import { getCoordinatorOptions } from '@/lib/constants/coordinators';
const placementOptions = Array.from({ length: 20 }, (_, i) => `Hotel ${i + 1}`);

export default function SubmissionsTable({
  submissions,
  selectedSubmissions,
  onSelectSubmission,
  onSelectAll,
  allSelected,
  getStatusBadge,
  actionLoading,
  onUpdateSubmission,
  onVerify,
  onGenerateAccount,
  onViewCredentials,
  onNavigateProcess,
  onNavigateEditCv,
  onGenerateCv,
  onDelete,
}) {
  const isRegisteredLike = (status) => status === 'registered' || ['PreScreening','MCU','Interview','Contract','Visa','Depart'].includes(status);
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
              <TableHead className="font-semibold text-foreground text-sm text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => {
              const coordinatorOptions = getCoordinatorOptions(submission.addedBy);
              return (
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
                          {submission.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{submission.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select
                      value={submission.addedBy?.trim() ? submission.addedBy : 'unassigned'}
                      onValueChange={(value) => {
                        const normalizedValue = value === 'unassigned' ? '' : value;
                        onUpdateSubmission(submission.id, 'addedBy', normalizedValue);
                        if (value !== 'Office') {
                          onUpdateSubmission(submission.id, 'coordinator', '');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {addedByOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select
                      value={submission.coordinator?.trim() ? submission.coordinator : 'unassigned'}
                      onValueChange={(value) =>
                        onUpdateSubmission(submission.id, 'coordinator', value === 'unassigned' ? '' : value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {coordinatorOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select
                      value={submission.sentTo?.trim() ? submission.sentTo : 'unassigned'}
                      onValueChange={(value) =>
                        onUpdateSubmission(submission.id, 'sentTo', value === 'unassigned' ? '' : value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {sentToOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select
                      value={submission.profession?.trim() ? submission.profession : 'unassigned'}
                      onValueChange={(value) =>
                        onUpdateSubmission(submission.id, 'profession', value === 'unassigned' ? '' : value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {professionOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select
                      value={submission.placement?.trim() ? submission.placement : 'unassigned'}
                      onValueChange={(value) =>
                        onUpdateSubmission(submission.id, 'placement', value === 'unassigned' ? '' : value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {placementOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex gap-1 justify-end">
                      {submission.userId && (
                        <Button
                          size="sm"
                          onClick={() => onNavigateProcess(submission.userId)}
                          variant="outline"
                          className="flex-1 border-info/20 text-info hover:bg-info/10 transition-all duration-200 min-h-[36px] text-xs"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </Button>
                      )}

                      {submission.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => onVerify(submission.id)}
                          disabled={actionLoading[submission.id] === 'verifying'}
                          className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 min-h-[36px] px-2 text-xs"
                        >
                          {actionLoading[submission.id] === 'verifying' ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                              <span>Verify</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Verify</span>
                            </div>
                          )}
                        </Button>
                      )}

                      {submission.status === 'verified' && (
                        <Button
                          size="sm"
                          onClick={() => onGenerateAccount(submission.id)}
                          disabled={actionLoading[submission.id] === 'generating'}
                          variant="success"
                          className="hover:bg-success/90 transition-all duration-200 min-h-[36px] px-2 text-xs"
                        >
                          {actionLoading[submission.id] === 'generating' ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                              <span>Generate</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              <span>Generate</span>
                            </div>
                          )}
                        </Button>
                      )}

                      {isRegisteredLike(submission.status) && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onViewCredentials(submission.id, submission.fullName)}
                            variant="outline"
                            className="border-info/20 text-info hover:bg-info/10 transition-all duration-200 min-h-[36px] px-2"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </Button>
                          {submission.userId && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onNavigateEditCv(submission.userId)}
                                variant="outline"
                                className="border-warning/20 text-warning hover:bg-warning/10 transition-all duration-200 min-h-[36px] px-2"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onGenerateCv(submission.userId, submission.fullName, 'word')}
                                variant="outline"
                                className="border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 min-h-[36px] px-2 hidden sm:flex"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onGenerateCv(submission.userId, submission.fullName, 'pdf')}
                                variant="outline"
                                className="border-info/20 text-info hover:bg-info/10 transition-all duration-200 min-h-[36px] px-2 hidden sm:flex"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            </>
                          )}
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(submission.id, submission.email, submission.status, submission.fullName)}
                        disabled={actionLoading[submission.id] === 'deleting'}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 min-h-[36px] px-2"
                      >
                        {actionLoading[submission.id] === 'deleting' ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
