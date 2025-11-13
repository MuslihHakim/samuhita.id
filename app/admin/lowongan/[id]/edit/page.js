'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../../../components/HeaderBar.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminEditJobPage({ params }) {
  const { id } = params || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [jobdesk, setJobdesk] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setDescription(data.description || '');
          setJobdesk(Array.isArray(data.jobdesk) ? data.jobdesk : []);
          setQualifications(Array.isArray(data.qualifications) ? data.qualifications : []);
          setBenefits(Array.isArray(data.benefits) ? data.benefits : []);
          setStatus(data.status || 'draft');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || undefined,
        description,
        jobdesk: jobdesk.filter(Boolean),
        qualifications: qualifications.filter(Boolean),
        benefits: benefits.filter(Boolean),
        status,
      };
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) router.push('/admin/lowongan');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm('Hapus lowongan ini?')) return;
    const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/lowongan');
  };

  const renderArrayInput = (label, values, setValues) => (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {(values.length ? values : ['']).map((v, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <Input value={v} onChange={(e) => {
            const arr = values.length ? [...values] : [''];
            arr[idx] = e.target.value; setValues(arr);
          }} placeholder={`${label} ${idx + 1}`} />
          <Button type="button" variant="outline" onClick={() => {
            const next = (values.length ? values : ['']).filter((_, i) => i !== idx); setValues(next);
          }}>Hapus</Button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => setValues([...(values || []), ''])}>Tambah Baris</Button>
    </div>
  );

  return (
    <div>
      <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} showBackToAdmin />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edit Lowongan</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <Label>Nama Pekerjaan</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <Label>Slug (opsional; auto-generate bila kosong)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-custom" />
                </div>
                <div>
                  <Label>Deskripsi Pekerjaan (plain text)</Label>
                  <textarea className="w-full border rounded p-2 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                {renderArrayInput('Jobdesk', jobdesk, setJobdesk)}
                {renderArrayInput('Kualifikasi', qualifications, setQualifications)}
                {renderArrayInput('Benefit', benefits, setBenefits)}
                <div>
                  <Label>Status</Label>
                  <select className="w-full border rounded p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-between">
                  <Button type="button" variant="destructive" onClick={remove}>Hapus</Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Batal</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

