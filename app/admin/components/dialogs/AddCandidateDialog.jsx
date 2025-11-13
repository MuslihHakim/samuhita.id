'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AddCandidateDialog({
  modalState,
  onOpenChange,
  formData,
  validationErrors,
  validating,
  onInputChange,
  onSubmit,
  onCancel,
}) {
  const { isOpen, loading } = modalState ?? {};
  const { email: emailError = '', phoneNumber: phoneError = '' } = validationErrors ?? {};
  const { email: emailValidating = false, phoneNumber: phoneValidating = false } = validating ?? {};

  const submitDisabled =
    loading ||
    Boolean(emailError) ||
    Boolean(phoneError) ||
    !formData?.fullName ||
    !formData?.email ||
    !formData?.phoneNumber;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[44px] px-3 sm:px-4"
        >
          <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="hidden sm:inline">Tambah Kandidat</span>
          <span className="sm:hidden">+</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
            Tambah Kandidat Baru
          </DialogTitle>
          <DialogDescription>
            Tambahkan kandidat baru secara manual. Data akan langsung tervalidasi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="candidateFullName" className="text-sm font-medium">Full Name *</Label>
            <Input
              id="candidateFullName"
              type="text"
              placeholder="John Doe"
              value={formData?.fullName ?? ''}
              onChange={(e) => onInputChange?.('fullName', e.target.value)}
              required
              className="h-11 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidateEmail" className="text-sm font-medium">Email Address *</Label>
            <div className="relative">
              <Input
                id="candidateEmail"
                type="email"
                placeholder="john@example.com"
                value={formData?.email ?? ''}
                onChange={(e) => onInputChange?.('email', e.target.value)}
                required
                className={`h-11 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  emailError ? 'border-red-500 focus:border-red-500' : ''
                } ${emailValidating ? 'pr-10' : ''}`}
              />
              {emailValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="text-sm text-destructive mt-1">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidatePhoneNumber" className="text-sm font-medium">Phone Number *</Label>
            <div className="relative">
              <Input
                id="candidatePhoneNumber"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={formData?.phoneNumber ?? ''}
                onChange={(e) => onInputChange?.('phoneNumber', e.target.value)}
                required
                className={`h-11 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  phoneError ? 'border-red-500 focus:border-red-500' : ''
                } ${phoneValidating ? 'pr-10' : ''}`}
              />
              {phoneValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            {phoneError && (
              <p className="text-sm text-destructive mt-1">{phoneError}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled}
              className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white h-11 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menambahkan...</span>
                </div>
              ) : (
                'Tambah Kandidat'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
