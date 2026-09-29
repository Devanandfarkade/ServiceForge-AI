/**
 * ServiceForge AI — useServiceJobs Hook
 *
 * Fetches service jobs from the live API. Falls back to mock data
 * if the API is unreachable or the user is not authenticated.
 *
 * Usage:
 *   const { jobs, isLoading, error, refetch } = useServiceJobs(filters);
 *   const { job, isLoading, error, refetch } = useServiceJob(id);
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { liveServiceJobService } from '../services/liveServiceJobService';
import { serviceJobService } from '../services/serviceJobService'; // mock fallback

export function useServiceJobs(filters = {}) {
  const { isLoggedIn } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data;
      if (isLoggedIn) {
        data = await liveServiceJobService.getJobs(filters);
      } else {
        data = await serviceJobService.getJobs(filters);
      }
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.code === 'INVALID_TOKEN') return;
      setError(err.message || 'Failed to load service jobs.');
      try {
        const fallback = await serviceJobService.getJobs(filters);
        setJobs(Array.isArray(fallback) ? fallback : []);
      } catch {
        setJobs([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, isLoading, error, refetch: fetchJobs };
}

export function useServiceJob(id) {
  const { isLoggedIn } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      let data;
      if (isLoggedIn) {
        data = await liveServiceJobService.getJobById(id);
      } else {
        data = await serviceJobService.getJobById(id);
      }
      setJob(data);
    } catch (err) {
      setError(err.message || 'Failed to load service job.');
      try {
        const fallback = await serviceJobService.getJobById(id);
        setJob(fallback);
      } catch {
        setJob(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoggedIn]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return { job, isLoading, error, refetch: fetchJob };
}
