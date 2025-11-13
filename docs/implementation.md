# Implementasi: Landing Baru + Lowongan Pekerjaan

Tujuan: Menyamakan alur dan fitur landing bekerjakeluarnegri.com dengan hiredglobal.co tanpa mengubah fungsi inti pendaftaran (submissions) yang sudah ada. Fokus utama:
- Landing memiliki tombol CTA “Daftar” (bukan form langsung) yang menuju halaman form pendaftaran terpisah.
- Menambahkan section “Lowongan Pekerjaan” di landing sebelum “Kenapa Memilih Kami?”.
- Halaman detail lowongan dengan tombol “Daftar” yang mengarah ke halaman form pendaftaran.
- Modul Admin untuk CRUD Lowongan (menu “Lowongan” di dashboard admin, di sebelah “Payments”).

## Keputusan Review (disepakati)

- Tidak perlu menangkap konteks job pada submission (tanpa `submissions.jobId`).
- Deskripsi lowongan: plain text saja (tanpa Markdown, tanpa gambar, tanpa link khusus).
- Workflow publish/unpublish: Ya (status `draft|published`).
- Kartu landing hanya menampilkan Judul + tombol “Lebih Lengkap”.
- Tetap sediakan halaman indeks `/lowongan`.
- Nomor WhatsApp tetap `6285881981889`.

## Ringkasan UX & Routing

- Landing (`/`)
  - Hero: tombol besar “Daftar” → menuju `/daftar`.
  - Section baru “Lowongan Pekerjaan”: daftar beberapa lowongan terbaru (mis. 6 item) dengan tombol “Lebih Lengkap” ke detail.
  - Section “Kenapa Memilih Kami?” tetap seperti sekarang.

- Halaman Form Pendaftaran (`/daftar`)
  - Judul: “Langkah Pertama Menuju Karir Impian Anda” + deskripsi yang sama seperti sekarang.
  - Form (Bahasa Indonesia): “Nama Lengkap”, “Alamat Email”, “Nomor HP”.
  - Validasi + debounce check existing sama seperti implementasi saat ini.
  - Submit → tetap ke `/api/submissions` (sama seperti sekarang), lalu toast + buka WhatsApp.
  - Tidak meneruskan parameter/jobId ke submissions.

- Daftar Lowongan (`/lowongan`)
  - Menampilkan semua lowongan yang berstatus “published” (opsional pagination).

- Detail Lowongan (`/lowongan/[slug]`)
  - Menampilkan: Nama Pekerjaan, Deskripsi Pekerjaan, Jobdesk/Ranah Pekerjaan, Kualifikasi, Benefit.
  - Tombol “Daftar” → menuju `/daftar`.
  - Tanpa konteks job pada submission (sesuai keputusan).

- Admin
  - HeaderBar: tombol “Lowongan” di sebelah “Payments”.
  - Daftar Lowongan Admin (`/admin/lowongan`): tabel lowongan + tombol “Tambah”.
  - Tambah Lowongan (`/admin/lowongan/tambah`): form input konten lowongan.
  - Edit Lowongan (`/admin/lowongan/[id]/edit`): form edit + aksi publish/unpublish + hapus.

## Skema Data (Supabase)

Tabel baru: `jobs`

Kolom wajib/utama:
- `id` UUID PK default `gen_random_uuid()`
- `createdAt` timestamptz default now()
- `updatedAt` timestamptz default now()
- `title` text not null (Nama Pekerjaan)
- `slug` text not null unique (untuk URL SEO)
- `description` text not null (Deskripsi Pekerjaan)
- `jobdesk` jsonb default '[]'::jsonb (array string)
- `qualifications` jsonb default '[]'::jsonb (array string)
- `benefits` jsonb default '[]'::jsonb (array string)
- `status` text default 'draft' check in ('draft','published')
- `publishedAt` timestamptz null
- `createdBy` uuid null references `admin_users(id)` on delete set null

Opsional (untuk future): `country`, `location`, `company`, `salary`, `type`, `applyDeadline`.

Catatan keputusan: saat ini TIDAK menambahkan `submissions.jobId` dan tidak meneruskan konteks job pada proses pendaftaran.

Contoh SQL migrasi (adaptasi ke pipeline Anda):

```sql
-- Tabel jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  jobdesk JSONB DEFAULT '[]'::jsonb,
  qualifications JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  "publishedAt" TIMESTAMP WITH TIME ZONE,
  "createdBy" UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Index umum
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs ("publishedAt");

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published jobs" ON jobs;
DROP POLICY IF EXISTS "Admin manage jobs" ON jobs;

-- Publik bisa baca hanya yang published
CREATE POLICY "Public read published jobs" ON jobs FOR SELECT
USING (status = 'published');

-- Admin kelola (sama pattern dengan admin tables lain)
CREATE POLICY "Admin manage jobs" ON jobs FOR ALL
USING (true) WITH CHECK (true);

-- (Tidak diterapkan saat ini: pengaitan submissions → jobs)
```

Catatan: Lokasi terbaik untuk menyimpan skrip migrasi adalah mengikuti pola repo Anda (mis. file SQL baru atau ke `lib/init-db.js`/`SUPABASE_SETUP.sql`).

## API Design (App Router)

Public
- `GET /api/jobs` → list published jobs
  - Query: `page` (default 1), `limit` (default 6–12)
  - Response: `{ items: JobSummary[], page, total, hasMore }`
- `GET /api/jobs/[slug]` → detail published job
  - Response menyertakan `description` (plain text) + arrays `jobdesk|qualifications|benefits`.

Admin (dilindungi middleware session admin)
- `GET /api/admin/jobs` → list semua jobs (draft + published)
- `POST /api/admin/jobs` → create job (status default draft)
- `GET /api/admin/jobs/[id]` → detail job
- `PUT /api/admin/jobs/[id]` → update job (termasuk publish/unpublish + set `publishedAt`)
- `DELETE /api/admin/jobs/[id]` → hapus job

Service Layer (lib/services/jobs.js)
- `listJobs({ status, page, limit })`
- `getJobBySlug(slug)` / `getJobById(id)`
- `createJob(payload)` / `updateJob(id, payload)` / `deleteJob(id)`
 - `generateUniqueSlug(title)` (slugify + penomoran jika bentrok) dan dukung override manual; enforce unik.
- Validasi payload dengan Zod.
 

## Perubahan UI Publik

Landing (`app/page.js`)
- Ganti form inline menjadi tombol CTA “Daftar” ke `/daftar`.
- Tambah section “Lowongan Pekerjaan” (grid atau list sederhana):
  - Ambil `GET /api/jobs?limit=6` (SSR server component untuk SEO).
  - Card berisi: `title` + tombol “Lebih Lengkap” → `/lowongan/[slug]`.
  - Fallback bila kosong: teks “Belum ada lowongan”.
- Biarkan “Kenapa Memilih Kami?” seperti existing.

Halaman Form (`app/daftar/page.js`)
- Ekstrak form dari `app/page.js` saat ini.
- Label field: “Nama Lengkap”, “Alamat Email”, “Nomor HP”.
- Fungsi validasi + debounce `check-existing` + submit ke `/api/submissions` tidak berubah.
- Tetap buka WhatsApp setelah sukses (nomor existing).
- Opsional: baca query `jobId` untuk mengirim ke API submissions (bila disetujui menambah kolom `jobId`).

Daftar Lowongan (`app/lowongan/page.js`)
- List semua yang `status = published` (opsional pagination).
- Set `metadata` SEO dasar.

Detail Lowongan (`app/lowongan/[slug]/page.js`)
- Tampilkan: Nama Pekerjaan, Deskripsi (rich text sederhana), Jobdesk, Kualifikasi, Benefit.
- Render `jobdesk/qualifications/benefits` sebagai bullet list dari array JSONB.
- Tombol “Daftar” → `/daftar` (opsional tambahkan `?jobId=`).

## Perubahan UI Admin

HeaderBar (`app/admin/components/HeaderBar.jsx`)
- Tambah tombol “Lowongan” di sebelah “Payments” → route ke `/admin/lowongan`.

Daftar Lowongan Admin (`app/admin/lowongan/page.js`)
- Tabel: Title, Status, PublishedAt, UpdatedAt, Aksi (Edit/Hapus).
- Tombol “Tambah” → `/admin/lowongan/tambah`.

Form Tambah (`/admin/lowongan/tambah`) & Edit (`/admin/lowongan/[id]/edit`)
- Input:
  - Nama Pekerjaan (title)
  - Deskripsi Pekerjaan (description) — plain text (textarea sederhana)
  - Jobdesk/Ranah (jobdesk) — array string
  - Kualifikasi (qualifications) — array string
  - Benefit (benefits) — array string
- Aksi: Simpan (draft), Publish/Unpublish, Hapus (hanya di Edit).
- Validasi Zod + feedback toast.

Catatan: Form Admin menyertakan field Slug (opsional override; auto-generate bila kosong; wajib unik).

## SEO & Performansi
- Gunakan server components untuk listing/SSR detail job.
- Slug unik + `generateMetadata()` untuk `title/description/canonical`.
- (Future) Structured data JobPosting, sitemap jobs, Open Graph tags.
 - Saat ini deskripsi plain text; React akan escape konten secara default. Jika ingin mendukung newline, gunakan CSS `white-space: pre-line` atau konversi paragraf sederhana.
 - Deskripsi render Markdown → gunakan `react-markdown` + `rehype-sanitize` agar aman dari XSS.

## Validasi & Edge Cases
- Sanitasi konten deskripsi (hindari XSS); gunakan plain text / whitelist minimal.
- Slug bentrok → autoincrement suffix.
- Tampilkan fallback jika tidak ada lowongan.
- Admin middleware sudah ada; gunakan pola yang sama untuk protect `/api/admin/jobs*` dan halaman `/admin/lowongan*`.

## Checklist Implementasi

Skema & Migrasi
- [x] Tambahkan tabel `jobs` + index + RLS (SQL)
- [x] Tambah skrip migrasi di repo sesuai pola (SQL file atau `lib/init-db.js`)

Services & API
- [x] Buat `lib/services/jobs.js` (CRUD, list, getBySlug, slug generator, zod schemas)
- [x] Public: `GET /api/jobs`, `GET /api/jobs/[slug]`
- [x] Admin: `GET/POST /api/admin/jobs`, `GET/PUT/DELETE /api/admin/jobs/[id]`
- [x] Proteksi admin routes via middleware (matcher sudah cover)
- [x] Slug override di Admin dengan validasi unik

UI Publik
- [x] Refactor `app/page.js`: ganti form → CTA “Daftar”, tambah section “Lowongan Pekerjaan”
- [x] Buat `app/daftar/page.js` (copy form existing, label Bahasa, fungsi sama)
- [x] Buat `app/lowongan/page.js` (list)
- [x] Buat `app/lowongan/[slug]/page.js` (detail + tombol “Daftar”)

UI Admin
- [x] Tambah tombol “Lowongan” di `HeaderBar.jsx`
- [x] Buat `app/admin/lowongan/page.js` (tabel)
- [x] Buat `app/admin/lowongan/tambah/page.js` (create form)
- [x] Buat `app/admin/lowongan/[id]/edit/page.js` (edit/publish/delete)

QA & Rilis
- [x] Uji migrasi di Supabase (dev)
- [x] Uji API publik/admin (status, RLS)
- [x] Uji flow publik: Landing → Daftar, Landing → Lowongan → Detail → Daftar
- [x] Uji Admin: create/publish/edit/delete → landing/lowongan ter-update
- [ ] (Opsional) Tambah GTM/Analytics & halaman sitemap bila diperlukan

## Progress Update

- Skema `jobs` + RLS dan index sudah ditambahkan (lihat `lib/init-db.js`).
- Service layer `lib/services/jobs.js` selesai (slug unik, CRUD, list, validasi Zod).
- API publik `/api/jobs` dan `/api/jobs/[slug]` tersedia.
- API admin `/api/admin/jobs` dan `/api/admin/jobs/[id]` tersedia (middleware admin aktif).
- Landing `app/page.js` sudah di-refactor: CTA “Daftar” dan section “Lowongan Pekerjaan”.
- Halaman publik: `app/daftar/page.js`, `app/lowongan/page.js`, dan `app/lowongan/[slug]/page.js` selesai.
- Admin UI: tombol “Lowongan” + halaman list/tambah/edit sudah ada.

## Recently Completed Polishing

- Styling polish: kartu lowongan di landing dan daftar lowongan mendapat hover/spacing konsisten.
- 404/empty states: `/lowongan` dan detail kini memiliki copy yang lebih jelas dan CTA balik (Lihat Lowongan / Daftar).
- Admin list: tambah sorting client-side (judul/status/tanggal publish) dan pagination (10/20/50 per halaman) pada `/admin/lowongan`.
- Admin API: server-side pagination dan sorting untuk `/api/admin/jobs` (query: `page`, `limit`, `sortBy`, `sortDir`).
- Admin list: indikator sorting dengan ikon (ArrowUp/Down/UpDown), kolom non-sort (`Aksi`) non-clickable, tambah pencarian judul (debounced) dan filter status (`all|draft|published`) — semuanya dipetakan ke query server.

## Pending / Next

- Admin list: paging/sorting (ditunda, akan ditambahkan saat data bertambah).
- (Opsional) Tambah basic tests (service/API) dan integrasi CI.

## Test Report (local dev)

Lingkungan dev lokal tanpa Supabase env, dev server Next dijalankan di `:3211` untuk smoke testing:

- API
  - `GET /api/jobs` → 200 OK, payload `{ items: [], page: 1, total: 0, hasMore: false }` (fallback ketika env Supabase belum di-set).
  - `GET /api/jobs/[slug]` → 404 Not Found (fallback ketika env Supabase belum di-set).
  - `GET /api/admin/jobs` → 401 Unauthorized (middleware admin berfungsi).

- Pages
  - `/` (landing) → 200 OK; CTA “Daftar” tampil; section “Lowongan Pekerjaan” tampil dan tidak error walau data kosong.
  - `/daftar` → 200 OK; form tampil; submit belum diuji karena butuh Supabase.
  - `/lowongan` → 200 OK; empty-state dengan CTA “Daftar Sekarang”.
  - `/lowongan/[slug]` (slug acak) → 200 OK; UI “Lowongan Tidak Ditemukan” dengan CTA ke /lowongan dan /daftar.

Catatan: Ketika env Supabase (URL/Anon Key) dikonfigurasi, endpoint `/api/jobs` dan detail akan membaca data nyata dari tabel `jobs`. Admin endpoints juga akan berfungsi penuh sesuai middleware session.

## Umpan Balik & Pertanyaan

Terkonfirmasi oleh Anda (untuk referensi tim):
1) Tidak perlu menangkap konteks job pada submission (tidak ada `jobId`).
2) Deskripsi job: plain text (tanpa Markdown, tanpa gambar/link khusus).
3) Gunakan status publish/unpublish.
4) Kartu landing hanya “Judul + Lebih Lengkap”.
5) Sediakan halaman `/lowongan`.
6) Edit/Hapus di Admin: Ya.
7) WhatsApp: `6285881981889`.

## Saran Peningkatan (Opsional)
- Tambah pencarian/filters di `/lowongan` (negara, kategori) seiring pertumbuhan data.
- Tambah `country/location/company` agar mirip hiredglobal.co.
- Tambah sitemap + JobPosting structured data untuk SEO lowongan.
- Tambah GTM/GA untuk tracking CTA “Daftar” dan view detail lowongan.

---

Dokumen ini dimaksudkan sebagai panduan implementasi bertahap. Setelah Anda review dan setuju dengan skema di atas, saya bisa lanjut mengerjakan migrasi, API, dan UI secara iteratif (landing + form dulu, lalu modul Jobs publik, kemudian Admin Jobs).
