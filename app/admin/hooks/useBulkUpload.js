'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as api from '../lib/adminApi';

const INITIAL_STATE = {
  isOpen: false,
  step: 'upload',
  loading: false,
  csvFile: null,
  candidates: [],
  currentCandidateIndex: 0,
  duplicates: [],
  results: null,
};

export function useBulkUpload({ onSuccess } = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const openModal = useCallback(() => {
    setState((prev) => ({
      ...INITIAL_STATE,
      isOpen: true,
    }));
  }, []);

  const closeModal = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (isOpen) openModal();
      else closeModal();
    },
    [openModal, closeModal],
  );

  const handleFileChange = useCallback((file) => {
    if (file && file.type === 'text/csv') {
      setState((prev) => ({ ...prev, csvFile: file }));
    } else {
      toast.error('Please select a valid CSV file');
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!state.csvFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const { ok, data, error } = await api.bulkUploadCsv(state.csvFile);
      if (!ok || !data) {
        toast.error(error || 'Failed to process CSV');
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const total = data.summary?.total ?? data.candidates?.length ?? 0;
      if (total > 0) {
        toast.success(`Processed ${total} candidates from CSV`);
      }

      const sortedCandidates = [...(data.candidates ?? [])].sort((a, b) => {
        const aReady = a.isValid && !a.hasDuplicate;
        const bReady = b.isValid && !b.hasDuplicate;
        if (aReady && !bReady) return -1;
        if (!aReady && bReady) return 1;
        return (a.rowIndex ?? 0) - (b.rowIndex ?? 0);
      });

      setState((prev) => ({
        ...prev,
        step: 'preview',
        loading: false,
        candidates: sortedCandidates,
        duplicates: data.duplicates ?? [],
        currentCandidateIndex: 0,
        results: null,
      }));
    } catch (err) {
      console.error('Error uploading CSV:', err);
      toast.error('An error occurred while uploading CSV');
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.csvFile]);

  const handleNavigateCandidate = useCallback((direction) => {
    setState((prev) => {
      const { candidates, currentCandidateIndex } = prev;
      if (direction === 'next' && currentCandidateIndex < candidates.length - 1) {
        return { ...prev, currentCandidateIndex: currentCandidateIndex + 1 };
      }
      if (direction === 'prev' && currentCandidateIndex > 0) {
        return { ...prev, currentCandidateIndex: currentCandidateIndex - 1 };
      }
      return prev;
    });
  }, []);

  const handleBulkCreate = useCallback(
    async (excludeDuplicates = true, excludeInvalid = true) => {
      setState((prev) => ({ ...prev, step: 'processing', loading: true }));

      try {
        const payload = {
          candidates: state.candidates,
          excludeDuplicates,
          excludeInvalid,
        };

        const { ok, data, error } = await api.bulkCreateCandidates(payload);
        if (!ok || !data) {
          toast.error(error || 'Failed to create candidates');
          setState((prev) => ({ ...prev, loading: false, step: 'preview' }));
          return;
        }

        toast.success(`Successfully created ${data.summary?.successful ?? 0} candidates`);
        setState((prev) => ({
          ...prev,
          step: 'results',
          loading: false,
          results: data,
        }));
        onSuccess?.();
      } catch (err) {
        console.error('Error creating candidates:', err);
        toast.error('An error occurred while creating candidates');
        setState((prev) => ({ ...prev, loading: false, step: 'preview' }));
      }
    },
    [state.candidates, onSuccess],
  );

  const currentCandidate = useMemo(() => {
    if (!state.candidates?.length) return null;
    return state.candidates[state.currentCandidateIndex] ?? null;
  }, [state.candidates, state.currentCandidateIndex]);

  return {
    state,
    currentCandidate,
    openModal,
    closeModal,
    handleOpenChange,
    handleFileChange,
    handleUpload,
    handleNavigateCandidate,
    handleBulkCreate,
    setState,
  };
}
