'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../../components/HeaderBar.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAddJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [jobdesk, setJobdesk] = useState(['']);
  const [qualifications, setQualifications] = useState(['']);
  const [benefits, setBenefits] = useState(['']);
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
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
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push('/admin/lowongan');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderArrayInput = (label, values, setValues) => (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {values.map((v, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <Input value={v} onChange={(e) => {
            const next = [...values]; next[idx] = e.target.value; setValues(next);
          }} placeholder={`${label} ${idx + 1}`} />
          <Button type="button" variant="outline" onClick={() => {
            const next = values.filter((_, i) => i !== idx); setValues(next.length ? next : ['']);
          }}>Hapus</Button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => setValues([...values, ''])}>Tambah Baris</Button>
    </div>
  );

  return (
    <div>
      <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} showBackToAdmin />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Lowongan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
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
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Batal</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

