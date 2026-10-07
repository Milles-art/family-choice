import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void api<T>(path).then(value => { if (active) setData(value); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Unable to load information.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, attempt]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') retry(); };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [retry]);
  return { data, loading, error, retry };
}
