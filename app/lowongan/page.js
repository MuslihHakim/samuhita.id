import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { listJobs } from '@/lib/services/jobs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lowongan Pekerjaan - BekerjaKeluarNegri.com',
  description: 'Daftar lowongan pekerjaan yang tersedia.',
};

export default async function LowonganListPage() {
  const result = await listJobs({ status: 'published', page: 1, limit: 50 });
  const items = result.status === 200 && Array.isArray(result.body.items) ? result.body.items : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/90">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:bg-slate-900/95 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <a href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent leading-tight">BekerjaKeluarNegri.com</a>
              <p className="text-xs text-muted-foreground hidden sm:block">Platform Karir Internasional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30">
              <a href="/login">Login</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">Lowongan Tersedia</div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">Lowongan Pekerjaan</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Temukan peluang kerja terbaru dari mitra kami. Klik detail untuk informasi lengkap.</p>
          <div className="mt-4">
            <Button asChild size="sm"><a href="/daftar">Daftar Sekarang</a></Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border p-6 text-center bg-white/60 dark:bg-slate-900/50">
            <p className="text-sm text-muted-foreground mb-4">Belum ada lowongan yang tersedia saat ini.</p>
            <Button asChild>
              <a href="/daftar">Daftar Sekarang</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-all duration-200 dark:bg-slate-800/90 dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-base leading-snug line-clamp-2">{job.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/lowongan/${job.slug}`}>Lebih Lengkap</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
