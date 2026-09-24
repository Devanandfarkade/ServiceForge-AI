import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Badge, PriorityBadge } from '../components/ui/Badge';
import { Stepper } from '../components/ui/Stepper';
import { InputModeToggle } from '../components/requests/InputModeToggle';
import { VoiceRecorder } from '../components/requests/VoiceRecorder';
import { EvidenceUploader } from '../components/requests/EvidenceUploader';
import { customerService } from '../services/customerService';
import { assetService } from '../services/assetService';
import { serviceRequestService } from '../services/serviceRequestService';
import { serviceJobService } from '../services/serviceJobService';
import { attachmentService } from '../services/attachmentService';
import { useRouter } from '../lib/router';

export function CreateServiceRequestPage() {
  const { navigate } = useRouter();

  // Form options state
  const [customers, setCustomers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [priority, setPriority] = useState('HIGH');

  // Input Mode & Description state
  const [inputMode, setInputMode] = useState('type'); // 'type' | 'voice'
  const [description, setDescription] = useState(
    'Our industrial compressor starts normally but after around ten minutes it becomes very noisy and then shuts down.'
  );
  const [descriptionSource, setDescriptionSource] = useState('typed'); // 'typed' | 'voice' | 'edited_voice'

  // Attachments & Validation state
  const [attachments, setAttachments] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Workflow submission & AI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStepText, setProcessingStepText] = useState('Preparing your service request...');
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

  // Handle direct typing change
  const handleTypedDescriptionChange = (e) => {
    setDescription(e.target.value);
    setDescriptionSource('typed');
    if (validationError) setValidationError('');
  };

  // Handle accepted voice transcription
  const handleVoiceTranscribed = (transcriptText) => {
    setDescription(transcriptText);
    setDescriptionSource('voice');
    if (validationError) setValidationError('');
  };

  // Handle edited voice transcript
  const handleVoiceEdited = (editedText) => {
    setDescription(editedText);
    setDescriptionSource('edited_voice');
    if (validationError) setValidationError('');
  };

  // Handle review & submission to AI Analysis
  const handleAnalyzeWithAI = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!description.trim()) {
      setValidationError('Please describe the problem before continuing.');
      return;
    }

    const invalidAttachments = attachments.filter(a => a.status === 'error');
    if (invalidAttachments.length > 0) {
      setValidationError('Please remove or fix invalid attachments before continuing to AI Analysis.');
      return;
    }

    setIsAnalyzing(true);

    const cust = customers.find(c => c.customerId === selectedCustomerId);
    const ast = assets.find(a => a.assetId === selectedAssetId);

    const attachmentsMetadata = attachments.map(att => ({
      id: att.id,
      fileName: att.fileName,
      contentType: att.contentType,
      size: att.size,
      type: att.type
    }));

    const newReq = await serviceRequestService.createRequest({
      customerId: selectedCustomerId,
      customerName: cust ? cust.companyName : 'Industrial Plastics Corp',
      assetId: selectedAssetId,
      assetName: ast ? ast.name : 'Industrial Air Compressor AC-4500',
      rawDescription: description,
      descriptionSource,
      priority,
      attachments: attachmentsMetadata
    });

    setCreatedRequest(newReq);

    // Processing step message transitions
    setProcessingStepText('Preparing your service request...');
    setTimeout(() => setProcessingStepText('Reviewing the problem description and evidence...'), 400);
    setTimeout(() => setProcessingStepText('Assessing equipment telemetry and fault history...'), 800);
    setTimeout(() => setProcessingStepText('Evaluating required technician skill profiles & tools...'), 1200);

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
    { title: 'Multimodal Intake', subtitle: 'Type, Voice & Evidence' },
    { title: 'AI Decision Support', subtitle: 'Safety & dispatch steps' }
  ];

  const getSourceBadgeVariant = (src) => {
    switch (src) {
      case 'voice':
        return 'emerald';
      case 'edited_voice':
        return 'amber';
      case 'typed':
      default:
        return 'cyan';
    }
  };

  const getSourceLabel = (src) => {
    switch (src) {
      case 'voice':
        return '🎙 Voice Transcription';
      case 'edited_voice':
        return '🎙 Voice → Edited';
      case 'typed':
      default:
        return '⌨ Typed Description';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Create Service Request
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Submit customer reported issues with multimodal description (voice/typed) and evidence attachments.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
          ← Back to Requests
        </Button>
      </div>

      {/* Visual Stepper */}
      <Stepper
        steps={formSteps}
        currentStep={aiResult ? 2 : 1}
        onStepClick={(step) => {
          if (step === 1 && aiResult) setAiResult(null);
        }}
      />

      {/* STEP 1: Multimodal Intake Form */}
      {!aiResult && !isAnalyzing && (
        <form onSubmit={handleAnalyzeWithAI} className="space-y-5">
          {/* Account & Asset Selection */}
          <Card className="p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              1. Customer & Equipment Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select
                label="Customer Account"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={customers.map((c) => ({
                  label: `${c.companyName} (${c.slaTier})`,
                  value: c.customerId
                }))}
              />

              <Select
                label="Target Equipment / Asset"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                options={assets.map((a) => ({
                  label: `${a.name} (SN: ${a.serialNumber})`,
                  value: a.assetId
                }))}
              />
            </div>

            <div className="mt-3">
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
            </div>
          </Card>

          {/* Section A: Problem Description */}
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  2. Problem Description
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose your preferred intake method: Type text or Speak using your microphone.
                </p>
              </div>
              <InputModeToggle mode={inputMode} onModeChange={setInputMode} />
            </div>

            {inputMode === 'type' ? (
              <div className="space-y-2">
                <label
                  htmlFor="typed-problem-description"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Issue Description
                </label>
                <textarea
                  id="typed-problem-description"
                  rows={5}
                  value={description}
                  onChange={handleTypedDescriptionChange}
                  placeholder="Describe what is happening with the equipment..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors leading-relaxed"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Describe symptoms, noise patterns, temperatures, error codes, or thermal shutoffs.</span>
                  <span className="font-mono">{description.length} characters</span>
                </div>
              </div>
            ) : (
              <VoiceRecorder
                onTranscribed={handleVoiceTranscribed}
                onEdited={handleVoiceEdited}
                initialTranscript={descriptionSource !== 'typed' ? description : ''}
              />
            )}
          </Card>

          {/* Section B: Evidence / Attachments */}
          <EvidenceUploader attachments={attachments} onAttachmentsChange={setAttachments} />

          {/* Section C: Review & Continue */}
          <Card className="p-5 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              3. Review Before AI Analysis
            </div>

            <div className="space-y-3">
              {/* Description Review Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Final Problem Description
                  </span>
                  <Badge variant={getSourceBadgeVariant(descriptionSource)}>
                    {getSourceLabel(descriptionSource)}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed font-sans min-h-[50px]">
                  {description.trim() ? (
                    `"${description.trim()}"`
                  ) : (
                    <span className="text-slate-400 not-italic">No problem description provided yet.</span>
                  )}
                </div>
              </div>

              {/* Attachments Summary */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Attached Evidence ({attachments.length})
                </span>
                {attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <span
                        key={att.id}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-xs"
                      >
                        <span>{att.type === 'image' ? '📷' : '📄'}</span>
                        <span className="font-medium truncate max-w-[160px]">{att.fileName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({attachmentService.formatFileSize(att.size)})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    No attachments uploaded. You can add photos or supporting files above.
                  </div>
                )}
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2" role="alert">
                <span className="font-bold">⚠</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/requests')}>
                ← Back to List
              </Button>
              <Button type="submit" variant="primary" size="md">
                Continue to AI Analysis →
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Processing Loading State */}
      {isAnalyzing && (
        <Card className="p-12 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Multimodal AI Decision Support Engine
            </h3>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-mono animate-pulse">
              {processingStepText}
            </p>
          </div>
        </Card>
      )}

      {/* STEP 2 — AI Job Preparation & Decision Support Result */}
      {aiResult && !isAnalyzing && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">⚡</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                AI Analysis & Decision Support Ready
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mock AI outputs synthesized from description & attached evidence.
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 px-3 py-0.5 rounded-full font-bold self-start sm:self-auto">
              Confidence: High · {(aiResult.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>

          {/* Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Submitted Customer Request & Evidence */}
            <Card className="space-y-4 p-5">
              <CardHeader>
                <CardTitle>Submitted Service Request Intake</CardTitle>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {createdRequest?.ticketNumber}
                </span>
              </CardHeader>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Customer Account
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {createdRequest?.customerName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Target Equipment
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {createdRequest?.assetName}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Problem Description
                    </span>
                    <Badge variant={getSourceBadgeVariant(createdRequest?.descriptionSource)}>
                      {getSourceLabel(createdRequest?.descriptionSource)}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    "{createdRequest?.rawDescription}"
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1.5">
                      Attached Evidence Files ({attachments.length})
                    </span>
                    <div className="space-y-1.5">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span>{att.type === 'image' ? '📷' : '📄'}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                              {att.fileName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {attachmentService.formatFileSize(att.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Reported Priority
                  </span>
                  <PriorityBadge priority={createdRequest?.priority} />
                </div>
              </div>
            </Card>

            {/* RIGHT: AI Preparation Results */}
            <Card className="space-y-4 p-5 border-cyan-200 dark:border-cyan-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">⚡</span>
                  <CardTitle>AI Job Preparation</CardTitle>
                </div>
                <Badge variant="cyan">Recommended Priority: {aiResult.recommendedPriority}</Badge>
              </CardHeader>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider">
                    Required Technician Expertise
                  </span>
                  <div className="mt-1 text-slate-900 dark:text-slate-100 font-semibold text-sm">
                    {aiResult.recommendedSkillProfile}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">
                    Suggested Inspection Steps
                  </span>
                  <div className="space-y-1.5">
                    {aiResult.suggestedInspectionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2"
                      >
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                          {step.stepNumber}.
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 flex-1 leading-snug">
                          {step.instruction}
                        </span>
                        {step.critical && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold rounded uppercase tracking-wider border border-rose-500/20">
                            LOTO
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-1">
                    Recommended Tools & Parts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.suggestedTools.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]"
                      >
                        🔧 {t}
                      </span>
                    ))}
                    {aiResult.suggestedParts.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[11px]"
                      >
                        📦 {p.partName}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-amber-700 dark:text-amber-400 block uppercase font-bold text-[10px] tracking-wider mb-1">
                    Safety Considerations
                  </span>
                  <div className="space-y-1 text-amber-800 dark:text-amber-300 text-[11px] bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                    {aiResult.safetyConsiderations.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span>⚠</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAiResult(null)}>
                  ← Edit Request Inputs
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateServiceJob}>
                  Approve & Dispatch Job →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

