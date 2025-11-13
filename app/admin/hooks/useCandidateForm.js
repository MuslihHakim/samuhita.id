'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as api from '../lib/adminApi';

const INITIAL_MODAL_STATE = { isOpen: false, loading: false };
const INITIAL_FORM = { fullName: '', email: '', phoneNumber: '' };
const INITIAL_ERRORS = { email: '', phoneNumber: '' };
const INITIAL_VALIDATING = { email: false, phoneNumber: false };
const VALIDATION_DELAY_MS = 800;

export function useCandidateForm({ onSuccess } = {}) {
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [validationErrors, setValidationErrors] = useState(INITIAL_ERRORS);
  const [validating, setValidating] = useState(INITIAL_VALIDATING);
  const validationTimers = useRef({ email: null, phoneNumber: null });

  const clearValidationTimers = useCallback(() => {
    Object.values(validationTimers.current).forEach((timerId) => {
      if (timerId) {
        clearTimeout(timerId);
      }
    });
    validationTimers.current = { email: null, phoneNumber: null };
  }, []);

  const resetForm = useCallback(() => {
    clearValidationTimers();
    setFormData(INITIAL_FORM);
    setValidationErrors(INITIAL_ERRORS);
    setValidating(INITIAL_VALIDATING);
  }, [clearValidationTimers]);

  const closeModal = useCallback(() => {
    setModalState(INITIAL_MODAL_STATE);
    resetForm();
  }, [resetForm]);

  const openModal = useCallback(() => {
    resetForm();
    setModalState({ isOpen: true, loading: false });
  }, [resetForm]);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (isOpen) openModal();
      else closeModal();
    },
    [openModal, closeModal],
  );

  const applyValidationResult = useCallback((data) => {
    if (!data) return;
    setValidationErrors((prev) => ({
      ...prev,
      email: data.emailExists ? 'Email sudah terdaftar. Gunakan email yang berbeda.' : '',
      phoneNumber: data.phoneExists ? 'Nomor telepon sudah terdaftar. Gunakan nomor yang berbeda.' : '',
    }));
  }, []);

  const scheduleValidation = useCallback(
    async (field, value) => {
      const timerKey = field === 'email' ? 'email' : 'phoneNumber';
      if (validationTimers.current[timerKey]) {
        clearTimeout(validationTimers.current[timerKey]);
      }

      if (!value) {
        setValidating((prev) => ({ ...prev, [timerKey]: false }));
        setValidationErrors((prev) => ({ ...prev, [timerKey]: '' }));
        return;
      }

      setValidating((prev) => ({ ...prev, [timerKey]: true }));

      validationTimers.current[timerKey] = setTimeout(async () => {
        try {
          const payload = {
            email: timerKey === 'email' ? value : undefined,
            phone: timerKey === 'phoneNumber' ? value : undefined,
          };
          const { ok, data } = await api.checkExisting(payload);
          if (ok) {
            applyValidationResult(data);
          }
        } catch (error) {
          console.error('Error checking existing submission:', error);
        } finally {
          setValidating((prev) => ({ ...prev, [timerKey]: false }));
        }
      }, VALIDATION_DELAY_MS);
    },
    [applyValidationResult],
  );

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));

      if (field === 'email' || field === 'phoneNumber') {
        scheduleValidation(field, value);
      }
    },
    [scheduleValidation],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setModalState((prev) => ({ ...prev, loading: true }));

      try {
        const { ok, data, status } = await api.createSubmission(formData);
        if (ok) {
          toast.success('Kandidat berhasil ditambahkan!');
          closeModal();
          onSuccess?.();
          return;
        }

        if (status === 409 && data) {
          setValidationErrors({
            email: data.existingEmail ? 'Email sudah terdaftar.' : '',
            phoneNumber: data.existingPhone ? 'Nomor telepon sudah terdaftar.' : '',
          });
        }

        toast.error(data?.error || 'Gagal menambahkan kandidat');
      } catch (error) {
        console.error('Error creating candidate:', error);
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setModalState((prev) => ({ ...prev, loading: false }));
      }
    },
    [formData, closeModal, onSuccess],
  );

  return {
    modalState,
    formData,
    validationErrors,
    validating,
    handleOpenChange,
    handleInputChange,
    handleSubmit,
    openModal,
    closeModal,
    resetForm,
    setModalState, // expose for advanced usage if needed
  };
}
