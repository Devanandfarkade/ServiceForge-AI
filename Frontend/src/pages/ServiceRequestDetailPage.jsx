import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../lib/AuthContext';
import { liveServiceRequestService } from '../services/liveServiceRequestService';
import { liveServiceJobService } from '../services/liveServiceJobService';
import { serviceRequestService } from '../services/serviceRequestService'; // mock fallback
import { serviceJobService } from '../services/serviceJobService'; // mock fallback

export function ServiceRequestDetailPage({ id }) {
  const { navigate } = useRouter();
  const { isLoggedIn } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobError, setJobError] = useState(null);

  useEffect(() => {
    async function loadRequest() {
      if (!id) return;
      setLoading(true);
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
        // For authenticated users: show the real error, do NOT silently fall back to mock
        if (isLoggedIn) {
          setError(err.message || 'Failed to load service request.');
        } else {
          // Unauthenticated: try mock
          try {
            const fallback = await serviceRequestService.getRequestById(id);
            setRequest(fallback);
          } catch {
            setError('Service request not found.');
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id, isLoggedIn]);

  if (loading) return <LoadingSpinner label="Loading request details..." />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-3">
          <span className="text-lg">⚠</span>
          <div>
            <div className="font-bold">Failed to load service request</div>
            <div className="font-medium text-xs opacity-80 mt-1">{error}</div>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate('/requests')}>← Back to Requests</Button>
      </div>
    );
  }

  if (!request) return <div className="text-slate-500 p-8 text-center font-bold">Service Request Not Found.</div>;

  const handleCreateJob = async () => {
    setJobError(null);
    setIsCreatingJob(true);
    try {
      let newJob;
      if (isLoggedIn) {
        newJob = await liveServiceJobService.createJobFromRequest(request, request.aiAnalysis);
      } else {
        newJob = await serviceJobService.createJobFromRequest(request, request.aiAnalysis);
      }
      navigate(`/jobs/${newJob.jobId}`);
    } catch (err) {
      setJobError(err.message || 'Failed to create service job. Please try again.');
      setIsCreatingJob(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">{request.ticketNumber}</h1>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">Submitted on {new Date(request.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/requests')}>← Back to Requests</Button>
          <Button
            variant="primary"
            onClick={handleCreateJob}
            disabled={isCreatingJob}
          >
            {isCreatingJob ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Job…
              </span>
            ) : 'Approve & Create Job →'}
          </Button>
        </div>
      </div>

      {/* Job creation error */}
      {jobError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2" role="alert">
          <span className="font-bold">⚠</span>
          <span>{jobError}</span>
        </div>
      )}

      {/* Side-by-Side View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer Reported Information */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Customer Reported Information</CardTitle>
          </CardHeader>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Customer Account:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{request.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Target Asset:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{request.assetName}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Raw Issue Text:</span>
              <div className="mt-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 italic leading-relaxed font-medium">
                "{request.rawDescription}"
              </div>
            </div>
          </div>
        </Card>

        {/* Right: AI Decision Support Analysis */}
        <Card className="space-y-4 border-blue-200 dark:border-blue-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">✨</span>
              <CardTitle>AI Job Preparation</CardTitle>
            </div>
            {request.aiAnalysis && <Badge variant="blue">Confidence: {(request.aiAnalysis.confidenceScore * 100).toFixed(0)}%</Badge>}
          </CardHeader>

          {request.aiAnalysis ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px] tracking-wider">Executive Summary</span>
                <p className="text-slate-800 dark:text-slate-200 mt-1 font-medium leading-relaxed">{request.aiAnalysis.summary}</p>
              </div>

              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px] tracking-wider mb-1">Suggested Inspection Steps</span>
                <div className="space-y-1.5">
                  {request.aiAnalysis.suggestedInspectionSteps.map((step, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{step.stepNumber}. {step.instruction}</span>
                      {step.critical && <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 rounded font-bold">LOTO</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-amber-800 dark:text-amber-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Safety Guidelines</span>
                {request.aiAnalysis.safetyConsiderations.map((s, idx) => (
                  <div key={idx} className="text-amber-800 dark:text-amber-300 text-[11px] font-semibold">⚠ {s}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-500">No AI analysis available for this request.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
