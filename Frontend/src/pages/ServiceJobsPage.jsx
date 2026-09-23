import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { serviceJobService } from '../services/serviceJobService';
import { useRouter } from '../lib/router';
import { LoadingSpinner, EmptyState } from '../components/ui/LoadingSpinner';

export function ServiceJobsPage() {
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const data = await serviceJobService.getJobs({
          status: statusFilter,
          priority: priorityFilter
        });
        setJobs(data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Service Jobs Dispatch Board</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage active work orders, SLA deadlines, and technician field dispatches.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Job Statuses', value: '' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Completed', value: 'COMPLETED' }
            ]}
          />
          <Select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { label: 'All Priorities', value: '' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High Priority', value: 'HIGH' },
              { label: 'Medium Priority', value: 'MEDIUM' }
            ]}
          />
        </div>
      </Card>

      {/* Jobs Table */}
      {loading ? (
        <LoadingSpinner label="Loading service jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState title="No Service Jobs Found" description="There are no jobs matching your filter criteria." />
      ) : (
        <Table headers={['Job ID', 'Work Order Title', 'Customer', 'Assigned Tech', 'Priority', 'Status', 'SLA Target', 'Actions']}>
          {jobs.map((job) => (
            <TableRow key={job.jobId} onClick={() => navigate(`/jobs/${job.jobId}`)}>
              <TableCell className="font-mono font-bold text-cyan-400">{job.jobIdNumber}</TableCell>
              <TableCell className="font-semibold text-slate-200">{job.title}</TableCell>
              <TableCell className="text-slate-300">{job.customerName}</TableCell>
              <TableCell className="text-slate-200 font-medium">{job.assignedTechnicianName}</TableCell>
              <TableCell><PriorityBadge priority={job.priority} /></TableCell>
              <TableCell><StatusBadge status={job.status} /></TableCell>
              <TableCell className="text-xs font-mono text-slate-400">
                {new Date(job.targetSlaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/jobs/${job.jobId}`);
                  }}
                >
                  Manage Job
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
