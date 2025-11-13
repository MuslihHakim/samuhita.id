import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getJobBySlug } from '@/lib/services/jobs';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = params || {};
  const result = await getJobBySlug(slug);
  if (result.status !== 200) return {};
  const job = result.body;
  return {
    title: `${job.title} - Lowongan` ,
    description: job.description?.slice(0, 160) || 'Detail lowongan',
  };
}

function Section({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ul className="list-disc pl-6 space-y-1 text-sm leading-relaxed">
        {items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function JobDetailPage({ params }) {
  const { slug } = params || {};
  const result = await getJobBySlug(slug);
  if (result.status !== 200) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/90">
        <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:bg-slate-900/95 dark:border-slate-700/60 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-sm">B</span></div>
              <a href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent leading-tight">BekerjaKeluarNegri.com</a>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <h1 className="text-2xl font-semibold mb-2">Lowongan Tidak Ditemukan</h1>
          <p className="text-sm text-muted-foreground mb-6">Coba lihat lowongan lain atau langsung daftar untuk diinformasikan bila ada kesempatan yang sesuai.</p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline"><a href="/lowongan">Lihat Lowongan</a></Button>
            <Button asChild><a href="/daftar">Daftar</a></Button>
          </div>
        </section>
      </div>
    );
  }
  const job = result.body;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/90">
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:bg-slate-900/95 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-sm">B</span></div>
            <a href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent leading-tight">BekerjaKeluarNegri.com</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30"><a href="/lowongan">Semua Lowongan</a></Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">Detail Lowongan</div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">{job.title}</h1>
          <p className="text-xs text-muted-foreground mt-2">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : ''}</p>
          <div className="mt-4">
            <Button asChild size="sm"><a href="/daftar">Daftar</a></Button>
          </div>
        </div>

        <Card className="dark:bg-slate-800/90 dark:border-slate-700/60">
          <CardContent className="p-6">
            {job.description && (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-6">{job.description}</p>
            )}
            <Section title="Jobdesk / Ranah Pekerjaan" items={job.jobdesk} />
            <Section title="Kualifikasi" items={job.qualifications} />
            <Section title="Benefit" items={job.benefits} />
            <div className="mt-6">
              <Button asChild><a href="/daftar">Daftar Sekarang</a></Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
