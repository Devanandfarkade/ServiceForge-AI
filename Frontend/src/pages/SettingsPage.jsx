import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../lib/theme';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');
  const [accentColor, setAccentColor] = useState('blue');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const settingsNav = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'ai', label: 'AI Configuration', icon: '🤖' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' }
  ];

  const colorAccents = [
    { id: 'blue', color: 'bg-blue-600' },
    { id: 'teal', color: 'bg-teal-500' },
    { id: 'emerald', color: 'bg-emerald-500' },
    { id: 'amber', color: 'bg-amber-500' },
    { id: 'purple', color: 'bg-purple-600' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setToastMessage('Settings preferences saved successfully.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Settings
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Preferences & platform configuration parameters.
        </p>
      </div>

      {/* Enterprise Left-Nav / Right-Content Layout matching Image 1 & 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Settings Navigation */}
        <Card className="p-2.5 md:col-span-1 space-y-1 h-fit">
          {settingsNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 font-extrabold border border-blue-100 dark:border-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </Card>

        {/* Right Settings Content */}
        <div className="md:col-span-3 space-y-4">
          {activeSection === 'appearance' && (
            <Card className="space-y-5 p-6">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <form onSubmit={handleSave} className="space-y-5">
                {/* Visual Theme Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Theme
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                      }`}
                    >
                      <span>☀</span> Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                      }`}
                    >
                      <span>🌙</span> Dark
                    </button>
                  </div>
                </div>

                {/* Color Accent Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-3">
                    {colorAccents.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccentColor(acc.id)}
                        className={`w-6 h-6 rounded-full ${acc.color} transition-all cursor-pointer ${
                          accentColor === acc.id ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Language & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Language"
                    defaultValue="en"
                    options={[
                      { value: 'en', label: 'English (US)' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'de', label: 'German' }
                    ]}
                  />
                  <Select
                    label="Time Zone"
                    defaultValue="EST"
                    options={[
                      { value: 'EST', label: '(UTC-05:00) Eastern Time (US & Canada)' },
                      { value: 'CST', label: '(UTC-06:00) Central Time (US & Canada)' },
                      { value: 'PST', label: '(UTC-08:00) Pacific Time (US & Canada)' }
                    ]}
                  />
                </div>

                {/* Switches */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-refresh data</span>
                    <input 
                      type="checkbox" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)} 
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Compact mode</span>
                    <input 
                      type="checkbox" 
                      checked={compactMode} 
                      onChange={(e) => setCompactMode(e.target.checked)} 
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="md">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'general' && (
            <Card className="space-y-4 p-6">
              <CardHeader><CardTitle>General Tenant Configuration</CardTitle></CardHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <Input label="Organization Name" defaultValue="Apex Global Manufacturing" />
                  <Input label="Tenant Key" defaultValue="org-8841-alpha" disabled />
                  <Input label="Primary Admin Email" defaultValue="admin@apexglobal.com" />
                  <Select 
                    label="Subscription Tier" 
                    options={[{ label: 'Enterprise SaaS Tier', value: 'ENTERPRISE' }]}
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'ai' && (
            <Card className="space-y-4 p-6">
              <CardHeader><CardTitle>Amazon Bedrock AI Configuration</CardTitle></CardHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <Select 
                    label="Primary Foundation Model"
                    options={[
                      { label: 'Anthropic Claude 3.5 Sonnet (v2)', value: 'anthropic.claude-3-5-sonnet' },
                      { label: 'Anthropic Claude 3 Haiku (v1)', value: 'anthropic.claude-3-haiku' }
                    ]}
                  />
                  <Input label="Prompt Specification Version" defaultValue="v1.2 (Strict Decision Support)" disabled />
                  <Input label="Temperature" defaultValue="0.10" />
                  <Input label="Max Tokens" defaultValue="2000" />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="space-y-4 p-6 text-xs">
              <CardHeader><CardTitle>Notifications & Alerts</CardTitle></CardHeader>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Notify dispatcher when SLA deadline is under 2 hours</span>
                </label>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="space-y-4 p-6 text-xs">
              <CardHeader><CardTitle>Security & Compliance Governance</CardTitle></CardHeader>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span>Authentication Engine</span>
                  <span className="font-mono text-blue-600">Amazon Cognito User Pool</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
