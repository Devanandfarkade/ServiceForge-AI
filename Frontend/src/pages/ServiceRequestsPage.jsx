import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { serviceRequestService } from '../services/serviceRequestService';
import { useRouter } from '../lib/router';
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner';

export function ServiceRequestsPage() {
  const { navigate } = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const data = await serviceRequestService.getRequests({
          search,
          status: statusFilter,
          priority: priorityFilter
        });
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Service Requests</h1>
          <p className="text-xs text-slate-400 mt-1">
            Intake queue for customer reported service requests and AI decision support extractions.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/requests/new')}>
          + New Service Request
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input 
            placeholder="Search by Ticket #, Customer, Asset, or Keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'New', value: 'New' },
              { label: 'AI Ready', value: 'AI Ready' },
              { label: 'In Progress', value: 'In Progress' }
            ]}
          />
          <Select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { label: 'All Priorities', value: '' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High Priority', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' }
            ]}
          />
        </div>
      </Card>

      {/* Table Listing */}
      {loading ? (
        <LoadingSpinner label="Loading service intake queue..." />
      ) : requests.length === 0 ? (
        <EmptyState 
          title="No Service Requests Found" 
          description="There are no requests matching your filter criteria."
          action={<Button variant="primary" onClick={() => navigate('/requests/new')}>Create First Request</Button>}
        />
      ) : (
        <Table headers={['Ticket #', 'Customer', 'Target Asset', 'Reported Issue', 'Priority', 'Status', 'AI Prep', 'Actions']}>
          {requests.map((req) => (
            <TableRow key={req.requestId} onClick={() => navigate(`/requests/${req.requestId}`)}>
              <TableCell className="font-mono font-bold text-cyan-400">{req.ticketNumber}</TableCell>
              <TableCell className="font-semibold text-slate-200">{req.customerName}</TableCell>
              <TableCell className="text-slate-300">{req.assetName}</TableCell>
              <TableCell className="max-w-xs truncate text-slate-400">{req.rawDescription}</TableCell>
              <TableCell><PriorityBadge priority={req.priority} /></TableCell>
              <TableCell><StatusBadge status={req.status} /></TableCell>
              <TableCell>
                {req.hasAiAnalysis ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    ✨ Bedrock Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Pending AI</span>
                )}
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
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
