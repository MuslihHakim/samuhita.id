'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import HeaderBar from '../../components/HeaderBar.jsx';
import * as api from '../../lib/adminApi';

const fmt = new Intl.NumberFormat('id-ID');
const PAYMENT_FOR_OPTIONS = ['DP', 'Payment 1', 'Payment 2', 'Lunas'];

export default function PaymentFormPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.submissionId;

  const [authenticating, setAuthenticating] = useState(true);
  const [paidAt, setPaidAt] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentFor, setPaymentFor] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ensureAdmin = async () => {
      try {
        const resp = await fetch('/api/admin/session', { method: 'GET', cache: 'no-store' });
        if (!resp.ok) throw new Error('Unauthorized');
        if (!cancelled && submissionId) {
          const res = await api.listPayments(submissionId);
          if (res.ok) setHistory(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setAuthenticating(false);
      }
    };
    ensureAdmin();
    return () => { cancelled = true; };
  }, [router, submissionId]);

  const onAmountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setAmount(digits);
  };

  const amountDisplay = useMemo(() => (amount ? fmt.format(Number(amount)) : ''), [amount]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setProofFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  };

  const submitPayment = async () => {
    if (!paidAt || !amount || !paymentFor || !proofFile) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createPayment({
        submissionId,
        paidAt: new Date(paidAt).toISOString(),
        amountRupiah: Number(amount),
        paymentFor,
        proofFile,
      });
      if (!res?.ok) {
        toast.error(res?.error || 'Gagal menyimpan pembayaran');
        return;
      }
      toast.success('Pembayaran disimpan');
      setPaidAt('');
      setAmount('');
      setPaymentFor('');
      setProofFile(null);
      setProofPreview(null);
      // refresh history
      const list = await api.listPayments(submissionId);
      if (list.ok) setHistory(Array.isArray(list.data) ? list.data : []);
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!paymentId) return;
    if (!confirm('Hapus pembayaran ini?')) return;
    setDeleting(paymentId);
    try {
      const res = await api.deletePayment(paymentId);
      if (!res?.ok) {
        toast.error(res?.error || 'Gagal menghapus pembayaran');
        return;
      }
      setHistory((prev) => prev.filter((p) => p.id !== paymentId));
      toast.success('Pembayaran dihapus');
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setDeleting(null);
    }
  };

  if (authenticating) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} />
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar onSyncSheets={() => {}} onLogout={() => {}} />
      <Toaster richColors />
      <div className="container mx-auto p-4 grid gap-4 md:grid-cols-2">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Tambah Pembayaran</CardTitle>
            <CardDescription>Input detail pembayaran untuk submission ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="paidAt">Tanggal Pembayaran</Label>
                <Input id="paidAt" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Jumlah (Rupiah)</Label>
                <Input
                  id="amount"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountDisplay}
                  onChange={onAmountChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentFor">Payment for</Label>
                <Select value={paymentFor || undefined} onValueChange={setPaymentFor}>
                  <SelectTrigger id="paymentFor">
                    <SelectValue placeholder="Pilih jenis pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FOR_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="proof">Bukti Transfer (gambar)</Label>
                <Input id="proof" type="file" accept="image/*" onChange={onFileChange} />
                {proofPreview && (
                  <img src={proofPreview} alt="Preview" className="mt-2 max-h-48 rounded border" />
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border/40 text-foreground hover:bg-muted/50 min-h-[36px]"
                      type="button"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Admin
                    </Button>
                  </Link>
                </div>
                <div>
                  <Button onClick={submitPayment} disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Simpan Payment'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
            <CardDescription>Daftar pembayaran sebelumnya</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-muted-foreground">Belum ada pembayaran</div>
            ) : (
              <div className="divide-y">
                {history.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">
                        {new Date(p.paid_at).toLocaleDateString()} • Rp {fmt.format(p.amount_rupiah)}
                      </div>
                      <div className="text-sm text-muted-foreground">{p.payment_for}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Lihat Bukti
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={deleting === p.id}
                        onClick={() => deletePayment(p.id)}
                      >
                        {deleting === p.id ? 'Menghapus...' : 'Hapus'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
