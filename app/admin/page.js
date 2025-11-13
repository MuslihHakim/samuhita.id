'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HeaderBar from './components/HeaderBar.jsx';
import StatsCards from './components/StatsCards.jsx';
import FilterBarDesktop from './components/filters/FilterBarDesktop.jsx';
import FilterBarMobile from './components/filters/FilterBarMobile.jsx';
import BulkUploadDialog from './components/dialogs/BulkUploadDialog.jsx';
import AddCandidateDialog from './components/dialogs/AddCandidateDialog.jsx';
import CredentialsModal from './components/dialogs/CredentialsModal.jsx';
import DeleteConfirmationDialog from './components/dialogs/DeleteConfirmationDialog.jsx';
import SubmissionsTable from './components/SubmissionsTable.jsx';
import SubmissionMobileCard from './components/SubmissionMobileCard.jsx';
import BulkActionsBar from './components/BulkActionsBar.jsx';
import { useSubmissions } from './hooks/useSubmissions';
import { useFilters } from './hooks/useFilters';
import { useBulkActions } from './hooks/useBulkActions';
import { useCandidateForm } from './hooks/useCandidateForm';
import { useBulkUpload } from './hooks/useBulkUpload';
import { useCredentialsModal } from './hooks/useCredentialsModal';
import { useVisibilityState } from './hooks/useVisibilityState';
import { useSubmissionActions } from './hooks/useSubmissionActions';
import { maskEmail, maskPhoneNumber, maskPassword, isValidEmail, isValidPhone } from './lib/utils';

const ITEMS_PER_PAGE = 20;

export default function AdminDashboard() {
  const router = useRouter();
  const { submissions, setSubmissions, loading, fetchSubmissions } = useSubmissions();
  const [authenticating, setAuthenticating] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const ensureAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/session', { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setAdminUser(data.user ?? null);
        await fetchSubmissions();
      } catch (error) {
        if (!cancelled) {
          router.replace('/login');
        }
      } finally {
        if (!cancelled) {
          setAuthenticating(false);
        }
      }
    };

    ensureAdminSession();

    return () => {
      cancelled = true;
    };
  }, [router, fetchSubmissions]);

  const {
    statusFilter,
    setStatusFilter,
    addedByFilter,
    setAddedByFilter,
    sentToFilter,
    setSentToFilter,
    professionFilter,
    setProfessionFilter,
    placementFilter,
    setPlacementFilter,
    coordinatorFilter,
    setCoordinatorFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredSubmissions,
    currentSubmissions,
    clearFilters,
    clearStatusFilter,
  } = useFilters(submissions, ITEMS_PER_PAGE);

  const deleteResolverRef = useRef(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, context: null });

  const closeDeleteDialog = useCallback((result) => {
    const resolver = deleteResolverRef.current;
    deleteResolverRef.current = null;
    setDeleteDialog({ isOpen: false, context: null });
    resolver?.(result);
  }, [setDeleteDialog]);

  const requestDeleteConfirmation = useCallback(
    (context) =>
      new Promise((resolve) => {
        deleteResolverRef.current = resolve;
        setDeleteDialog({ isOpen: true, context });
      }),
    [setDeleteDialog],
  );

  const handleDeleteDialogConfirm = useCallback(() => {
    closeDeleteDialog(true);
  }, [closeDeleteDialog]);

  const handleDeleteDialogCancel = useCallback(() => {
    closeDeleteDialog(false);
  }, [closeDeleteDialog]);

  const {
    selectedSubmissions,
    bulkLoading,
    csvLoading,
    selectedCount,
    handleSelectAll,
    handleSelectSubmission,
    clearSelection,
    areAllCurrentPageSelected,
    handleBulkDownload,
    handleBulkDelete,
    handleDownloadCSV,
    handleDownloadCSVTemplate,
  } = useBulkActions(submissions, fetchSubmissions, { requestDeleteConfirmation });

  const {
    modalState: addCandidateModal,
    formData: candidateFormData,
    validationErrors: candidateValidationErrors,
    validating: candidateValidating,
    handleOpenChange: handleAddCandidateOpenChange,
    handleInputChange: handleCandidateInputChange,
    handleSubmit: handleAddCandidate,
    closeModal: closeAddCandidateModal,
  } = useCandidateForm({ onSuccess: fetchSubmissions });

  const {
    state: bulkUploadState,
    handleOpenChange: handleBulkUploadOpenChange,
    handleFileChange: handleCSVFileChange,
    handleUpload: handleCSVUpload,
    handleNavigateCandidate,
    handleBulkCreate,
    closeModal: closeBulkUploadModal,
  } = useBulkUpload({ onSuccess: fetchSubmissions });

  const {
    credentialsModal,
    viewCredentials,
    closeCredentials,
    copyToClipboard,
  } = useCredentialsModal();

  const { isVisible, toggleVisibility } = useVisibilityState();

  const {
    actionLoading,
    handleVerify,
    handleGenerateAccount,
    handleDelete,
    handleUpdateSubmission,
    handleSyncSheets,
    handleGenerateCv,
  } = useSubmissionActions({ fetchSubmissions, setSubmissions, requestDeleteConfirmation });

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to terminate admin session:', error);
    } finally {
      setAdminUser(null);
      setSubmissions([]);
      router.replace('/login');
    }
  }, [router, setSubmissions]);

  const selectAllOnCurrentPage = handleSelectAll(currentSubmissions);
  const allCurrentSelected = areAllCurrentPageSelected(currentSubmissions);
  const filteredCount = filteredSubmissions.length;
  const totalCount = submissions.length;

  const coordinatorOptions = useMemo(() => {
    const unique = new Set();
    submissions.forEach((submission) => {
      const value = submission.coordinator?.trim();
      if (value) unique.add(value);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [submissions]);

  const credentialsVisibility = useMemo(
    () => ({
      isVisible: (field) => isVisible('modal', 'credentials', field),
      toggle: (field) => toggleVisibility('modal', 'credentials', field),
    }),
    [isVisible, toggleVisibility],
  );

  const isCardFieldVisible = useCallback(
    (id, field) => isVisible('card', id, field),
    [isVisible],
  );

  const toggleCardFieldVisibility = useCallback(
    (id, field) => toggleVisibility('card', id, field),
    [toggleVisibility],
  );

  const getStatusBadge = useCallback((status) => {
    const styles = {
      pending: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 transition-all duration-200',
      verified: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all duration-200',
      registered: 'bg-success/10 text-success border-success/20 hover:bg-success/20 transition-all duration-200',
      MCU: 'bg-info/10 text-info border-info/20 hover:bg-info/20 transition-all duration-200',
      Interview: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 transition-all duration-200',
      Contract: 'bg-navy-500/10 text-navy-600 dark:text-navy-300 border-navy-500/20 hover:bg-navy-500/20 transition-all duration-200',
      Visa: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all duration-200',
      Depart: 'bg-success/10 text-success border-success/20 hover:bg-success/20 transition-all duration-200',
      PreScreening: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-all duration-200',
    };

    const content = () => {
      if (status === 'pending') {
        return (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-warning rounded-full" />
            <span>Pending</span>
          </div>
        );
      }
      if (status === 'verified') {
        return (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verified</span>
          </div>
        );
      }
      if (status === 'registered') {
        return (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Registered</span>
          </div>
        );
      }
      if (['PreScreening', 'MCU', 'Interview', 'Contract', 'Visa', 'Depart'].includes(status)) {
        const label = status === 'PreScreening' ? 'Pre-Screening' : status;
        return (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-current/70" />
            <span>{label}</span>
          </div>
        );
      }
      return status;
    };

    return (
      <Badge
        variant="outline"
        className={`px-3 py-1 text-xs font-medium ${
          styles[status] || 'bg-muted/10 text-muted-foreground border-muted/20'
        }`}
      >
        {content()}
      </Badge>
    );
  }, []);

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Toaster />
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card dark:from-gray-950 dark:to-gray-900">
      <Toaster />

      <HeaderBar onSyncSheets={handleSyncSheets} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-8 lg:py-8">
        <StatsCards submissions={submissions} />

        <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl font-semibold">Submissions Management</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">
                  Verify and manage user registrations
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {filteredCount} of {totalCount} submissions
                  {(statusFilter !== 'all' ||
                    addedByFilter !== 'all' ||
                    sentToFilter !== 'all' ||
                    professionFilter !== 'all' ||
                    placementFilter !== 'all' ||
                    coordinatorFilter !== 'all' ||
                    dateFilter.start ||
                    dateFilter.end ||
                    searchQuery) && (
                      <span className="text-xs ml-1">(filtered)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDownloadCSV}
                    disabled={csvLoading}
                    variant="outline"
                    className="border-success/20 text-success hover:bg-success/10 hover:border-success/30 transition-all duration-200 min-h-[44px] px-3 sm:px-4"
                  >
                    {csvLoading ? (
                      <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin sm:mr-2" />
                    ) : (
                      <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">Download CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>

                  <BulkUploadDialog
                    isOpen={bulkUploadState.isOpen}
                    onOpenChange={handleBulkUploadOpenChange}
                    state={bulkUploadState}
                    actions={{
                      onFileChange: handleCSVFileChange,
                      onUpload: handleCSVUpload,
                      onNavigate: handleNavigateCandidate,
                      onBulkCreate: handleBulkCreate,
                      onReset: closeBulkUploadModal,
                      onDownloadTemplate: handleDownloadCSVTemplate,
                    }}
                    validators={{ isValidEmail, isValidPhone }}
                  />

                  <AddCandidateDialog
                    modalState={addCandidateModal}
                    onOpenChange={handleAddCandidateOpenChange}
                    formData={candidateFormData}
                    validationErrors={candidateValidationErrors}
                    validating={candidateValidating}
                    onInputChange={handleCandidateInputChange}
                    onSubmit={handleAddCandidate}
                    onCancel={closeAddCandidateModal}
                  />
                </div>
              </div>
            </div>

            {selectedCount > 0 && (
              <BulkActionsBar
                count={selectedCount}
                onClear={clearSelection}
                onDownloadWord={() => handleBulkDownload('word')}
                onDownloadPdf={() => handleBulkDownload('pdf')}
                onDelete={handleBulkDelete}
                loading={bulkLoading}
              />
            )}
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            {submissions.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">No submissions yet</p>
                <p className="text-xs sm:text-sm text-muted-foreground">New submissions will appear here</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block">
                  <FilterBarDesktop
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    addedByFilter={addedByFilter}
                    setAddedByFilter={setAddedByFilter}
                    sentToFilter={sentToFilter}
                    setSentToFilter={setSentToFilter}
                    professionFilter={professionFilter}
                    setProfessionFilter={setProfessionFilter}
                    placementFilter={placementFilter}
                    setPlacementFilter={setPlacementFilter}
                    coordinatorFilter={coordinatorFilter}
                    setCoordinatorFilter={setCoordinatorFilter}
                    coordinatorOptions={coordinatorOptions}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    clearFilters={clearFilters}
                    clearStatusFilter={clearStatusFilter}
                    setCurrentPage={setCurrentPage}
                    totalResultsCount={filteredCount}
                    totalAllCount={totalCount}
                  />
                </div>

                <FilterBarMobile
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  addedByFilter={addedByFilter}
                  setAddedByFilter={setAddedByFilter}
                  sentToFilter={sentToFilter}
                  setSentToFilter={setSentToFilter}
                  professionFilter={professionFilter}
                  setProfessionFilter={setProfessionFilter}
                  placementFilter={placementFilter}
                  setPlacementFilter={setPlacementFilter}
                  coordinatorFilter={coordinatorFilter}
                  setCoordinatorFilter={setCoordinatorFilter}
                  coordinatorOptions={coordinatorOptions}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  clearFilters={clearFilters}
                  clearStatusFilter={clearStatusFilter}
                  setCurrentPage={setCurrentPage}
                  totalResultsCount={filteredCount}
                  totalAllCount={totalCount}
                />

                <div className="block sm:hidden space-y-3">
                  {currentSubmissions.map((submission) => (
                    <SubmissionMobileCard
                      key={submission.id}
                      submission={submission}
                      selected={selectedSubmissions.has(submission.id)}
                      onSelect={(checked) => handleSelectSubmission(submission.id, checked)}
                      getStatusBadge={getStatusBadge}
                      isVisible={(field) => isCardFieldVisible(submission.id, field)}
                      toggleVisibility={(field) => toggleCardFieldVisibility(submission.id, field)}
                      maskEmail={maskEmail}
                      maskPhoneNumber={maskPhoneNumber}
                      actionStatus={actionLoading[submission.id]}
                      onVerify={() => handleVerify(submission.id)}
                      onGenerateAccount={() => handleGenerateAccount(submission.id)}
                      onViewCredentials={() => viewCredentials(submission.id, submission.fullName)}
                      onNavigateProcess={(userId) => router.push(`/admin/process/${userId}`)}
                      onNavigateEditCv={(userId) => router.push(`/admin/edit-cv/${userId}`)}
                      onGenerateCv={(format) =>
                        submission.userId && handleGenerateCv(submission.userId, submission.fullName, format)
                      }
                      onDelete={() => handleDelete(submission.id, submission.email, submission.status, submission.fullName)}
                    />
                  ))}
                </div>

                <SubmissionsTable
                  submissions={currentSubmissions}
                  selectedSubmissions={selectedSubmissions}
                  onSelectSubmission={handleSelectSubmission}
                  onSelectAll={selectAllOnCurrentPage}
                  allSelected={allCurrentSelected}
                  getStatusBadge={getStatusBadge}
                  actionLoading={actionLoading}
                  onUpdateSubmission={handleUpdateSubmission}
                  onVerify={handleVerify}
                  onGenerateAccount={handleGenerateAccount}
                  onViewCredentials={viewCredentials}
                  onNavigateProcess={(userId) => router.push(`/admin/process/${userId}`)}
                  onNavigateEditCv={(userId) => router.push(`/admin/edit-cv/${userId}`)}
                  onGenerateCv={handleGenerateCv}
                  onDelete={(id, email, status, fullName) => handleDelete(id, email, status, fullName)}
                />

                {totalPages > 1 && (
                  <div className="flex justify-end mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="min-h-[36px] px-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`min-h-[36px] w-9 ${
                                currentPage === pageNum
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="min-h-[36px] px-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>

                      <span className="text-sm text-muted-foreground ml-2">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialog.isOpen}
        context={deleteDialog.context}
        onConfirm={handleDeleteDialogConfirm}
        onCancel={handleDeleteDialogCancel}
      />

      <CredentialsModal
        isOpen={credentialsModal.isOpen}
        loading={credentialsModal.loading}
        credentials={credentialsModal.credentials}
        submissionName={credentialsModal.submissionName}
        onClose={closeCredentials}
        maskEmail={maskEmail}
        maskPhoneNumber={maskPhoneNumber}
        maskPassword={maskPassword}
        credentialsVisibility={credentialsVisibility}
        onCopy={copyToClipboard}
      />
    </div>
  );
}
