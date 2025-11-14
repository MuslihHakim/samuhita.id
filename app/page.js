'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

function JobsPreview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/jobs?limit=6', { cache: 'no-store' });
        const data = await res.json();
        if (active) setJobs(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (active) setJobs([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <p className="text-center text-sm text-muted-foreground">Memuat lowongan...</p>;
  if (!jobs.length) return <p className="text-center text-sm text-muted-foreground">Belum ada lowongan.</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">{job.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <a href={`/lowongan/${job.slug}`}>Lebih Lengkap</a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/90">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:bg-slate-900/95 dark:border-slate-700/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 md:py-4 lg:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-3">
            <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-xl md:text-2xl">S</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent leading-tight">
                Samuhita.id
              </h1>
              <p className="text-xs sm:text-xs md:text-sm text-muted-foreground hidden sm:block">Platform Karir Internasional</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-3">
            <ThemeToggle />
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-4 sm:space-y-6 md:space-y-6 lg:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm md:text-sm font-semibold border border-primary/20">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="hidden sm:inline md:inline">Gerbang Anda Menuju Karir Internasional</span>
                <span className="sm:hidden">Karir Internasional</span>
              </div>
              <div className="space-y-3 sm:space-y-4 md:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                  <span className="block">Wujudkan Mimpimu</span>
                  <span className="block text-transparent bg-gradient-to-r from-primary to-teal-600 bg-clip-text">
                    Bekerja di Luar Negeri
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg md:max-w-xl lg:max-w-2xl">
                  Daftarkan diri Anda, biarkan agensi internasional menemukan Anda. Cukup isi data Anda satu kali, kami akan mengubahnya menjadi CV profesional dan menyebarkannya ke jaringan agensi terpercaya kami di berbagai negara.
                </p>
              </div>
              <div className="flex gap-3 sm:gap-6 md:gap-8 lg:gap-8 pt-2 sm:pt-4 md:pt-4">
                <div className="text-center group flex-1 sm:flex-none md:flex-none">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">1</div>
                  <div className="text-xs sm:text-xs md:text-sm text-muted-foreground font-medium">Isi Data</div>
                </div>
                <div className="text-center group flex-1 sm:flex-none md:flex-none">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">2</div>
                  <div className="text-xs sm:text-xs md:text-sm text-muted-foreground font-medium">CV Profesional</div>
                </div>
                <div className="text-center group flex-1 sm:flex-none md:flex-none">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">3</div>
                  <div className="text-xs sm:text-xs md:text-sm text-muted-foreground font-medium">Ditemukan Agensi</div>
                </div>
              </div>
            </div>

            {/* Right Column - CTA */}
            <div className="lg:pl-8 md:mt-8 lg:mt-0">
              <Card className="shadow-lg lg:shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 dark:border-slate-700/60 mx-auto max-w-md md:max-w-lg lg:max-w-none text-center">
                <CardHeader className="text-center pb-4 sm:pb-6 md:pb-6 px-4 sm:px-6 md:px-6">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Mulai Pendaftaran</CardTitle>
                  <CardDescription className="text-sm sm:text-base md:text-base">Isi data Anda pada halaman berikutnya</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 md:px-6">
                  <div className="space-y-4 sm:space-y-5 md:space-y-5">
                    <Button className="w-full h-12" onClick={() => router.push('/daftar')}>Daftar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Lowongan Pekerjaan Section */}
      <section className="container mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Lowongan Pekerjaan</h2>
          </div>
          <JobsPreview />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-18 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-14 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-4">Kenapa Memilih Kami?</h2>
            <p className="text-sm sm:text-base md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Kami menyediakan solusi terpadu untuk membantu Anda meraih karir impian di luar negeri
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-6 lg:gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group dark:bg-slate-800/90 dark:border-slate-700/60">
              <CardContent className="p-4 sm:p-6 md:p-6 text-center space-y-3 sm:space-y-4 md:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-primary/10 rounded-xl sm:rounded-2xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-semibold text-foreground">Proses Aman & Terpercaya</h3>
                <p className="text-xs sm:text-sm md:text-sm text-muted-foreground leading-relaxed">
                  Data pribadi Anda kami jamin kerahasiaannya dan hanya akan disalurkan kepada agensi-agensi resmi yang telah terverifikasi.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group dark:bg-slate-800/90 dark:border-slate-700/60">
              <CardContent className="p-4 sm:p-6 md:p-6 text-center space-y-3 sm:space-y-4 md:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-teal-500/10 rounded-xl sm:rounded-2xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-semibold text-foreground">Peluang Lebih Cepat</h3>
                <p className="text-xs sm:text-sm md:text-sm text-muted-foreground leading-relaxed">
                  CV Anda akan segera kami proses dan distribusikan untuk mempercepat Anda mendapatkan panggilan wawancara dari agensi luar negeri.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group dark:bg-slate-800/90 dark:border-slate-700/60">
              <CardContent className="p-4 sm:p-6 md:p-6 text-center space-y-3 sm:space-y-4 md:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-success/10 rounded-xl sm:rounded-2xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:bg-success/20 transition-colors">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-semibold text-foreground">Dukungan Penuh</h3>
                <p className="text-xs sm:text-sm md:text-sm text-muted-foreground leading-relaxed">
                  Tim kami siap membantu Anda di setiap langkah, mulai dari pengisian data hingga persiapan wawancara.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group dark:bg-slate-800/90 dark:border-slate-700/60">
              <CardContent className="p-4 sm:p-6 md:p-6 text-center space-y-3 sm:space-y-4 md:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-warning/10 rounded-xl sm:rounded-2xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:bg-warning/20 transition-colors">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-8 md:h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-semibold text-foreground">Jaringan Agensi Luas</h3>
                <p className="text-xs sm:text-sm md:text-sm text-muted-foreground leading-relaxed">
                  Kami terhubung dengan puluhan agensi penyalur tenaga kerja terkemuka di berbagai negara tujuan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">&copy; 2025 Samuhita.id. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
