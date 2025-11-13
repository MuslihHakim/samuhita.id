'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { professionOptions } from '@/lib/constants/professions';

const SIGNATURE_ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const SIGNATURE_MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const normalizeSignatureStatus = (status) => {
  if (!status) return 'idle';
  if (status === 'completed') return 'ready';
  return status;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCVData, setHasCVData] = useState(false);
  const signaturePollRef = useRef(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  
  const [cvData, setCvData] = useState({
    // Personal Details
    positionApply: '',
    profession: '',
    gender: '',
    name: '',
    fatherName: '',
    motherName: '',
    height: '',
    weight: '',
    maritalStatus: '',
    placeOfBirth: '',
    dateOfBirth: '',
    address: '',
    religion: '',
    citizenship: '',
    idnPassportNo: '',
    issueDate: '',
    issuedBy: '',
    expDate: '',
    mobileNo: '',
    email: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',
    emergencyContactAddress: '',
    
    // Education (array)
    education: [{ years: '', schoolName: '', subject: '', country: '', ijazahPhotoUrl: '' }],
    
    // Work Experience (array)
    workExperience: [{
      dateFrom: '',
      dateTo: '',
      endOfContract: '',
      positionDetails: '',
      reasonToLeave: '',
      paklaringPhotoUrl: '',
      companyName: '',
    }],
    
    // Languages (array)
    languages: [{ language: '', speaking: '', reading: '', writing: '' }],
    computerSkills: '',
    
    // Skills
    skills: {
      attentiveListening: false,
      problemSolving: false,
      createIdeas: false,
      criticalThinker: false,
      discipline: false,
      responsible: false,
      teamwork: false
    },
    
    // Photo URLs
    photoUrl: '',
    fullBodyPhotoUrl: '',
    passportPhotoUrl: '',
    ktpPhotoUrl: '',
    kartuKeluargaPhotoUrl: '',
    skckPhotoUrl: '',
    aktaKelahiranPhotoUrl: '',

    // Video URLs
    video45DetikUrl: '',

    // Signature
    signatureOriginalUrl: '',
    signatureTransparentUrl: '',
    signatureStatus: 'idle',
    signatureJobId: '',
    signatureError: '',
    signatureUpdatedAt: null
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.isAdmin) {
      router.push('/admin');
      return;
    }

    setUser(userData);
    fetchCVData(userData.id);
  }, []);

  const fetchCVData = async (userId) => {
    try {
      const response = await fetch(`/api/cv?userId=${userId}`);
      const data = await response.json();

      if (!response.ok || data?.error) {
        setHasCVData(false);
        return;
      }

      const {
        paklaringPhotoUrl: legacyPaklaring,
        workExperience: incomingWorkExperience = [],
        signatureStatus: incomingSignatureStatus,
        signatureJobId: incomingSignatureJobId,
        signatureOriginalUrl,
        signatureTransparentUrl,
        signatureError,
        signatureUpdatedAt,
        cvExists,
        ...restData
      } = data || {};

      setCvData((prev) => {
        const sanitizedRestData = { ...restData };
        Object.keys(sanitizedRestData).forEach((key) => {
          if (
            sanitizedRestData[key] == null &&
            Object.prototype.hasOwnProperty.call(prev, key) &&
            typeof prev[key] === 'string'
          ) {
            sanitizedRestData[key] = '';
          }
        });

        let normalizedWorkExperience =
          Array.isArray(incomingWorkExperience) && incomingWorkExperience.length > 0
            ? incomingWorkExperience.map((work) => ({
                dateFrom: work?.dateFrom || '',
                dateTo: work?.dateTo || '',
                endOfContract: work?.endOfContract || '',
                positionDetails: work?.positionDetails || '',
                reasonToLeave: work?.reasonToLeave || '',
                paklaringPhotoUrl: work?.paklaringPhotoUrl || '',
                companyName: work?.companyName || '',
              }))
            : prev.workExperience;

        if (!normalizedWorkExperience || normalizedWorkExperience.length === 0) {
          normalizedWorkExperience = [
            {
              dateFrom: '',
              dateTo: '',
              endOfContract: '',
              positionDetails: '',
              reasonToLeave: '',
              paklaringPhotoUrl: legacyPaklaring || '',
              companyName: '',
            },
          ];
        } else if (
          legacyPaklaring &&
          normalizedWorkExperience.every((work) => !work.paklaringPhotoUrl)
        ) {
          normalizedWorkExperience = normalizedWorkExperience.map((work, idx) => ({
            ...work,
            paklaringPhotoUrl: idx === 0 ? legacyPaklaring : work.paklaringPhotoUrl || '',
          }));
        }

        const nextSignatureStatus = normalizeSignatureStatus(
          incomingSignatureStatus ?? prev.signatureStatus,
        );
        const nextProfession =
          sanitizedRestData.profession ||
          sanitizedRestData.positionApply ||
          prev.profession ||
          '';

        return {
          ...prev,
          ...sanitizedRestData,
          profession: nextProfession,
          workExperience: normalizedWorkExperience,
          signatureStatus: nextSignatureStatus,
          signatureJobId: incomingSignatureJobId ?? prev.signatureJobId,
          signatureOriginalUrl: signatureOriginalUrl ?? prev.signatureOriginalUrl,
          signatureTransparentUrl:
            signatureTransparentUrl ?? prev.signatureTransparentUrl,
          signatureError: signatureError ?? prev.signatureError,
          signatureUpdatedAt: signatureUpdatedAt ?? prev.signatureUpdatedAt,
        };
      });

      const hasRecord = Boolean(data?.id) || Boolean(cvExists);
      setHasCVData(hasRecord);
    } catch (error) {
      console.error('Error fetching CV:', error);
      setHasCVData(false);
    } finally {
      setLoading(false);
    }
  };

  const clearSignaturePoll = () => {
    if (signaturePollRef.current) {
      clearInterval(signaturePollRef.current);
      signaturePollRef.current = null;
    }
  };

  useEffect(() => () => clearSignaturePoll(), []);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;

    if (cvData.signatureStatus !== 'processing' || !cvData.signatureJobId) {
      clearSignaturePoll();
      return undefined;
    }

    if (signaturePollRef.current) {
      return undefined;
    }

    const jobId = cvData.signatureJobId;

    signaturePollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/signature/status?jobId=${jobId}&userId=${userId}`);
        if (!response.ok) return;
        const payload = await response.json();
        if (!payload?.status) return;

        if (payload.status === 'processing') {
          setCvData((prev) => ({
            ...prev,
            signatureOriginalUrl: payload.originalUrl ?? prev.signatureOriginalUrl,
          }));
          return;
        }

        clearSignaturePoll();

        const nextStatus = normalizeSignatureStatus(payload.status);
        setCvData((prev) => ({
          ...prev,
          signatureStatus: nextStatus,
          signatureJobId: payload.jobId ?? prev.signatureJobId,
          signatureOriginalUrl: payload.originalUrl ?? prev.signatureOriginalUrl,
          signatureTransparentUrl: payload.transparentUrl ?? prev.signatureTransparentUrl,
          signatureError: payload.error ?? prev.signatureError,
          signatureUpdatedAt: payload.updatedAt ?? prev.signatureUpdatedAt,
        }));

        if (nextStatus === 'ready') {
          toast.success('Signature processed successfully!');
        } else if (nextStatus === 'failed') {
          toast.error(payload.error || 'Failed to process signature');
        }
      } catch (statusError) {
        console.error('Signature status poll error:', statusError);
      }
    }, 4000);

    return () => {
      clearSignaturePoll();
    };
  }, [cvData.signatureStatus, cvData.signatureJobId, user?.id]);

  const handleSignatureUpload = async (file) => {
    if (!file) return;

    if (!user?.id) {
      toast.error('User session expired. Please re-login.');
      return;
    }

    if (!SIGNATURE_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG or JPG signature images are supported.');
      return;
    }

    if (file.size > SIGNATURE_MAX_SIZE_BYTES) {
      toast.error('Signature file must be under 8MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    setSignatureUploading(true);
    clearSignaturePoll();
    try {
      const response = await fetch('/api/signature', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to upload signature');
        return;
      }

      const normalizedStatus = normalizeSignatureStatus(data.status || 'processing');

      toast.success(
        normalizedStatus === 'ready'
          ? 'Signature processed successfully!'
          : 'Signature uploaded. Processing will continue in background.',
      );

      setCvData((prev) => ({
        ...prev,
        signatureOriginalUrl: data.originalUrl ?? prev.signatureOriginalUrl,
        signatureTransparentUrl: data.transparentUrl ?? prev.signatureTransparentUrl,
        signatureStatus: normalizedStatus,
        signatureJobId: data.jobId ?? prev.signatureJobId,
        signatureError: '',
        signatureUpdatedAt: data.updatedAt ?? new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Signature upload error:', error);
      toast.error('Signature upload error');
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...cvData,
          positionApply: cvData.profession || cvData.positionApply || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('CV saved successfully!');
        setHasCVData(true);
      } else {
        toast.error(data.error || 'Failed to save CV');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCV = async (format) => {
    if (!hasCVData) {
      toast.error('Please save your CV data first before generating a document.');
      return;
    }

    try {
      const response = await fetch(`/api/cv/generate/${user.id}?format=${format}`);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate CV');
        return;
      }

      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `CV_${user.username}.${format}`;
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

      toast.success(`CV generated successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error generating CV:', error);
      toast.error('An error occurred while generating CV');
    }
  };

  const handleFileUpload = async (file, fieldName) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
    formData.append('fileType', fieldName);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Handle education photo uploads specially
        if (fieldName.startsWith('education_')) {
          const match = fieldName.match(/education_(\d+)_ijazahPhotoUrl/);
          if (match) {
            const index = parseInt(match[1]);
            const newEducation = [...cvData.education];
            newEducation[index].ijazahPhotoUrl = data.url;
            setCvData({ ...cvData, education: newEducation });
            toast.success('Ijazah/Akta photo uploaded successfully!');
            return;
          }
        }

        if (fieldName.startsWith('workExperience_')) {
          const match = fieldName.match(/workExperience_(\d+)_paklaringPhotoUrl/);
          if (match) {
            const index = parseInt(match[1]);
            const newWorkExperience = [...cvData.workExperience];
            if (!newWorkExperience[index]) {
              toast.error('Work experience entry not found');
              return;
            }
            newWorkExperience[index].paklaringPhotoUrl = data.url;
            setCvData({ ...cvData, workExperience: newWorkExperience });
            toast.success('Paklaring photo uploaded successfully!');
            return;
          }
        }

        // Map frontend field names to backend field names
        const actualFieldName = fieldName === 'video45Detik' ? 'video45DetikUrl' : fieldName;

        // Regular field upload
        setCvData({ ...cvData, [actualFieldName]: data.url });

        // Show appropriate success message
        if (fieldName === 'video45Detik') {
          toast.success('Video 45 Detik uploaded successfully!');
        } else {
          toast.success('Photo uploaded successfully!');
        }
      } else {
        // Show specific error message for video uploads
        if (fieldName === 'video45Detik') {
          toast.error(data.error || 'Failed to upload video');
        } else {
          toast.error('Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Upload error');
    }
  };

  const addEducation = () => {
    setCvData({
      ...cvData,
      education: [...cvData.education, { years: '', schoolName: '', subject: '', country: '', ijazahPhotoUrl: '' }]
    });
  };

  const addWorkExperience = () => {
    setCvData({
      ...cvData,
      workExperience: [...cvData.workExperience, {
        dateFrom: '',
        dateTo: '',
        endOfContract: '',
        positionDetails: '',
        reasonToLeave: '',
        paklaringPhotoUrl: '',
        companyName: '',
      }]
    });
  };

  const addLanguage = () => {
    setCvData({
      ...cvData,
      languages: [...cvData.languages, { language: '', speaking: '', reading: '', writing: '' }]
    });
  };

  const removeEducation = (index) => {
    const newEducation = cvData.education.filter((_, i) => i !== index);
    setCvData({ ...cvData, education: newEducation });
  };

  const removeWorkExperience = (index) => {
    const newWork = cvData.workExperience.filter((_, i) => i !== index);
    setCvData({ ...cvData, workExperience: newWork });
  };

  const removeLanguage = (index) => {
    const newLang = cvData.languages.filter((_, i) => i !== index);
    setCvData({ ...cvData, languages: newLang });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-card dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card dark:from-gray-950 dark:to-gray-900">
      <Toaster />

      {/* Header */}
      <header className="bg-card/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50 dark:bg-card/95 dark:border-border/60">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-xl">B</span>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-foreground">
                <span className="hidden sm:inline">Welcome, {user?.username}</span>
                <span className="sm:hidden">Hi, {user?.username?.split(' ')[0]}</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Complete your CV information</p>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <ThemeToggle />
            {hasCVData && (
              <>
                <Button
                  onClick={() => handleGenerateCV('word')}
                  variant="outline"
                  size="sm"
                  className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Word</span>
                  <span className="sm:hidden">W</span>
                </Button>
                <Button
                  onClick={() => handleGenerateCV('pdf')}
                  variant="outline"
                  size="sm"
                  className="border-info/20 text-info hover:bg-info/10 hover:border-info/30 transition-all duration-200 min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">PDF</span>
                  <span className="sm:hidden">P</span>
                </Button>
              </>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="success"
              size="sm"
              className="hover:bg-success/90 transition-all duration-200 min-h-[36px] px-2 sm:px-3 text-xs sm:text-sm"
            >
              {saving ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                  <span className="hidden sm:inline">Save CV</span>
                  <span className="sm:hidden">Save</span>
                </div>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 min-h-[36px] px-2 sm:px-3"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Complete Your CV</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Fill in your information below to create a professional CV for international job applications.</p>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          {/* Mobile Tab Navigation - Scrollable */}
          <div className="block sm:hidden mb-4">
            <TabsList className="flex gap-2 overflow-x-auto pb-2 no-scrollbar bg-transparent h-auto p-0">
              <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 flex-shrink-0 min-w-[80px] px-3 py-2 text-xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal
              </TabsTrigger>
              <TabsTrigger value="emergency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 flex-shrink-0 min-w-[80px] px-3 py-2 text-xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Emergency
              </TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 flex-shrink-0 min-w-[80px] px-3 py-2 text-xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                Education
              </TabsTrigger>
              <TabsTrigger value="work" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 flex-shrink-0 min-w-[80px] px-3 py-2 text-xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A6.000 6.000 0 0017 7.255V6a2 2 0 00-2-2H7a2 2 0 00-2 2v1.255A6.000 6.000 0 003 13.255V15a2 2 0 002 2h4.586a1 1 0 01.707.293l3.414-3.414a1 1 0 011.414 0l3.414 3.414a1 1 0 00.707-.293H19a2 2 0 002-2v-1.745z" />
                </svg>
                Work Experience
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 flex-shrink-0 min-w-[80px] px-3 py-2 text-xs">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Skills
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-5 mb-6 sm:mb-8 bg-card/80 backdrop-blur-sm border border-border p-1 rounded-xl shadow-sm dark:bg-card/80 dark:border-border/60">
              <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Personal</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Emergency</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Education</span>
              </TabsTrigger>
              <TabsTrigger value="work" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A6.000 6.000 0 0017 7.255V6a2 2 0 00-2-2H7a2 2 0 00-2 2v1.255A6.000 6.000 0 003 13.255V15a2 2 0 002 2h4.586a1 1 0 01.707.293l3.414-3.414a1 1 0 011.414 0l3.414 3.414a1 1 0 00.707-.293H19a2 2 0 002-2v-1.745z" />
                </svg>
                <span>Work Experience</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Skills</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Details Tab */}
          <TabsContent value="personal">
            <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Details
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-4 px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profession</Label>
                    <Select
                      value={cvData.profession}
                      onValueChange={(value) => setCvData({ ...cvData, profession: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select profession" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={cvData.name}
                      onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={cvData.gender}
                      onValueChange={(value) => setCvData({ ...cvData, gender: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Father's Name</Label>
                    <Input
                      value={cvData.fatherName}
                      onChange={(e) => setCvData({ ...cvData, fatherName: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mother's Name</Label>
                    <Input
                      value={cvData.motherName}
                      onChange={(e) => setCvData({ ...cvData, motherName: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                      placeholder="170 cm"
                      value={cvData.height}
                      onChange={(e) => setCvData({ ...cvData, height: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input
                      placeholder="65 kg"
                      value={cvData.weight}
                      onChange={(e) => setCvData({ ...cvData, weight: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Marital Status</Label>
                    <Select
                      value={cvData.maritalStatus}
                      onValueChange={(value) => setCvData({ ...cvData, maritalStatus: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Place of Birth</Label>
                    <Input
                      value={cvData.placeOfBirth}
                      onChange={(e) => setCvData({ ...cvData, placeOfBirth: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={cvData.dateOfBirth}
                      onChange={(e) => setCvData({ ...cvData, dateOfBirth: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={cvData.address}
                    onChange={(e) => setCvData({ ...cvData, address: e.target.value })}
                    rows={3}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Select
                      value={cvData.religion}
                      onValueChange={(value) => setCvData({ ...cvData, religion: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                        <SelectItem value="Katolik">Katolik</SelectItem>
                        <SelectItem value="Hindu">Hindu</SelectItem>
                        <SelectItem value="Buddha">Buddha</SelectItem>
                        <SelectItem value="Konghucu">Konghucu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Citizenship</Label>
                    <Select
                      value={cvData.citizenship}
                      onValueChange={(value) => setCvData({ ...cvData, citizenship: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Select citizenship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WNI">IDN</SelectItem>
                        <SelectItem value="WNA">Non-IDN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IDN Passport No</Label>
                    <Input
                      value={cvData.idnPassportNo}
                      onChange={(e) => setCvData({ ...cvData, idnPassportNo: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issued By</Label>
                    <Input
                      value={cvData.issuedBy}
                      onChange={(e) => setCvData({ ...cvData, issuedBy: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={cvData.issueDate}
                      onChange={(e) => setCvData({ ...cvData, issueDate: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={cvData.expDate}
                      onChange={(e) => setCvData({ ...cvData, expDate: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mobile No</Label>
                    <Input
                      value={cvData.mobileNo}
                      onChange={(e) => setCvData({ ...cvData, mobileNo: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-4 text-sm sm:text-base">Photo Uploads</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pass Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'photoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.photoUrl && (
                        <img src={cvData.photoUrl} alt="Pass Photo" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Full Body Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'fullBodyPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.fullBodyPhotoUrl && (
                        <img src={cvData.fullBodyPhotoUrl} alt="Full Body" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Passport Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'passportPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.passportPhotoUrl && (
                        <img src={cvData.passportPhotoUrl} alt="Passport" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>KTP Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'ktpPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.ktpPhotoUrl && (
                        <img src={cvData.ktpPhotoUrl} alt="KTP" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Kartu Keluarga Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'kartuKeluargaPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.kartuKeluargaPhotoUrl && (
                        <img src={cvData.kartuKeluargaPhotoUrl} alt="Kartu Keluarga" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>SKCK Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'skckPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.skckPhotoUrl && (
                        <img src={cvData.skckPhotoUrl} alt="SKCK" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Akta Kelahiran Photo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'aktaKelahiranPhotoUrl')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.aktaKelahiranPhotoUrl && (
                        <img src={cvData.aktaKelahiranPhotoUrl} alt="Akta Kelahiran" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                      )}
                  </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm sm:text-base">Signature</h3>
                    {cvData.signatureTransparentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                        asChild
                      >
                        <a href={cvData.signatureTransparentUrl} target="_blank" rel="noopener noreferrer">
                          Download PNG
                        </a>
                      </Button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Upload a clear photo of your handwritten signature on white paper. We&apos;ll remove the background automatically so it&apos;s ready for documents.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4">
                    <div>
                      {cvData.signatureTransparentUrl ? (
                        <div className="relative flex items-center justify-center rounded-md border border-dashed border-border bg-white p-6 transition-all duration-200 bg-[length:16px_16px] bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%),linear-gradient(-45deg,#f4f4f5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f4f5_75%),linear-gradient(-45deg,transparent_75%,#f4f4f5_75%)]">
                          <img
                            src={cvData.signatureTransparentUrl}
                            alt="Signature preview"
                            className="max-h-32 object-contain drop-shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/60 px-4 text-center text-xs sm:text-sm text-muted-foreground">
                          Signature preview will appear here after processing.
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSignatureUpload(file);
                            e.target.value = '';
                          }
                        }}
                        disabled={signatureUploading}
                        className="h-10 sm:h-11"
                      />
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Tips: use black ink, even lighting, and avoid shadows. Max size 8MB.</p>
                        {cvData.signatureUpdatedAt && (
                          <p className="text-[11px] text-muted-foreground/80">
                            Last updated: {new Date(cvData.signatureUpdatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-sm">
                        {signatureUploading ? (
                          <div className="flex items-center gap-2 text-amber-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                            <span>Uploading signature...</span>
                          </div>
                        ) : cvData.signatureStatus === 'processing' ? (
                          <div className="flex items-center gap-2 text-amber-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                            <span>Removing background...</span>
                          </div>
                        ) : cvData.signatureStatus === 'ready' && cvData.signatureTransparentUrl ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Signature ready for documents.</span>
                          </div>
                        ) : cvData.signatureStatus === 'failed' ? (
                          <div className="text-destructive">
                            {cvData.signatureError || 'Processing failed. Please try again with a clearer photo.'}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No signature uploaded yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Upload Section */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-4 text-sm sm:text-base">Video Upload</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Video 45 Detik</Label>
                      <Input
                        type="file"
                        accept="video/mp4"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'video45Detik')}
                        className="h-10 sm:h-11"
                      />
                      {cvData.video45DetikUrl && (
                        <div className="relative">
                          <video
                            src={cvData.video45DetikUrl}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded"
                            controls
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="emergency">
            <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Person to contact in case of emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={cvData.emergencyContactName}
                      onChange={(e) => setCvData({ ...cvData, emergencyContactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={cvData.emergencyContactNumber}
                      onChange={(e) => setCvData({ ...cvData, emergencyContactNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Relation</Label>
                  <Input
                    value={cvData.emergencyContactRelation}
                    onChange={(e) => setCvData({ ...cvData, emergencyContactRelation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={cvData.emergencyContactAddress}
                    onChange={(e) => setCvData({ ...cvData, emergencyContactAddress: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
              <CardHeader>
                <CardTitle>Education Details</CardTitle>
                <CardDescription>Your educational background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.education.map((edu, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-4 bg-card/50 dark:bg-card/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Education #{index + 1}</h4>
                      {cvData.education.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Years</Label>
                        <Input
                          placeholder="2010-2014"
                          value={edu.years}
                          onChange={(e) => {
                            const newEducation = [...cvData.education];
                            newEducation[index].years = e.target.value;
                            setCvData({ ...cvData, education: newEducation });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name of School</Label>
                        <Input
                          value={edu.schoolName}
                          onChange={(e) => {
                            const newEducation = [...cvData.education];
                            newEducation[index].schoolName = e.target.value;
                            setCvData({ ...cvData, education: newEducation });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject / Training</Label>
                        <Input
                          value={edu.subject}
                          onChange={(e) => {
                            const newEducation = [...cvData.education];
                            newEducation[index].subject = e.target.value;
                            setCvData({ ...cvData, education: newEducation });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={edu.country}
                          onChange={(e) => {
                            const newEducation = [...cvData.education];
                            newEducation[index].country = e.target.value;
                            setCvData({ ...cvData, education: newEducation });
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Ijazah Photo</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(file, `education_${index}_ijazahPhotoUrl`);
                            }
                          }}
                          className="h-10 sm:h-11"
                        />
                        {edu.ijazahPhotoUrl && (
                          <img src={edu.ijazahPhotoUrl} alt="Ijazah/Akta" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={addEducation} variant="outline" className="w-full">
                  + Add Education
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Experience Tab */}
          <TabsContent value="work">
            <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Your professional experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cvData.workExperience.map((work, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-4 bg-card/50 dark:bg-card/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Experience #{index + 1}</h4>
                      {cvData.workExperience.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkExperience(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date From</Label>
                        <Input
                          type="date"
                          value={work.dateFrom}
                          onChange={(e) => {
                            const newWork = [...cvData.workExperience];
                            newWork[index].dateFrom = e.target.value;
                            setCvData({ ...cvData, workExperience: newWork });
                          }}
                        />
                        <Label>Work Place</Label>
                        <Input
                          type="text"
                          placeholder="e.g. PT Maju Jaya"
                          value={work.companyName || ''}
                          onChange={(e) => {
                            const newWork = [...cvData.workExperience];
                            newWork[index].companyName = e.target.value;
                            setCvData({ ...cvData, workExperience: newWork });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date To</Label>
                        <Input
                          type="date"
                          value={work.dateTo}
                          onChange={(e) => {
                            const newWork = [...cvData.workExperience];
                            newWork[index].dateTo = e.target.value;
                            setCvData({ ...cvData, workExperience: newWork });
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Position Held and Details of Work</Label>
                      <Textarea
                        value={work.positionDetails}
                        onChange={(e) => {
                          const newWork = [...cvData.workExperience];
                          newWork[index].positionDetails = e.target.value;
                          setCvData({ ...cvData, workExperience: newWork });
                        }}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason to Leave</Label>
                    <Textarea
                      value={work.reasonToLeave}
                      onChange={(e) => {
                        const newWork = [...cvData.workExperience];
                        newWork[index].reasonToLeave = e.target.value;
                        setCvData({ ...cvData, workExperience: newWork });
                      }}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Paklaring Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleFileUpload(file, `workExperience_${index}_paklaringPhotoUrl`);
                        }
                      }}
                      className="h-10 sm:h-11"
                    />
                    {work.paklaringPhotoUrl && (
                      <img
                        src={work.paklaringPhotoUrl}
                        alt={`Paklaring ${index + 1}`}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              ))}
              <Button onClick={addWorkExperience} variant="outline" className="w-full">
                + Add Work Experience
              </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card className="border-0 shadow-md sm:shadow-lg bg-card hover-lift transition-all duration-200">
              <CardHeader>
                <CardTitle>Languages & Skills</CardTitle>
                <CardDescription>Your language proficiency and skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Languages */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Languages</h3>
                  {cvData.languages.map((lang, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-4 bg-card/50 dark:bg-card/30">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Language #{index + 1}</h4>
                        {cvData.languages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLanguage(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Input
                            placeholder="English"
                            value={lang.language}
                            onChange={(e) => {
                              const newLang = [...cvData.languages];
                              newLang[index].language = e.target.value;
                              setCvData({ ...cvData, languages: newLang });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Speaking</Label>
                          <Select
                            value={lang.speaking}
                            onValueChange={(value) => {
                              const newLang = [...cvData.languages];
                              newLang[index].speaking = value;
                              setCvData({ ...cvData, languages: newLang });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Reading</Label>
                          <Select
                            value={lang.reading}
                            onValueChange={(value) => {
                              const newLang = [...cvData.languages];
                              newLang[index].reading = value;
                              setCvData({ ...cvData, languages: newLang });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Writing</Label>
                          <Select
                            value={lang.writing}
                            onValueChange={(value) => {
                              const newLang = [...cvData.languages];
                              newLang[index].writing = value;
                              setCvData({ ...cvData, languages: newLang });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button onClick={addLanguage} variant="outline" className="w-full">
                    + Add Language
                  </Button>
                </div>

                {/* Computer Skills */}
                <div className="space-y-2">
                  <Label>Computer Skills</Label>
                  <Textarea
                    placeholder="Microsoft Office, Adobe Photoshop, etc."
                    value={cvData.computerSkills}
                    onChange={(e) => setCvData({ ...cvData, computerSkills: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Soft Skills */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Soft Skills</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.attentiveListening}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, attentiveListening: checked } })
                        }
                      />
                      <Label>Attentive listening and effective oral communication skills</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.problemSolving}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, problemSolving: checked } })
                        }
                      />
                      <Label>Great at problem solving</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.createIdeas}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, createIdeas: checked } })
                        }
                      />
                      <Label>Ability to quickly create and apply ideas and solutions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.criticalThinker}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, criticalThinker: checked } })
                        }
                      />
                      <Label>Critical Thinker</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.discipline}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, discipline: checked } })
                        }
                      />
                      <Label>Discipline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.responsible}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, responsible: checked } })
                        }
                      />
                      <Label>Responsible</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={cvData.skills.teamwork}
                        onCheckedChange={(checked) =>
                          setCvData({ ...cvData, skills: { ...cvData.skills, teamwork: checked } })
                        }
                      />
                      <Label>Able to work with team</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button (Fixed Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 shadow-lg z-40 dark:bg-card/95 dark:border-border/60">
          <div className="container mx-auto max-w-6xl flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {hasCVData ? 'Your changes are automatically saved' : 'Complete all sections to enable CV generation'}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="success"
              size="lg"
              className="hover:bg-success/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                  <span>Save CV</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
