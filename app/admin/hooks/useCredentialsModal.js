'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import * as api from '../lib/adminApi';

const INITIAL_STATE = {
  isOpen: false,
  loading: false,
  credentials: null,
  submissionName: '',
};

export function useCredentialsModal() {
  const [state, setState] = useState(INITIAL_STATE);

  const close = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const viewCredentials = useCallback(async (submissionId, submissionName) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin melihat kredensial login untuk ${submissionName}?\n\n` +
        `Tindakan ini akan dicatat untuk keamanan.`,
    );

    if (!confirmed) return;

    setState({
      isOpen: true,
      loading: true,
      credentials: null,
      submissionName,
    });

    try {
      const { ok, data, error } = await api.getCredentials(submissionId);
      if (ok && data) {
        setState({
          isOpen: true,
          loading: false,
          credentials: data,
          submissionName,
        });
        toast.success('Kredensial berhasil dimuat');
      } else {
        toast.error(error || 'Gagal memuat kredensial');
        close();
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
      toast.error('Terjadi kesalahan saat memuat kredensial');
      close();
    }
  }, [close]);

  const copyToClipboard = useCallback(async (text, typeLabel) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${typeLabel} berhasil disalin!`);
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error(`Gagal menyalin ${typeLabel}`);
    }
  }, []);

  return {
    credentialsModal: state,
    viewCredentials,
    closeCredentials: close,
    copyToClipboard,
  };
}
