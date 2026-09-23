import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { currentUser, currentOrganization } from '../data/mockData';
import { useTheme } from '../lib/theme';
import { useRouter } from '../lib/router';

export function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const { navigate } = useRouter();

  const [formData, setFormData] = useState({
    firstName: currentUser.fullName.split(' ')[0] || 'Marcus',
    lastName: currentUser.fullName.split(' ')[1] || 'Smith',
    email: currentUser.email || 'marcus.smith@apexglobal.com',
    phone: '+1 (355) 123-4567',
    role: currentUser.role || 'Service Manager',
    organization: currentOrganization.name
  });

  const [toastMessage, setToastMessage] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setToastMessage('Profile details saved successfully.');
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            User Profile
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile details and organization credentials.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
          Account Settings →
        </Button>
      </div>

      {/* Main Grid matching Image 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Summary */}
        <Card className="flex flex-col items-center text-center p-6 space-y-4">
          <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="xl" />
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {formData.role}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="emerald">Active</Badge>
            <Badge variant="blue">{formData.organization}</Badge>
          </div>
          <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-4 text-left space-y-2.5 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.phone}</span>
            </div>
          </div>
        </Card>

        {/* Right Form Card */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
                <Input
                  label="Role"
                  value={formData.role}
                  disabled
                />
                <Input
                  label="Organization"
                  value={formData.organization}
                  disabled
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Edit Profile / Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
