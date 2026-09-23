import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');

  const tabs = [
    { id: 'organization', label: 'Organization & Tenant' },
    { id: 'roles', label: 'Roles & RBAC Matrix' },
    { id: 'ai', label: 'Amazon Bedrock AI Settings' },
    { id: 'security', label: 'Security & Compliance' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-2 border-b border-slate-800/80">
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-400 mt-1">Manage tenant organization, RBAC security roles, and Amazon Bedrock model settings.</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'organization' && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Tenant Organization Configuration</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input label="Organization Name" defaultValue="Apex Global Manufacturing" />
            <Input label="Tenant ID" defaultValue="org-8841-alpha" disabled />
            <Input label="Primary Admin Email" defaultValue="admin@apexmfg.com" />
            <Select 
              label="Subscription Tier" 
              options={[{ label: 'Enterprise SaaS Tier', value: 'ENTERPRISE' }]}
            />
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="primary">Save Changes</Button>
          </div>
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Role-Based Access Control (RBAC) Permissions</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-100">ADMIN</span>
                <p className="text-[11px] text-slate-400">Full administrative control, user provisioning, and AWS key configs</p>
              </div>
              <Badge variant="cyan">Full Access</Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-100">SERVICE_MANAGER</span>
                <p className="text-[11px] text-slate-400">Reviews AI extractions, approves service jobs, and signs reports</p>
              </div>
              <Badge variant="emerald">Manager Access</Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-100">DISPATCHER</span>
                <p className="text-[11px] text-slate-400">Schedules technicians, matches skill profiles, and tracks SLA deadlines</p>
              </div>
              <Badge variant="amber">Dispatch Access</Badge>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-100">TECHNICIAN</span>
                <p className="text-[11px] text-slate-400">Executes LOTO safety, marks interactive checklists, and logs notes</p>
              </div>
              <Badge variant="neutral">Mobile Field Workspace</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'ai' && (
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Amazon Bedrock AI Configuration</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Select 
              label="Primary Foundation Model"
              options={[
                { label: 'Anthropic Claude 3.5 Sonnet (v2)', value: 'anthropic.claude-3-5-sonnet-20241022-v2:0' },
                { label: 'Anthropic Claude 3 Haiku (v1)', value: 'anthropic.claude-3-haiku-20240307-v1:0' }
              ]}
            />
            <Input label="Prompt Specification Version" defaultValue="v1.2 (Strict Decision Support)" disabled />
            <Input label="Temperature" defaultValue="0.10 (Deterministic Structured JSON)" />
            <Input label="Max Tokens" defaultValue="2000" />
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
            ✨ Amazon Bedrock Guardrails active: PII Masking, LOTO Safety Filter, and Zero Diagnostic Claim Enforcement enabled.
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="space-y-4 text-xs">
          <CardHeader>
            <CardTitle>Security & Compliance Governance</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between">
              <span>Authentication Engine</span>
              <span className="font-mono text-cyan-400">Amazon Cognito User Pool</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between">
              <span>Data Encryption (At Rest)</span>
              <span className="font-mono text-emerald-400">AWS KMS (AES-256)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between">
              <span>Presigned S3 File Expiration</span>
              <span className="font-mono text-amber-400">900 Seconds (15 Minutes)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
