import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge, PriorityBadge } from '../components/ui/Badge';
import { Stepper } from '../components/ui/Stepper';
import { customerService } from '../services/customerService';
import { assetService } from '../services/assetService';
import { serviceRequestService } from '../services/serviceRequestService';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';

export function CreateServiceRequestPage() {
  const { navigate } = useRouter();
  const fileInputRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [description, setDescription] = useState(
    'Our industrial compressor starts normally but becomes very noisy and shuts down after about ten minutes.'
  );
  const [priority, setPriority] = useState('HIGH');
  
  const [attachedFiles, setAttachedFiles] = useState([
    { name: 'compressor_sound_log.mp3', size: '2.4 MB' }
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStepText, setProcessingStepText] = useState('Understanding request...');
  const [createdRequest, setCreatedRequest] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    async function loadFormOptions() {
      const custs = await customerService.getCustomers();
      const asts = await assetService.getAssets();
      setCustomers(custs);
      setAssets(asts);
      if (custs.length > 0) setSelectedCustomerId(custs[0].customerId);
      if (asts.length > 0) setSelectedAssetId(asts[0].assetId);
    }
    loadFormOptions();
  }, []);

  const handleAddFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeWithAI = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsAnalyzing(true);

    const cust = customers.find(c => c.customerId === selectedCustomerId);
    const ast = assets.find(a => a.assetId === selectedAssetId);

    const newReq = await serviceRequestService.createRequest({
      customerId: selectedCustomerId,
      customerName: cust ? cust.companyName : "Industrial Plastics Corp",
      assetId: selectedAssetId,
      assetName: ast ? ast.name : "Industrial Air Compressor AC-4500",
      rawDescription: description,
      priority
    });

    setCreatedRequest(newReq);

    // Processing step transitions
    setProcessingStepText('Understanding request...');
    setTimeout(() => setProcessingStepText('Identifying equipment...'), 400);
    setTimeout(() => setProcessingStepText('Assessing urgency...'), 800);
    setTimeout(() => setProcessingStepText('Preparing technician requirements...'), 1200);

    setTimeout(async () => {
      const result = await serviceRequestService.analyzeRequest(newReq.requestId);
      setAiResult(result);
      setIsAnalyzing(false);
    }, 1600);
  };

  const handleCreateServiceJob = async () => {
    if (!createdRequest || !aiResult) return;
    const newJob = await serviceJobService.createJobFromRequest(createdRequest, aiResult);
    navigate(`/jobs/${newJob.jobId}`);
  };

  const formSteps = [
    { title: 'Intake Information', subtitle: 'Customer & issue details' },
    { title: 'AI Job Preparation & Decision Support', subtitle: 'Safety & dispatch steps' }
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Create Service Request
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Submit customer reported issues for automated AI decision support and job preparation.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
          ← Back to Requests
        </Button>
      </div>

      {/* Visual Stepper Primitive */}
      <Stepper 
        steps={formSteps} 
        currentStep={aiResult ? 2 : 1} 
        onStepClick={(step) => {
          if (step === 1 && aiResult) setAiResult(null);
        }}
      />

      {!aiResult && !isAnalyzing && (
        <Card className="p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-800 pb-2">
            STEP 1 — Request Information Intake
          </div>
          <form onSubmit={handleAnalyzeWithAI} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Customer Account"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={customers.map(c => ({ label: `${c.companyName} (${c.slaTier})`, value: c.customerId }))}
              />

              <Select
                label="Target Equipment / Asset"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                options={assets.map(a => ({ label: `${a.name} (SN: ${a.serialNumber})`, value: a.assetId }))}
              />
            </div>

            <Select
              label="Reported Urgency / Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: 'High Priority (4h SLA Target)', value: 'HIGH' },
                { label: 'Critical Outage (2h SLA Target)', value: 'CRITICAL' },
                { label: 'Medium Priority (8h SLA Target)', value: 'MEDIUM' },
                { label: 'Low Priority (24h SLA Target)', value: 'LOW' }
              ]}
            />

            <Textarea
              label="Issue Description"
              rows={4}
              placeholder="Describe the problem reported by the customer (symptoms, noise, thermal shutoff time, error codes)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            {/* Attachments Upload Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 text-sm">📎</span>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Attachments (Optional)
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Audio logs, digital panel screenshots, site photos
                    </div>
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddFilesClick}>
                  + Add Files
                </Button>
              </div>

              {/* Uploaded File Items */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                  {attachedFiles.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/60 text-xs shadow-sm"
                    >
                      <span className="text-slate-400 text-[11px]">📄</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">({file.size})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-500 text-xs ml-1 font-bold cursor-pointer"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/requests')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                ✨ Analyze with AI
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Processing State */}
      {isAnalyzing && (
        <Card className="p-10 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              AI Decision Support Engine
            </h3>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono animate-pulse">{processingStepText}</p>
          </div>
        </Card>
      )}

      {/* STEP 2 — AI Job Preparation (Split View) */}
      {aiResult && !isAnalyzing && (
        <div className="space-y-4">
          {/* Confidence & Disclaimer Header */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                AI Decision Support
              </span>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                AI-generated recommendations require human review before execution.
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
              Confidence: High · {(aiResult.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>

          {/* Side-by-Side Review Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
            {/* LEFT: Customer Reported Information */}
            <Card className="space-y-3.5">
              <CardHeader>
                <CardTitle>Customer Reported Information</CardTitle>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{createdRequest?.ticketNumber}</span>
              </CardHeader>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Customer Account</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{createdRequest?.customerName}</span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Target Equipment</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{createdRequest?.assetName}</span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Raw Reported Text</span>
                  <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "{createdRequest?.rawDescription}"
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Uploaded Attachments</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {attachedFiles.map((file, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">
                          📄 {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Reported Priority</span>
                  <div className="mt-1"><PriorityBadge priority={createdRequest?.priority} /></div>
                </div>
              </div>
            </Card>

            {/* RIGHT: AI Job Preparation */}
            <Card className="space-y-4 border-cyan-200 dark:border-cyan-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400">⚡</span>
                  <CardTitle>AI Job Preparation</CardTitle>
                </div>
                <Badge variant="cyan">Recommended Priority: {aiResult.recommendedPriority}</Badge>
              </CardHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider">Required Expertise</span>
                  <div className="mt-1 text-slate-900 dark:text-slate-200 font-semibold">{aiResult.recommendedSkillProfile}</div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Initial Inspection Steps</span>
                  <div className="space-y-1">
                    {aiResult.suggestedInspectionSteps.map((step, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">{step.stepNumber}.</span>
                        <span className="text-slate-700 dark:text-slate-300 flex-1">{step.instruction}</span>
                        {step.critical && <span className="text-[9px] px-1 bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold rounded">LOTO</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Suggested Tools & Parts</span>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.suggestedTools.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">🔧 {t}</span>
                    ))}
                    {aiResult.suggestedParts.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[10px]">📦 {p.partName}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-amber-700 dark:text-amber-400 block uppercase font-bold text-[10px] tracking-wider mb-1">Safety Considerations</span>
                  <div className="space-y-0.5 text-amber-800 dark:text-amber-300 text-[11px]">
                    {aiResult.safetyConsiderations.map((s, idx) => (
                      <div key={idx}>⚠ {s}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAiResult(null)}>
                  Edit Inputs
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateServiceJob}>
                  Approve & Create Service Job →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
