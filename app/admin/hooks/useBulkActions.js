import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import * as api from '../lib/adminApi';

export const useBulkActions = (submissions, fetchSubmissions, { requestDeleteConfirmation } = {}) => {
  const [selectedSubmissions, setSelectedSubmissions] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const handleSelectAll = useCallback((currentPageSubmissions) => {
    return (checked) => {
      if (checked) {
        const currentIds = currentPageSubmissions.map(s => s.id);
        setSelectedSubmissions(new Set(currentIds));
      } else {
        setSelectedSubmissions(new Set());
      }
    };
  }, []);

  const handleSelectSubmission = useCallback((id, checked) => {
    const newSelected = new Set(selectedSubmissions);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedSubmissions(newSelected);
  }, [selectedSubmissions]);

  const clearSelection = useCallback(() => {
    setSelectedSubmissions(new Set());
  }, []);

  const areAllCurrentPageSelected = useCallback((currentPageSubmissions) => {
    const currentIds = currentPageSubmissions.map(s => s.id);
    return currentIds.length > 0 && currentIds.every(id => selectedSubmissions.has(id));
  }, [selectedSubmissions]);

  const isSomeCurrentPageSelected = useCallback((currentPageSubmissions) => {
    const currentIds = currentPageSubmissions.map(s => s.id);
    return currentIds.some(id => selectedSubmissions.has(id)) && !areAllCurrentPageSelected(currentPageSubmissions);
  }, [selectedSubmissions, areAllCurrentPageSelected]);

  const handleBulkDownload = useCallback(async (format) => {
    const selectedIds = Array.from(selectedSubmissions);
    if (selectedIds.length === 0) {
      toast.error('No submissions selected');
      return;
    }

    // Filter for registered users with CV data
    const selectedSubmissionsData = submissions.filter(s =>
      selectedIds.includes(s.id) && s.status === 'registered' && s.userId
    );

    if (selectedSubmissionsData.length === 0) {
      toast.error('No registered users with CV data selected for download');
      return;
    }

    setBulkLoading('download');

    try {
      // Call bulk download API
      const response = await fetch('/api/admin/bulk-download-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedSubmissionsData.map(s => s.userId),
          format: format
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk download CVs');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Bulk_CVs_${format.toUpperCase()}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${selectedSubmissionsData.length} CVs as ${format.toUpperCase()} successfully!`);
      clearSelection();
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error(error.message || 'Failed to download CVs');
    } finally {
      setBulkLoading(null);
    }
  }, [selectedSubmissions, submissions, clearSelection]);

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedSubmissions);
    if (selectedIds.length === 0) {
      toast.error('No submissions selected');
      return;
    }

    const selectedSubmissionsData = submissions.filter(s => selectedIds.includes(s.id));

    const statusCount = {
      pending: selectedSubmissionsData.filter(s => s.status === 'pending').length,
      verified: selectedSubmissionsData.filter(s => s.status === 'verified').length,
      registered: selectedSubmissionsData.filter(s => s.status === 'registered').length
    };

    if (requestDeleteConfirmation) {
      const confirmed = await requestDeleteConfirmation({
        mode: 'bulk',
        summary: { count: selectedIds.length, statusCount },
      });
      if (!confirmed) {
        return;
      }
    } else {
      const confirmMessage = `Are you sure you want to delete ${selectedIds.length} users?\n\n` +
        `This will permanently delete:\n` +
        `- ${statusCount.pending} pending users\n` +
        `- ${statusCount.verified} verified users\n` +
        `- ${statusCount.registered} registered users\n\n` +
        `All associated data (CV, credentials, files, accounts) will be permanently removed.\n\n` +
        `This action CANNOT be undone.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setBulkLoading('delete');

    try {
      let successCount = 0;
      let failedCount = 0;
      const failedItems = [];

      for (const submission of selectedSubmissionsData) {
        try {
          const { ok, error } = await api.deleteUser(submission.id);

          if (ok) {
            successCount += 1;
            continue;
          }

          failedCount += 1;
          failedItems.push(submission.fullName);
        } catch (error) {
          failedCount += 1;
          failedItems.push(submission.fullName);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} users!`);
        await fetchSubmissions();
        clearSelection();
      }

      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} users: ${failedItems.join(', ')}`);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete users');
    } finally {
      setBulkLoading(null);
    }
  }, [selectedSubmissions, submissions, fetchSubmissions, clearSelection, requestDeleteConfirmation]);

  const handleDownloadCSV = useCallback(async () => {
    setCsvLoading(true);

    try {
      const response = await fetch('/api/admin/download-csv', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to download CSV');
        return;
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `User_Data_Export_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('An error occurred while downloading CSV');
    } finally {
      setCsvLoading(false);
    }
  }, []);

  const handleDownloadCSVTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/download-csv-template', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to download CSV template');
        return;
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Bulk_Candidate_Template.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV template:', error);
      toast.error('An error occurred while downloading CSV template');
    }
  }, []);

  return {
    // State
    selectedSubmissions,
    bulkLoading,
    csvLoading,
    selectedCount: selectedSubmissions.size,

    // Selection methods
    handleSelectAll,
    handleSelectSubmission,
    clearSelection,
    areAllCurrentPageSelected,
    isSomeCurrentPageSelected,

    // Bulk actions
    handleBulkDownload,
    handleBulkDelete,
    handleDownloadCSV,
    handleDownloadCSVTemplate,

    // Setters
    setSelectedSubmissions
  };
};
