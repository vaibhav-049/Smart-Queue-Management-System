import { useState, useEffect } from 'react';
import api from '../services/api';

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        if (response.data && response.data.success) {
          setServices(response.data.data);
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
