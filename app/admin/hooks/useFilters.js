import { useEffect, useMemo, useState } from 'react';

export function useFilters(submissions, itemsPerPage = 20) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [addedByFilter, setAddedByFilter] = useState('all');
  const [sentToFilter, setSentToFilter] = useState('all');
  const [professionFilter, setProfessionFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [coordinatorFilter, setCoordinatorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter((s) => {
        const submissionDate = new Date(s.createdAt);
        const submissionDateStart = new Date(submissionDate);
        submissionDateStart.setHours(0, 0, 0, 0);

        const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);

        const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && endDate) return submissionDateStart >= startDate && submissionDateStart <= endDate;
        if (startDate) return submissionDateStart >= startDate;
        if (endDate) return submissionDateStart <= endDate;
        return true;
      });
    }

    if (addedByFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (addedByFilter === 'unassigned') return !s.addedBy || s.addedBy.trim() === '';
        return s.addedBy === addedByFilter;
      });
    }

    if (sentToFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (sentToFilter === 'unassigned') return !s.sentTo || s.sentTo.trim() === '';
        return s.sentTo === sentToFilter;
      });
    }

    if (professionFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (professionFilter === 'unassigned') return !s.profession || s.profession.trim() === '';
        return s.profession === professionFilter;
      });
    }

    if (placementFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (placementFilter === 'unassigned') return !s.placement || s.placement.trim() === '';
        return s.placement === placementFilter;
      });
    }

    if (coordinatorFilter !== 'all') {
      filtered = filtered.filter((s) => {
        if (coordinatorFilter === 'unassigned') return !s.coordinator || s.coordinator.trim() === '';
        return s.coordinator === coordinatorFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) => s.fullName.toLowerCase().includes(q));
    }

    return filtered;
  }, [
    submissions,
    statusFilter,
    dateFilter,
    addedByFilter,
    sentToFilter,
    professionFilter,
    placementFilter,
    coordinatorFilter,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;

  useEffect(() => {
    // ensure currentPage valid
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const currentSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSubmissions.slice(startIndex, endIndex);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  const clearFilters = () => {
    setStatusFilter('all');
    setAddedByFilter('all');
    setSentToFilter('all');
    setProfessionFilter('all');
    setPlacementFilter('all');
    setCoordinatorFilter('all');
    setDateFilter({ start: null, end: null });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const clearStatusFilter = () => {
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateFilter({ start: null, end: null });
    setCurrentPage(1);
  };

  return {
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
    clearDateFilter,
  };
}
