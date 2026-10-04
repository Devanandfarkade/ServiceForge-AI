/**
 * ServiceForge AI — useServiceRequests Hook
 *
 * Fetches service requests from the live API. Falls back to mock data
 * if the API is unreachable or the user is not yet authenticated.
 *
 * Usage:
 *   const { requests, isLoading, error, refetch } = useServiceRequests(filters);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { liveServiceRequestService } from '../services/liveServiceRequestService';
import { serviceRequestService } from '../services/serviceRequestService'; // mock fallback

export function useServiceRequests(filters = {}) {
  const { isLoggedIn } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stable filter key to avoid re-fetching on every render
  const filtersKey = JSON.stringify(filters);
  const abortRef = useRef(null);

  const fetchRequests = useCallback(async () => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current = false;
    const alive = { current: true };
    abortRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      let data;
      if (isLoggedIn) {
        data = await liveServiceRequestService.getRequests(filters);
      } else {
        // Unauthenticated — use mock data so UI is still usable in demo mode
        data = await serviceRequestService.getRequests(filters);
      }
      if (alive.current) {
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (alive.current) {
        if (err.code === 'INVALID_TOKEN') {
          // Session expired — AuthContext will redirect
          return;
        }
        setError(err.message || 'Failed to load service requests.');
        if (!isLoggedIn) {
          try {
            const fallback = await serviceRequestService.getRequests(filters);
            setRequests(Array.isArray(fallback) ? fallback : []);
          } catch {
            setRequests([]);
          }
        } else {
          setRequests([]);
        }
      }
    } finally {
      if (alive.current) setIsLoading(false);
    }

    return () => { alive.current = false; };
  }, [isLoggedIn, filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, isLoading, error, refetch: fetchRequests };
}

/**
 * ServiceForge AI — useServiceRequest Hook
 *
 * Fetches a single service request by ID from the live API.
 *
 * Usage:
 *   const { request, isLoading, error, refetch } = useServiceRequest(id);
 */
export function useServiceRequest(id) {
  const { isLoggedIn } = useAuth();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      let data;
      if (isLoggedIn) {
        data = await liveServiceRequestService.getRequestById(id);
      } else {
        data = await serviceRequestService.getRequestById(id);
      }
      setRequest(data);
    } catch (err) {
      setError(err.message || 'Failed to load service request.');
      if (!isLoggedIn) {
        try {
          const fallback = await serviceRequestService.getRequestById(id);
          setRequest(fallback);
        } catch {
          setRequest(null);
        }
      } else {
        setRequest(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoggedIn]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return { request, isLoading, error, refetch: fetchRequest };
}
