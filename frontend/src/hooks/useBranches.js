import { useState, useEffect } from 'react';
import api from '../services/api';
import { getCached, setCache } from '../utils/apiCache';

const CACHE_KEY = 'branches';

export function useBranches() {
  const [branches, setBranches] = useState(() => getCached(CACHE_KEY) || []);
  const [loading, setLoading] = useState(!getCached(CACHE_KEY));

  useEffect(() => {
    const cached = getCached(CACHE_KEY);
    if (cached) {
      setBranches(cached);
      setLoading(false);
      return;
    }

    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        if (response.data && response.data.success) {
          setBranches(response.data.data);
          setCache(CACHE_KEY, response.data.data, 5 * 60 * 1000); 
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, loading };
}
