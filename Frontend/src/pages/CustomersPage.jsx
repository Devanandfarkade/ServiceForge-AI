import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { customerService } from '../services/customerService';
import { useRouter } from '../lib/router';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function CustomersPage() {
  const { navigate } = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      const data = await customerService.getCustomers();
      setCustomers(data);
      setLoading(false);
    }
    loadCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Customer Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise B2B client accounts, SLA tiers, and equipment assets.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading customer accounts..." />
      ) : (
        <Table headers={['Company Name', 'Industry', 'Primary Contact', 'SLA Tier', 'Assets', 'Active Jobs', 'Status']}>
          {customers.map((c) => (
            <TableRow key={c.customerId}>
              <TableCell className="font-bold text-slate-100">{c.companyName}</TableCell>
              <TableCell className="text-slate-400">{c.industry}</TableCell>
              <TableCell className="text-slate-300">
                <div>{c.contactName}</div>
                <div className="text-[11px] text-slate-500">{c.contactEmail}</div>
              </TableCell>
              <TableCell><Badge variant="cyan">{c.slaTier}</Badge></TableCell>
              <TableCell className="font-mono text-slate-300">{c.totalAssetsCount} units</TableCell>
              <TableCell className="font-mono font-bold text-cyan-400">{c.activeJobsCount} jobs</TableCell>
              <TableCell><Badge variant="emerald">{c.status}</Badge></TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
