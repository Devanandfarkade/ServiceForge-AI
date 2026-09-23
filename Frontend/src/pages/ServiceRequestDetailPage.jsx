import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { serviceRequestService } from '../services/serviceRequestService';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ServiceRequestDetailPage({ id }) {
  const { navigate } = useRouter();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequest() {
      if (!id) return;
      const data = await serviceRequestService.getRequestById(id);
      setRequest(data);
      setLoading(false);
    }
    loadRequest();
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading request details..." />;
  if (!request) return <div className="text-slate-400 p-8 text-center">Service Request Not Found.</div>;

  const handleCreateJob = async () => {
    const newJob = await serviceJobService.createJobFromRequest(request, request.aiAnalysis);
    navigate(`/jobs/${newJob.jobId}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black font-mono text-cyan-400">{request.ticketNumber}</h1>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(request.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/requests')}>← Back to Requests</Button>
          <Button variant="primary" onClick={handleCreateJob}>Approve & Create Job →</Button>
        </div>
      </div>

      {/* Side-by-Side View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer Reported Information */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Customer Reported Information</CardTitle>
          </CardHeader>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Customer Account:</span>
              <span className="text-slate-100 font-semibold">{request.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Target Asset:</span>
              <span className="text-slate-100 font-semibold">{request.assetName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Raw Issue Text:</span>
              <div className="mt-1 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 italic leading-relaxed">
                "{request.rawDescription}"
              </div>
            </div>
          </div>
        </Card>

        {/* Right: AI Decision Support Analysis */}
        <Card className="space-y-4 border-cyan-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✨</span>
              <CardTitle>AI Job Preparation</CardTitle>
            </div>
            {request.aiAnalysis && <Badge variant="cyan">Confidence: {(request.aiAnalysis.confidenceScore * 100).toFixed(0)}%</Badge>}
          </CardHeader>

          {request.aiAnalysis ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider">Executive Summary</span>
                <p className="text-slate-200 mt-0.5">{request.aiAnalysis.summary}</p>
              </div>

              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-1">Suggested Inspection Steps</span>
                <div className="space-y-1">
                  {request.aiAnalysis.suggestedInspectionSteps.map((step, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <span>{step.stepNumber}. {step.instruction}</span>
                      {step.critical && <span className="text-[9px] px-1 bg-rose-500/20 text-rose-300 rounded font-bold">LOTO</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-1">Safety Guidelines</span>
                {request.aiAnalysis.safetyConsiderations.map((s, idx) => (
                  <div key={idx} className="text-amber-300 text-[11px]">⚠ {s}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400">No AI analysis available for this request.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
