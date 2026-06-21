import { useState, useEffect } from 'react';
import api from '../services/api';
import { getCached, setCache } from '../utils/apiCache';

const CACHE_KEY = 'services';

export function useServices() {
  const [services, setServices] = useState(() => getCached(CACHE_KEY) || []);
  const [loading, setLoading] = useState(!getCached(CACHE_KEY));

  useEffect(() => {
    const cached = getCached(CACHE_KEY);
    if (cached) {
      setServices(cached);
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        if (response.data && response.data.success) {
          setServices(response.data.data);
          setCache(CACHE_KEY, response.data.data, 5 * 60 * 1000); 
        }
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading };
}
