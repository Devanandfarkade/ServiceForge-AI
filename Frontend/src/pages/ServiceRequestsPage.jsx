import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { StatusBadge, PriorityBadge, AIStatusBadge } from '../components/ui/Badge';
import { serviceRequestService } from '../services/serviceRequestService';
import { useRouter } from '../lib/router';
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner';

export function ServiceRequestsPage() {
  const { navigate } = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const data = await serviceRequestService.getRequests();
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const matchesTab = (req, tab) => {
    const status = (req.status || '').toLowerCase();
    if (tab === 'All') return true;
    if (tab === 'Open') return status === 'new' || status === 'open' || status === 'under review';
    if (tab === 'In Progress') return status === 'in progress' || status === 'ai ready' || status === 'assigned' || status === 'in_progress';
    if (tab === 'Pending') return status === 'pending' || status === 'pending review' || status === 'needs review' || status === 'needs info';
    if (tab === 'Completed') return status === 'completed' || status === 'closed' || status === 'converted to job';
    return true;
  };

  const filterTabs = [
    { label: 'All', count: requests.length },
    { label: 'Open', count: requests.filter(r => matchesTab(r, 'Open')).length },
    { label: 'In Progress', count: requests.filter(r => matchesTab(r, 'In Progress')).length },
    { label: 'Pending', count: requests.filter(r => matchesTab(r, 'Pending')).length },
    { label: 'Completed', count: requests.filter(r => matchesTab(r, 'Completed')).length }
  ];

  const filteredRequests = requests.filter(req => {
    const categoryMatch = matchesTab(req, activeTab);
    if (!categoryMatch) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (req.ticketNumber || '').toLowerCase().includes(q) ||
      (req.customerName || '').toLowerCase().includes(q) ||
      (req.assetName || '').toLowerCase().includes(q) ||
      (req.rawDescription || '').toLowerCase().includes(q) ||
      (req.assignedTechnicianName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Service Requests</h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Review incoming customer requests and AI job preparation recommendations.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/requests/new')}>
          + New Request
        </Button>
      </div>

      {/* Filter Tabs matching Image 2 */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {filterTabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(tab.label)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.label
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
            }`}
          >
            {tab.label} <span className="text-[10px] opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Search toolbar */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input 
              placeholder="Search by ID, customer, equipment, or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm">
            ⚙ Filter
          </Button>
        </div>
      </Card>

      {/* High Contrast Table matching Image 2 */}
      {loading ? (
        <LoadingSpinner label="Loading service requests..." />
      ) : filteredRequests.length === 0 ? (
        <EmptyState 
          title={`No service requests found for "${activeTab}"`} 
          description={search ? `No requests matching "${search}" in ${activeTab}.` : `There are no service requests currently in ${activeTab} status.`}
          action={<Button variant="primary" size="sm" onClick={() => navigate('/requests/new')}>Create Service Request</Button>}
        />
      ) : (
        <Table headers={['ID', 'Customer & Equipment', 'Priority', 'AI Status', 'Status', 'Requested By', 'Date', 'Action']}>
          {filteredRequests.map((req) => (
            <TableRow key={req.requestId} onClick={() => navigate(`/requests/${req.requestId}`)}>
              <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">{req.ticketNumber}</TableCell>
              <TableCell>
                <div className="font-bold text-slate-900 dark:text-slate-100">{req.customerName}</div>
                <div className="text-[11px] text-slate-500 font-medium">{req.assetName}</div>
              </TableCell>
              <TableCell><PriorityBadge priority={req.priority} /></TableCell>
              <TableCell>
                <AIStatusBadge status={req.hasAiAnalysis ? 'Approved' : 'Not analyzed'} />
              </TableCell>
              <TableCell><StatusBadge status={req.status} /></TableCell>
              <TableCell className="font-medium text-slate-700 dark:text-slate-300">John Carter</TableCell>
              <TableCell className="text-[11px] text-slate-500 font-mono">
                {new Date(req.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/requests/${req.requestId}`);
                  }}
                >
                  Review →
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
