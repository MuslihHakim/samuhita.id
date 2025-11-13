import { useCallback, useState } from 'react';
import * as api from '../lib/adminApi';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data, error } = await api.listSubmissions();
      if (!ok || !Array.isArray(data)) {
        if (error) {
          console.error('Failed to fetch submissions:', error);
        }
        setSubmissions([]);
        return;
      }

      setSubmissions(data);
    } catch (err) {
      console.error('Unexpected error fetching submissions:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submissions, setSubmissions, loading, fetchSubmissions };
}
