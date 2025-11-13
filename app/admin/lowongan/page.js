'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeaderBar from '../components/HeaderBar.jsx';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

const PAGE_SIZES = [10, 20, 50];
const STATUSES = ['all', 'draft', 'published'];

export default function AdminJobsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('publishedAt'); // 'title' | 'status' | 'publishedAt' | 'updatedAt'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy,
        sortDir,
      });
      if (statusFilter && statusFilter !== 'all') qs.set('status', statusFilter);
      if (debouncedSearch) qs.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/jobs?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        if (res.status === 401) setError('Unauthorized. Silakan login admin.');
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (e) {
      setError('Gagal memuat data');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [page, pageSize, sortBy, sortDir, statusFilter, debouncedSearch]);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Math.min(page, maxPage);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  return (
    <div>
      <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Lowongan</h1>
          <Link href="/admin/lowongan/tambah">
            <Button>Tambah</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada lowongan.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">{total} item • Halaman {curPage} dari {maxPage}</div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 border rounded px-2 py-1">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    className="outline-none bg-transparent text-sm"
                    placeholder="Cari judul..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <select className="border rounded p-1 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Per halaman</label>
                  <select className="border rounded p-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 cursor-pointer select-none" onClick={() => toggleSort('title')}>
                      Judul {sortBy==='title' ? (sortDir==='asc'?<ArrowUp className="inline w-3 h-3" />:<ArrowDown className="inline w-3 h-3" />) : <ArrowUpDown className="inline w-3 h-3 text-muted-foreground" />}
                    </th>
                    <th className="text-left p-2 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                      Status {sortBy==='status' ? (sortDir==='asc'?<ArrowUp className="inline w-3 h-3" />:<ArrowDown className="inline w-3 h-3" />) : <ArrowUpDown className="inline w-3 h-3 text-muted-foreground" />}
                    </th>
                    <th className="text-left p-2 cursor-pointer select-none" onClick={() => toggleSort('publishedAt')}>
                      Published At {sortBy==='publishedAt' ? (sortDir==='asc'?<ArrowUp className="inline w-3 h-3" />:<ArrowDown className="inline w-3 h-3" />) : <ArrowUpDown className="inline w-3 h-3 text-muted-foreground" />}
                    </th>
                    <th className="text-left p-2 select-none">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((j) => (
                    <tr key={j.id} className="border-t">
                      <td className="p-2">{j.title}</td>
                      <td className="p-2 capitalize">{j.status}</td>
                      <td className="p-2">{j.publishedAt ? new Date(j.publishedAt).toLocaleString() : '-'}</td>
                      <td className="p-2">
                        <Link href={`/admin/lowongan/${j.id}/edit`} className="text-primary hover:underline">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={curPage===1}>&lt;&lt;</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, curPage-1))} disabled={curPage===1}>Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">{curPage} / {maxPage}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(maxPage, curPage+1))} disabled={curPage===maxPage}>Berikutnya</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(maxPage)} disabled={curPage===maxPage}>&gt;&gt;</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
