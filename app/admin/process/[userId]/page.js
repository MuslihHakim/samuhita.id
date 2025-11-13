'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRouter, useParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProcessForm() {
  const router = useRouter();
  const params = useParams();
  const { userId } = params;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  const [processData, setProcessData] = useState({
    // Pre-Screening Data
    prescreen_tanggal: null,
    prescreen_interviewer: '',
    prescreen_bahasa_inggris: '',
    prescreen_finansial: '',

    // MCU Data
    mcu_tanggal: null,
    mcu_status: '',
    mcu_note: '',
    mcu_document_url: '',

    // Interview Data
    interview_tanggal: null,
    interview_score_bahasa: '',
    interview_score_keahlian: '',
    interview_status: '',

    // Visa Data
    visa_tanggal_terbit: null,
    visa_lokasi_penerbitan: '',
    visa_no_referensi: '',
    visa_document_url: '',

    // Keberangkatan Data
    keberangkatan_tanggal: null,
    keberangkatan_bandara_asal: '',
    keberangkatan_bandara_tujuan: '',
    keberangkatan_no_tiket: '',

    // Working Contract
    contract_approval_date: null,
    contract_start_date: null,
    contract_end_date: null,
    contract_document_url: ''
  });

  const [uploadingFile, setUploadingFile] = useState({ mcu: false, visa: false, contract: false });
  const [errors, setErrors] = useState({});
  const [statusSaving, setStatusSaving] = useState(null);

  const setDashboardStatus = async (newStatus) => {
    if (!submission?.id) {
      toast.error('Submission not loaded');
      return;
    }

    setStatusSaving(newStatus);
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to update status');
        return;
      }

      setSubmission((prev) => ({ ...(prev || {}), status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('An error occurred while updating status');
    } finally {
      setStatusSaving(null);
    }
  };

  const fetchUserAndProcessData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch submission data
      const submissionResponse = await fetch('/api/admin/submission-by-user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (submissionResponse.ok) {
        const submissionData = await submissionResponse.json();
          setSubmission(submissionData);
      }

      // Fetch existing process data
      const processResponse = await fetch(`/api/admin/process/${userId}`);
      if (processResponse.ok) {
        const { data } = await processResponse.json();
        if (data) {
          setProcessData({
            prescreen_tanggal: data.prescreen_tanggal ? new Date(data.prescreen_tanggal) : null,
            prescreen_interviewer: data.prescreen_interviewer || '',
            prescreen_bahasa_inggris: data.prescreen_bahasa_inggris || '',
            prescreen_finansial: data.prescreen_finansial || '',
            mcu_tanggal: data.mcu_tanggal ? new Date(data.mcu_tanggal) : null,
            mcu_status: data.mcu_status || '',
            mcu_note: data.mcu_note || '',
            mcu_document_url: data.mcu_document_url || '',
            interview_tanggal: data.interview_tanggal ? new Date(data.interview_tanggal) : null,
            interview_score_bahasa: data.interview_score_bahasa || '',
            interview_score_keahlian: data.interview_score_keahlian || '',
            interview_status: data.interview_status || '',
            visa_tanggal_terbit: data.visa_tanggal_terbit ? new Date(data.visa_tanggal_terbit) : null,
            visa_lokasi_penerbitan: data.visa_lokasi_penerbitan || '',
            visa_no_referensi: data.visa_no_referensi || '',
            visa_document_url: data.visa_document_url || '',
            keberangkatan_tanggal: data.keberangkatan_tanggal ? new Date(data.keberangkatan_tanggal) : null,
            keberangkatan_bandara_asal: data.keberangkatan_bandara_asal || '',
            keberangkatan_bandara_tujuan: data.keberangkatan_bandara_tujuan || '',
            keberangkatan_no_tiket: data.keberangkatan_no_tiket || '',
            contract_approval_date: data.contract_approval_date ? new Date(data.contract_approval_date) : null,
            contract_start_date: data.contract_start_date ? new Date(data.contract_start_date) : null,
            contract_end_date: data.contract_end_date ? new Date(data.contract_end_date) : null,
            contract_document_url: data.contract_document_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load process data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
        await fetchUserAndProcessData();
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
  }, [router, fetchUserAndProcessData]);

  const handleFileUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(prev => ({ ...prev, [documentType]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/admin/process/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { fileUrl } = await response.json();
        setProcessData(prev => ({
          ...prev,
          [`${documentType}_document_url`]: fileUrl
        }));
        toast.success(`${documentType.toUpperCase()} document uploaded successfully`);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to upload ${documentType} document`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploadingFile(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate MCU section
    if (processData.mcu_tanggal && !processData.mcu_status) {
      newErrors.mcu_status = 'Status MCU is required when date is provided';
    }
    if (processData.mcu_status === 'Fit With Note' && !processData.mcu_note.trim()) {
      newErrors.mcu_note = 'Note is required when status is "Fit With Note"';
    }

    // Validate Interview section
    if (processData.interview_tanggal) {
      if (!processData.interview_score_bahasa) newErrors.interview_score_bahasa = 'Score Bahasa is required when interview date is provided';
      if (!processData.interview_score_keahlian) newErrors.interview_score_keahlian = 'Score Keahlian is required when interview date is provided';
      if (!processData.interview_status) newErrors.interview_status = 'Status is required when interview date is provided';
    }

    // Validate Visa section
    if (processData.visa_tanggal_terbit && !processData.visa_lokasi_penerbitan.trim()) {
      newErrors.visa_lokasi_penerbitan = 'Lokasi Penerbitan is required when visa date is provided';
    }

    // Validate Keberangkatan section
    if (processData.keberangkatan_tanggal) {
      if (!processData.keberangkatan_bandara_asal.trim()) {
        newErrors.keberangkatan_bandara_asal = 'Bandara Asal is required when departure date is provided';
      }
      if (!processData.keberangkatan_bandara_tujuan.trim()) {
        newErrors.keberangkatan_bandara_tujuan = 'Bandara Tujuan is required when departure date is provided';
      }
      if (!processData.keberangkatan_no_tiket.trim()) {
        newErrors.keberangkatan_no_tiket = 'No Tiket is required when departure date is provided';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const formattedData = {
        ...processData,
        prescreen_tanggal: processData.prescreen_tanggal ? processData.prescreen_tanggal.toISOString().split('T')[0] : null,
        mcu_tanggal: processData.mcu_tanggal ? processData.mcu_tanggal.toISOString().split('T')[0] : null,
        interview_tanggal: processData.interview_tanggal ? processData.interview_tanggal.toISOString().split('T')[0] : null,
        visa_tanggal_terbit: processData.visa_tanggal_terbit ? processData.visa_tanggal_terbit.toISOString().split('T')[0] : null,
        keberangkatan_tanggal: processData.keberangkatan_tanggal ? processData.keberangkatan_tanggal.toISOString().split('T')[0] : null,
        contract_approval_date: processData.contract_approval_date ? processData.contract_approval_date.toISOString().split('T')[0] : null,
        contract_start_date: processData.contract_start_date ? processData.contract_start_date.toISOString().split('T')[0] : null,
        contract_end_date: processData.contract_end_date ? processData.contract_end_date.toISOString().split('T')[0] : null
      };

      const sanitizedData = Object.fromEntries(
        Object.entries(formattedData).map(([key, value]) => [key, value === '' ? null : value])
      );

      const response = await fetch(`/api/admin/process/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedData)
      });

      if (response.ok) {
        toast.success('Process data saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save process data');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (authenticating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster />
        <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading process data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Process Form</h1>
                <p className="text-sm text-muted-foreground">
                  {submission?.fullName || 'User'} - Processing Information
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Pre-Screening Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">1. Pre-Screening</CardTitle>
                  <CardDescription>
                    Initial screening details before MCU scheduling
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'PreScreening' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'PreScreening' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('PreScreening')}
                  disabled={statusSaving === 'PreScreening'}
                  title="Set status to Pre-Screening"
                >
                  {statusSaving === 'PreScreening' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'PreScreening' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prescreen_tanggal">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.prescreen_tanggal ? format(processData.prescreen_tanggal, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.prescreen_tanggal}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, prescreen_tanggal: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="prescreen_interviewer">Interviewer</Label>
                  <Input
                    id="prescreen_interviewer"
                    value={processData.prescreen_interviewer}
                    onChange={(e) => {
                      setProcessData(prev => ({ ...prev, prescreen_interviewer: e.target.value }));
                      if (errors.prescreen_interviewer) {
                        setErrors(prev => ({ ...prev, prescreen_interviewer: '' }));
                      }
                    }}
                    placeholder="Masukkan nama interviewer"
                    className={`mt-1 ${errors.prescreen_interviewer ? 'border-red-500' : ''}`}
                  />
                  {errors.prescreen_interviewer && (
                    <p className="text-sm text-red-500 mt-1">{errors.prescreen_interviewer}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prescreen_bahasa_inggris">Kemampuan Bahasa Inggris</Label>
                  <Select
                    value={processData.prescreen_bahasa_inggris}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, prescreen_bahasa_inggris: value }));
                      if (errors.prescreen_bahasa_inggris) {
                        setErrors(prev => ({ ...prev, prescreen_bahasa_inggris: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.prescreen_bahasa_inggris ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih kemampuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bad">Bad</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.prescreen_bahasa_inggris && (
                    <p className="text-sm text-red-500 mt-1">{errors.prescreen_bahasa_inggris}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prescreen_finansial">Kemampuan Finansial</Label>
                  <Select
                    value={processData.prescreen_finansial}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, prescreen_finansial: value }));
                      if (errors.prescreen_finansial) {
                        setErrors(prev => ({ ...prev, prescreen_finansial: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.prescreen_finansial ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih kemampuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kurang">Kurang</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Baik">Baik</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.prescreen_finansial && (
                    <p className="text-sm text-red-500 mt-1">{errors.prescreen_finansial}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MCU Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">2. MCU (Medical Check Up)</CardTitle>
                  <CardDescription>
                    Medical examination results and documents
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'MCU' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'MCU' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('MCU')}
                  disabled={statusSaving === 'MCU'}
                  title="Set status to MCU"
                >
                  {statusSaving === 'MCU' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'MCU' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mcu_tanggal">Tanggal MCU</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.mcu_tanggal ? format(processData.mcu_tanggal, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.mcu_tanggal}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, mcu_tanggal: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="mcu_status">Status MCU</Label>
                  <Select
                    value={processData.mcu_status}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, mcu_status: value }));
                      if (errors.mcu_status) {
                        setErrors(prev => ({ ...prev, mcu_status: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.mcu_status ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fit">Fit</SelectItem>
                      <SelectItem value="Unfit">Unfit</SelectItem>
                      <SelectItem value="Fit With Note">Fit With Note</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.mcu_status && (
                    <p className="text-sm text-red-500 mt-1">{errors.mcu_status}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="mcu_note">Catatan MCU</Label>
                <Textarea
                  id="mcu_note"
                  value={processData.mcu_note}
                  onChange={(e) => {
                    setProcessData(prev => ({ ...prev, mcu_note: e.target.value }));
                    if (errors.mcu_note) {
                      setErrors(prev => ({ ...prev, mcu_note: '' }));
                    }
                  }}
                  placeholder="Masukkan catatan hasil MCU..."
                  className={`mt-1 ${errors.mcu_note ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {errors.mcu_note && (
                  <p className="text-sm text-red-500 mt-1">{errors.mcu_note}</p>
                )}
              </div>
              <div>
                <Label htmlFor="mcu_document">Dokumen MCU</Label>
                <div className="mt-1 space-y-2">
                  {processData.mcu_document_url && (
                    <div className="p-2 border rounded-md bg-muted/50">
                      <a
                        href={processData.mcu_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View current document
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="mcu_document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'mcu')}
                      disabled={uploadingFile.mcu}
                    />
                    {uploadingFile.mcu && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">3. Interview</CardTitle>
                  <CardDescription>
                    Interview assessment scores and details
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'Interview' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'Interview' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('Interview')}
                  disabled={statusSaving === 'Interview'}
                  title="Set status to Interview"
                >
                  {statusSaving === 'Interview' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'Interview' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="interview_tanggal">Tanggal Interview</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {processData.interview_tanggal ? format(processData.interview_tanggal, "PPP") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={processData.interview_tanggal}
                      onSelect={(date) => setProcessData(prev => ({ ...prev, interview_tanggal: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="interview_score_bahasa">Score Bahasa</Label>
                  <Select
                    value={processData.interview_score_bahasa}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, interview_score_bahasa: value }));
                      if (errors.interview_score_bahasa) {
                        setErrors(prev => ({ ...prev, interview_score_bahasa: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.interview_score_bahasa ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.interview_score_bahasa && (
                    <p className="text-sm text-red-500 mt-1">{errors.interview_score_bahasa}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="interview_score_keahlian">Score Keahlian</Label>
                  <Select
                    value={processData.interview_score_keahlian}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, interview_score_keahlian: value }));
                      if (errors.interview_score_keahlian) {
                        setErrors(prev => ({ ...prev, interview_score_keahlian: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.interview_score_keahlian ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.interview_score_keahlian && (
                    <p className="text-sm text-red-500 mt-1">{errors.interview_score_keahlian}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="interview_status">Status</Label>
                  <Select
                    value={processData.interview_status}
                    onValueChange={(value) => {
                      setProcessData(prev => ({ ...prev, interview_status: value }));
                      if (errors.interview_status) {
                        setErrors(prev => ({ ...prev, interview_status: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.interview_status ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Pass">Pass</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.interview_status && (
                    <p className="text-sm text-red-500 mt-1">{errors.interview_status}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">4. Working Contract</CardTitle>
                  <CardDescription>
                    Contract approval and work period with document upload
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'Contract' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'Contract' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('Contract')}
                  disabled={statusSaving === 'Contract'}
                  title="Set status to Contract"
                >
                  {statusSaving === 'Contract' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'Contract' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contract_approval_date">Tanggal Persetujuan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.contract_approval_date ? format(processData.contract_approval_date, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.contract_approval_date}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, contract_approval_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="contract_start_date">Tanggal Mulai Bekerja</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.contract_start_date ? format(processData.contract_start_date, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.contract_start_date}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, contract_start_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="contract_end_date">Tanggal Selesai Bekerja</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.contract_end_date ? format(processData.contract_end_date, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.contract_end_date}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, contract_end_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="contract_document">Dokumen Kontrak</Label>
                <div className="mt-1 space-y-2">
                  {processData.contract_document_url && (
                    <div className="p-2 border rounded-md bg-muted/50">
                      <a
                        href={processData.contract_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View current document
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="contract_document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'contract')}
                      disabled={uploadingFile.contract}
                    />
                    {uploadingFile.contract && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visa Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">5. Visa</CardTitle>
                  <CardDescription>
                    Visa information and supporting documents
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'Visa' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'Visa' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('Visa')}
                  disabled={statusSaving === 'Visa'}
                  title="Set status to Visa"
                >
                  {statusSaving === 'Visa' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'Visa' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visa_tanggal_terbit">Tanggal Terbit</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {processData.visa_tanggal_terbit ? format(processData.visa_tanggal_terbit, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={processData.visa_tanggal_terbit}
                        onSelect={(date) => setProcessData(prev => ({ ...prev, visa_tanggal_terbit: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="visa_lokasi_penerbitan">Lokasi Penerbitan</Label>
                  <Input
                    id="visa_lokasi_penerbitan"
                    value={processData.visa_lokasi_penerbitan}
                    onChange={(e) => {
                      setProcessData(prev => ({ ...prev, visa_lokasi_penerbitan: e.target.value }));
                      if (errors.visa_lokasi_penerbitan) {
                        setErrors(prev => ({ ...prev, visa_lokasi_penerbitan: '' }));
                      }
                    }}
                    placeholder="Masukkan lokasi penerbitan visa"
                    className={`mt-1 ${errors.visa_lokasi_penerbitan ? 'border-red-500' : ''}`}
                  />
                  {errors.visa_lokasi_penerbitan && (
                    <p className="text-sm text-red-500 mt-1">{errors.visa_lokasi_penerbitan}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="visa_no_referensi">No Referensi</Label>
                <Input
                  id="visa_no_referensi"
                  value={processData.visa_no_referensi}
                  onChange={(e) => setProcessData(prev => ({ ...prev, visa_no_referensi: e.target.value }))}
                  placeholder="Masukkan nomor referensi visa"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="visa_document">Dokumen Visa</Label>
                <div className="mt-1 space-y-2">
                  {processData.visa_document_url && (
                    <div className="p-2 border rounded-md bg-muted/50">
                      <a
                        href={processData.visa_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View current document
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="visa_document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'visa')}
                      disabled={uploadingFile.visa}
                    />
                    {uploadingFile.visa && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keberangkatan Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">6. Keberangkatan</CardTitle>
                  <CardDescription>
                    Departure information and flight details
                  </CardDescription>
                </div>
                <Button
                  variant={submission?.status === 'Depart' ? 'success' : 'outline'}
                  size="sm"
                  className={`h-8 px-2 ${submission?.status === 'Depart' ? 'border-success/20' : ''}`}
                  onClick={() => setDashboardStatus('Depart')}
                  disabled={statusSaving === 'Depart'}
                  title="Set status to Depart"
                >
                  {statusSaving === 'Depart' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 ${submission?.status === 'Depart' ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keberangkatan_tanggal">Tanggal Berangkat</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {processData.keberangkatan_tanggal ? format(processData.keberangkatan_tanggal, "PPP") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={processData.keberangkatan_tanggal}
                      onSelect={(date) => setProcessData(prev => ({ ...prev, keberangkatan_tanggal: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keberangkatan_bandara_asal">Bandara Asal</Label>
                  <Input
                    id="keberangkatan_bandara_asal"
                    value={processData.keberangkatan_bandara_asal}
                    onChange={(e) => {
                      setProcessData(prev => ({ ...prev, keberangkatan_bandara_asal: e.target.value }));
                      if (errors.keberangkatan_bandara_asal) {
                        setErrors(prev => ({ ...prev, keberangkatan_bandara_asal: '' }));
                      }
                    }}
                    placeholder="Masukkan bandara asal"
                    className={`mt-1 ${errors.keberangkatan_bandara_asal ? 'border-red-500' : ''}`}
                  />
                  {errors.keberangkatan_bandara_asal && (
                    <p className="text-sm text-red-500 mt-1">{errors.keberangkatan_bandara_asal}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="keberangkatan_bandara_tujuan">Bandara Tujuan</Label>
                  <Input
                    id="keberangkatan_bandara_tujuan"
                    value={processData.keberangkatan_bandara_tujuan}
                    onChange={(e) => {
                      setProcessData(prev => ({ ...prev, keberangkatan_bandara_tujuan: e.target.value }));
                      if (errors.keberangkatan_bandara_tujuan) {
                        setErrors(prev => ({ ...prev, keberangkatan_bandara_tujuan: '' }));
                      }
                    }}
                    placeholder="Masukkan bandara tujuan"
                    className={`mt-1 ${errors.keberangkatan_bandara_tujuan ? 'border-red-500' : ''}`}
                  />
                  {errors.keberangkatan_bandara_tujuan && (
                    <p className="text-sm text-red-500 mt-1">{errors.keberangkatan_bandara_tujuan}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="keberangkatan_no_tiket">No Tiket</Label>
                <Input
                  id="keberangkatan_no_tiket"
                  value={processData.keberangkatan_no_tiket}
                  onChange={(e) => {
                    setProcessData(prev => ({ ...prev, keberangkatan_no_tiket: e.target.value }));
                    if (errors.keberangkatan_no_tiket) {
                      setErrors(prev => ({ ...prev, keberangkatan_no_tiket: '' }));
                    }
                  }}
                  placeholder="Masukkan nomor tiket"
                  className={`mt-1 ${errors.keberangkatan_no_tiket ? 'border-red-500' : ''}`}
                />
                {errors.keberangkatan_no_tiket && (
                  <p className="text-sm text-red-500 mt-1">{errors.keberangkatan_no_tiket}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              className="min-h-[44px] px-6"
            >
              Back to Admin
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] px-8"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Process Data'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
