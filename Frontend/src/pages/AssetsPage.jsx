import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { assetService } from '../services/assetService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      const data = await assetService.getAssets();
      setAssets(data);
      setLoading(false);
    }
    loadAssets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Equipment & Asset Registry</h1>
          <p className="text-xs text-slate-400 mt-1">Industrial equipment database, serial numbers, and maintenance logs.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading equipment assets..." />
      ) : (
        <Table headers={['Equipment Name', 'Category', 'Customer', 'Serial Number', 'Location', 'Status', 'Open Jobs']}>
          {assets.map((ast) => (
            <TableRow key={ast.assetId}>
              <TableCell className="font-bold text-slate-100">{ast.name}</TableCell>
              <TableCell><Badge variant="cyan">{ast.category}</Badge></TableCell>
              <TableCell className="text-slate-300">{ast.customerName}</TableCell>
              <TableCell className="font-mono text-xs text-slate-400">{ast.serialNumber}</TableCell>
              <TableCell className="text-xs text-slate-400">{ast.location}</TableCell>
              <TableCell>
                <Badge variant={ast.status === 'OPERATIONAL' ? 'emerald' : ast.status === 'DEGRADED' ? 'amber' : 'rose'}>
                  {ast.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono font-bold text-cyan-400">{ast.openJobsCount}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
