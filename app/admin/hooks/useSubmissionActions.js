'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import * as api from '../lib/adminApi';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1WaGk_jLru5MHbemQxuIxObTKarFrAs4ESPBCzUwyw_s';

export function useSubmissionActions({ fetchSubmissions, setSubmissions, requestDeleteConfirmation } = {}) {
  const [actionLoading, setActionLoading] = useState({});

  const setLoadingState = useCallback((id, state) => {
    setActionLoading((prev) => ({ ...prev, [id]: state }));
  }, []);

  const handleVerify = useCallback(
    async (id) => {
      setLoadingState(id, 'verifying');
      try {
        const { ok, error } = await api.verifySubmission(id);
        if (ok) {
          toast.success('Submission verified successfully');
          await fetchSubmissions?.();
        } else {
          toast.error(error || 'Failed to verify submission');
        }
      } catch (err) {
        console.error('Error verifying submission:', err);
        toast.error('An error occurred');
      } finally {
        setLoadingState(id, null);
      }
    },
    [fetchSubmissions, setLoadingState],
  );

  const handleGenerateAccount = useCallback(
    async (id) => {
      setLoadingState(id, 'generating');
      try {
        const { ok, error } = await api.generateAccount(id);
        if (ok) {
          toast.success('Account created and credentials sent via email!');
          await fetchSubmissions?.();
        } else {
          toast.error(error || 'Failed to generate account');
        }
      } catch (err) {
        console.error('Error generating account:', err);
        toast.error('An error occurred');
      } finally {
        setLoadingState(id, null);
      }
    },
    [fetchSubmissions, setLoadingState],
  );

  const handleDelete = useCallback(
    async (id, email, status, fullName) => {
      const submissionInfo = { id, email, status, fullName };

      if (requestDeleteConfirmation) {
        const confirmed = await requestDeleteConfirmation({ mode: 'single', submission: submissionInfo });
        if (!confirmed) {
          return;
        }
      } else {
        const statusWarning =
          status === 'registered'
            ? '\n\nWARNING: This user has a registered account with login credentials and CV data. Deleting will permanently remove everything including the Supabase Auth account.'
            : '';

        const confirmMessage =
          `Are you sure you want to completely delete ${fullName} (${email})?${statusWarning}\n\n` +
          'This will permanently delete:\n' +
          '- Submission record\n' +
          '- CV data (if any)\n' +
          '- Uploaded photos and documents\n' +
          '- Login credentials (if generated)\n' +
          '- Supabase Auth account (if registered)\n\n' +
          'After deletion, the email and phone number can be reused.\n\n' +
          'This action CANNOT be undone.';

        if (!window.confirm(confirmMessage)) {
          return;
        }

        if (status === 'registered') {
          const finalConfirmation = window.confirm(
            'FINAL CONFIRMATION:\n\n' +
              `You are about to delete a COMPLETE user account with login access.\n\nUser: ${fullName}\nEmail: ${email}\n\n` +
              'All data will be PERMANENTLY lost and the user will no longer be able to login.\n\nContinue?',
          );
          if (!finalConfirmation) {
            return;
          }
        }
      }

      setLoadingState(id, 'deleting');

      try {
        const { ok, error } = await api.deleteUser(id);
        if (ok) {
          toast.success(
            `User ${fullName} has been completely deleted. Email and phone number are now available for reuse.`,
          );
          await fetchSubmissions?.();
          return;
        }

        toast.error(error || 'Failed to delete user');
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error('An error occurred while deleting the user');
      } finally {
        setLoadingState(id, null);
      }
    },
    [fetchSubmissions, requestDeleteConfirmation, setLoadingState],
  );

  const handleUpdateSubmission = useCallback(
    async (submissionId, field, value) => {
      try {
        const { ok, error } = await api.updateSubmissionField(submissionId, field, value);
        if (ok) {
          const fieldLabels = {
            addedBy: 'Add By',
            sentTo: 'Sent To',
            coordinator: 'Coordinator',
            profession: 'Profession',
            placement: 'Placement',
          };
          const label = fieldLabels[field] ?? field;
          setSubmissions?.((prev) =>
            prev.map((submission) =>
              submission.id === submissionId ? { ...submission, [field]: value } : submission,
            ),
          );
          toast.success(`${label} updated successfully!`);
        } else {
          toast.error(error || 'Failed to update. Please try again.');
        }
      } catch (err) {
        console.error('Error updating submission:', err);
        toast.error('An error occurred. Please try again.');
      }
    },
    [setSubmissions],
  );

  const handleSyncSheets = useCallback(async () => {
    try {
      toast.info('Syncing from Google Sheets...');
      const { ok, data, error } = await api.syncSheets();
      if (!ok || !data) {
        toast.error(error || 'Failed to sync from Google Sheets');
        return;
      }

      if ((data.updated ?? 0) > 0) {
        toast.success(`Synced ${data.updated} verifications from Google Sheets!`);
        await fetchSubmissions?.();
      } else {
        toast.info('No new verifications found in Google Sheets');
      }

      window.open(SHEET_URL, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error syncing sheets:', err);
      toast.error('An error occurred during sync');
    }
  }, [fetchSubmissions]);

  const handleGenerateCv = useCallback(async (userId, fullName, format) => {
    try {
      const response = await api.generateCv(userId, format);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to generate CV');
        return;
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `CV_${fullName.replace(/\s+/g, '_')}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`CV generated successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Error generating CV:', err);
      toast.error('An error occurred while generating CV');
    }
  }, []);

  return {
    actionLoading,
    handleVerify,
    handleGenerateAccount,
    handleDelete,
    handleUpdateSubmission,
    handleSyncSheets,
    handleGenerateCv,
  };
}
