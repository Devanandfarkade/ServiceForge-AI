import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../lib/AuthContext';
import { apiClient } from '../lib/apiClient';
import { useRouter } from '../lib/router';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const { navigate } = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: authUser?.fullName || authUser?.name || 'Service User',
    email: authUser?.email || '',
    phone: '',
    role: authUser?.role?.replace(/_/g, ' ') || 'SERVICE MANAGER',
    organization: authUser?.orgId || 'ServiceForge AI Tenant',
    avatarUrl: '',
    department: 'Operations'
  });

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await apiClient.get('/user/profile');
        if (isMounted && res) {
          const profile = res;
          setFormData({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || authUser?.name || 'Service User',
            email: profile.email || authUser?.email || '',
            phone: profile.phone || '',
            role: (profile.role || authUser?.role || 'SERVICE_MANAGER').replace(/_/g, ' '),
            organization: profile.organizationId || authUser?.orgId || 'ServiceForge AI Tenant',
            avatarUrl: profile.avatarUrl || '',
            department: profile.department || 'Operations'
          });
        }
      } catch (err) {
        console.warn("Could not fetch live profile; using authenticated context credentials:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [authUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      department: formData.department
    };

    try {
      const res = await apiClient.patch('/user/profile', payload);
      if (res.data) {
        const updated = res.data;
        setFormData(prev => ({
          ...prev,
          firstName: updated.firstName || prev.firstName,
          lastName: updated.lastName || prev.lastName,
          fullName: updated.fullName || `${updated.firstName} ${updated.lastName}`,
          phone: updated.phone || prev.phone,
          department: updated.department || prev.department
        }));
      }
      setToastMessage('Profile details saved successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* API Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs px-4 py-3 rounded-2xl font-semibold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline">Dismiss</button>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Summary */}
        <Card className="flex flex-col items-center text-center p-6 space-y-4">
          <Avatar src={formData.avatarUrl} name={formData.fullName} size="xl" />
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
            <div className="flex justify-between">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formData.department}</span>
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
                  disabled={saving}
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Email (Cognito Identity)"
                  type="email"
                  value={formData.email}
                  disabled
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Role (Cognito Group)"
                  value={formData.role}
                  disabled
                />
                <Input
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
