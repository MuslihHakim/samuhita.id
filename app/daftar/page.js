'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function DaftarPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ email: '', phoneNumber: '' });
  const [validating, setValidating] = useState({ email: false, phoneNumber: false });

  const openWhatsApp = (fullName) => {
    const phoneNumber = '6285881981889';
    const message = `Halo saya ${fullName} sudah melakukan registrasi akun di portal samuhita.id`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const checkExistingSubmission = async (email, phoneNumber) => {
    if (!email && !phoneNumber) return;
    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phoneNumber) params.append('phone', phoneNumber);
      const response = await fetch(`/api/check-existing?${params}`);
      const data = await response.json();
      if (response.ok) {
        setValidationErrors(prev => ({
          ...prev,
          email: data.emailExists ? 'Email sudah terdaftar. Gunakan email yang berbeda.' : '',
          phoneNumber: data.phoneExists ? 'Nomor telepon sudah terdaftar. Gunakan nomor yang berbeda.' : ''
        }));
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
    } finally {
      setValidating(prev => ({ ...prev, email: false, phoneNumber: false }));
    }
  };

  const debouncedValidation = useCallback(
    debounce((email, phoneNumber) => { checkExistingSubmission(email, phoneNumber); }, 1000),
    []
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'email' && value) {
      setValidating(prev => ({ ...prev, email: true }));
      debouncedValidation(value, null);
    } else if (field === 'phoneNumber' && value) {
      setValidating(prev => ({ ...prev, phoneNumber: true }));
      debouncedValidation(null, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Pendaftaran berhasil! Kami akan segera menghubungi Anda.');
        setFormData({ fullName: '', email: '', phoneNumber: '' });
        setValidationErrors({ email: '', phoneNumber: '' });
        setTimeout(() => { openWhatsApp(formData.fullName); }, 1000);
      } else {
        if (response.status === 409) {
          if (data.existingEmail && data.existingPhone) {
            setValidationErrors({ email: 'Email sudah terdaftar.', phoneNumber: 'Nomor telepon sudah terdaftar.' });
          } else if (data.existingEmail) {
            setValidationErrors({ email: 'Email sudah terdaftar.', phoneNumber: '' });
          } else if (data.existingPhone) {
            setValidationErrors({ email: '', phoneNumber: 'Nomor telepon sudah terdaftar.' });
          }
        }
        toast.error(data.error || 'Gagal mengirim pendaftaran');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/90">
      <Toaster />
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:bg-slate-900/95 dark:border-slate-700/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 md:py-4 lg:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-3">
            <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-xl md:text-2xl">S</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent leading-tight">Samuhita.id</h1>
              <p className="text-xs sm:text-xs md:text-sm text-muted-foreground hidden sm:block">Platform Karir Internasional</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-3">
            <ThemeToggle />
            <Button onClick={() => router.push('/login')} variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4">
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          <div className="space-y-3 sm:space-y-4 md:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground">Langkah Pertama Menuju Karir Impian Anda</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">Isi data diri Anda dengan lengkap dan benar untuk kami proses</p>
          </div>

          <div className="lg:pl-8 md:mt-8 lg:mt-0">
            <Card className="shadow-lg lg:shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:border-slate-700/60 mx-auto max-w-md md:max-w-lg lg:max-w-none">
              <CardHeader className="text-center pb-4 sm:pb-6 md:pb-6 px-4 sm:px-6 md:px-6">
                <CardTitle className="text-lg sm:text-xl md:text-xl lg:text-2xl font-semibold">Form Pendaftaran</CardTitle>
                <CardDescription className="text-sm sm:text-base md:text-base">Silakan isi data di bawah ini</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 md:px-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">Nama Lengkap *</Label>
                    <Input id="fullName" type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} required className="h-10 sm:h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Alamat Email *</Label>
                    <div className="relative">
                      <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className="h-10 sm:h-11 pr-10 border-slate-200 dark:border-slate-700 dark:bg-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                    </div>
                    {validating.email && <p className="text-xs text-muted-foreground">Memeriksa email...</p>}
                    {validationErrors.email && <p className="text-xs text-destructive">{validationErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">Nomor HP *</Label>
                    <div className="relative">
                      <Input id="phoneNumber" type="tel" placeholder="08xxxxxxxxxx" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} required className="h-10 sm:h-11 pr-10 border-slate-200 dark:border-slate-700 dark:bg-slate-700/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
                    </div>
                    {validating.phoneNumber && <p className="text-xs text-muted-foreground">Memeriksa nomor HP...</p>}
                    {validationErrors.phoneNumber && <p className="text-xs text-destructive">{validationErrors.phoneNumber}</p>}
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 sm:h-12 text-sm sm:text-base">
                    {loading ? 'Mengirim...' : 'Daftar Sekarang'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">Dengan mendaftar, Anda menyetujui syarat dan ketentuan kami.</p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
