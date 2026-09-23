import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge, PriorityBadge } from '../components/ui/Badge';
import { customerService } from '../services/customerService';
import { assetService } from '../services/assetService';
import { serviceRequestService } from '../services/serviceRequestService';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';

export function CreateServiceRequestPage() {
  const { navigate } = useRouter();
  const [customers, setCustomers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [description, setDescription] = useState(
    'Our industrial compressor starts normally but becomes very noisy and shuts down after about ten minutes.'
  );
  const [priority, setPriority] = useState('HIGH');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
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

  const handleAnalyzeWithAI = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);

    // Create the request in mock store
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

    // Step animation delays
    setTimeout(() => setAnalysisStep(2), 500);
    setTimeout(() => setAnalysisStep(3), 1000);

    setTimeout(async () => {
      const result = await serviceRequestService.analyzeRequest(newReq.requestId);
      setAiResult(result);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleCreateServiceJob = async () => {
    if (!createdRequest || !aiResult) return;
    const newJob = await serviceJobService.createJobFromRequest(createdRequest, aiResult);
    navigate(`/jobs/${newJob.jobId}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Create Service Request</h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit raw customer issue details and trigger Amazon Bedrock AI decision support preparation.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/requests')}>
          ← Back to Requests
        </Button>
      </div>

      {!aiResult && !isAnalyzing && (
        <Card className="p-6">
          <form onSubmit={handleAnalyzeWithAI} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: 'High Priority (4h SLA)', value: 'HIGH' },
                { label: 'Critical Outage (2h SLA)', value: 'CRITICAL' },
                { label: 'Medium Priority (8h SLA)', value: 'MEDIUM' },
                { label: 'Low Priority (24h SLA)', value: 'LOW' }
              ]}
            />

            <Textarea
              label="Raw Customer Issue Description"
              rows={5}
              placeholder="Describe symptoms, noise, thermal shutoff times, error codes, or customer verbal feedback..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📎</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Attachments (Optional)</div>
                  <div className="text-[11px] text-slate-400">Audio logs, site photos, digital panel screenshots</div>
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm">
                + Upload Files
              </Button>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate('/requests')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="lg">
                ✨ Analyze with AI
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Analyzing Loading Animation */}
      {isAnalyzing && (
        <Card className="p-12 text-center space-y-6">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-100">Amazon Bedrock AI Processing</h3>
            <p className="text-xs text-slate-400 font-mono">
              {analysisStep === 1 && "Parsing customer issue symptoms & equipment baseline..."}
              {analysisStep === 2 && "Searching part manuals, required tools & safety LOTO rules..."}
              {analysisStep === 3 && "Building step-by-step inspection checklist & confidence score..."}
            </p>
          </div>
        </Card>
      )}

      {/* AI Analysis Job Preparation View */}
      {aiResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* AI Disclaimer Warning Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <span className="text-amber-400 text-lg">⚠️</span>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">AI-Generated Decision Support</div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                AI suggestions should be reviewed by qualified personnel before service execution. This output does not constitute a confirmed technical diagnosis.
              </p>
            </div>
          </div>

          {/* Side-by-Side Review Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Customer Reported Details */}
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle>Customer Reported Information</CardTitle>
                <span className="text-xs font-mono text-cyan-400">{createdRequest?.ticketNumber}</span>
              </CardHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Customer Account:</span>
                  <span className="text-slate-100 font-semibold">{createdRequest?.customerName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Target Asset:</span>
                  <span className="text-slate-100 font-semibold">{createdRequest?.assetName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Raw Issue Text:</span>
                  <div className="mt-1 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 italic leading-relaxed">
                    "{createdRequest?.rawDescription}"
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Initial Priority:</span>
                  <div className="mt-1"><PriorityBadge priority={createdRequest?.priority} /></div>
                </div>
              </div>
            </Card>

            {/* Right Column: AI-Generated Decision Support */}
            <Card className="space-y-5 border-cyan-500/30 shadow-cyan-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">✨</span>
                  <CardTitle>AI Job Preparation</CardTitle>
                </div>
                <Badge variant="cyan">Confidence: {(aiResult.confidenceScore * 100).toFixed(0)}%</Badge>
              </CardHeader>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider">Issue Summary</span>
                  <p className="text-slate-200 font-medium leading-relaxed mt-0.5">{aiResult.summary}</p>
                </div>

                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider">Required Expertise</span>
                  <span className="inline-block mt-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-medium border border-slate-700">
                    {aiResult.recommendedSkillProfile}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-1.5">Suggested Inspection Steps</span>
                  <div className="space-y-1.5">
                    {aiResult.suggestedInspectionSteps.map((step, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                        <span className="text-cyan-400 font-bold font-mono">{step.stepNumber}.</span>
                        <span className="text-slate-300 flex-1">{step.instruction}</span>
                        {step.critical && <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">LOTO</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-1">Suggested Tools & Parts</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.suggestedTools.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">🔧 {t}</span>
                    ))}
                    {aiResult.suggestedParts.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px]">📦 {p.partName}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-amber-400 block uppercase font-semibold text-[10px] tracking-wider mb-1">Safety Considerations</span>
                  <div className="space-y-1">
                    {aiResult.safetyConsiderations.map((s, idx) => (
                      <div key={idx} className="text-amber-300/90 text-[11px] flex items-center gap-1.5">
                        <span>⚠</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setAiResult(null)}>
                  Edit Inputs
                </Button>
                <Button variant="primary" onClick={handleCreateServiceJob}>
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
