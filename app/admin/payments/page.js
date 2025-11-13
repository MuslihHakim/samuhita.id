'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HeaderBar from '../components/HeaderBar.jsx';
import FilterBarDesktop from '../components/filters/FilterBarDesktop.jsx';
import FilterBarMobile from '../components/filters/FilterBarMobile.jsx';
import PaymentsTable from './components/PaymentsTable.jsx';
import PaymentsMobileCard from './components/PaymentsMobileCard.jsx';
import { useSubmissions } from '../hooks/useSubmissions';
import { useFilters } from '../hooks/useFilters';

const ITEMS_PER_PAGE = 20;

export default function PaymentsManagementPage() {
  const router = useRouter();
  const { submissions, loading, fetchSubmissions } = useSubmissions();
  const [authenticating, setAuthenticating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ensureAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/session', { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error('Unauthorized');
        if (!cancelled) await fetchSubmissions();
      } catch (err) {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setAuthenticating(false);
      }
    };
    ensureAdminSession();
    return () => { cancelled = true; };
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

  const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
  const allCurrentSelected = useMemo(() =>
    currentSubmissions.length > 0 && currentSubmissions.every((s) => selectedSubmissions.has(s.id)),
    [currentSubmissions, selectedSubmissions],
  );

  const handleSelectSubmission = (id, checked) => {
    setSelectedSubmissions((prev) => {
      const updated = new Set(prev);
      if (checked) updated.add(id); else updated.delete(id);
      return updated;
    });
  };
  const selectAllOnCurrentPage = (checked) => {
    if (checked) {
      setSelectedSubmissions((prev) => new Set([...prev, ...currentSubmissions.map((s) => s.id)]));
    } else {
      setSelectedSubmissions((prev) => new Set([...prev].filter((id) => !currentSubmissions.some((s) => s.id === id))));
    }
  };

  const onNavigatePayment = (submissionId) => router.push(`/admin/payments/${submissionId}`);

  if (authenticating) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} />
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Payments Management</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} />
      <Toaster richColors />
      <div className="container mx-auto p-4">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Payments Management</CardTitle>
                <CardDescription>Kelola pembayaran per submission</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              clearFilters={clearFilters}
              clearStatusFilter={clearStatusFilter}
              setCurrentPage={setCurrentPage}
              totalResultsCount={filteredSubmissions.length}
              totalAllCount={submissions.length}
            />

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
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              clearFilters={clearFilters}
              clearStatusFilter={clearStatusFilter}
              setCurrentPage={setCurrentPage}
              totalResultsCount={filteredSubmissions.length}
              totalAllCount={submissions.length}
            />

            {loading ? (
              <div className="p-6 text-muted-foreground">Loading submissions...</div>
            ) : (
              <>
                {/* Desktop Table */}
                <PaymentsTable
                  submissions={currentSubmissions}
                  selectedSubmissions={selectedSubmissions}
                  onSelectSubmission={handleSelectSubmission}
                  onSelectAll={selectAllOnCurrentPage}
                  allSelected={allCurrentSelected}
                  onNavigatePayment={onNavigatePayment}
                />

                {/* Mobile Cards */}
                <div className="sm:hidden grid gap-2 mt-4">
                  {currentSubmissions.map((submission) => (
                    <PaymentsMobileCard
                      key={submission.id}
                      submission={submission}
                      selected={selectedSubmissions.has(submission.id)}
                      onSelect={(checked) => handleSelectSubmission(submission.id, checked)}
                      onNavigatePayment={onNavigatePayment}
                    />
                  ))}
                </div>

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
    </div>
  );
}
