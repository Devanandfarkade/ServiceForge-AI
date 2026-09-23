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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with High-Contrast Light & Dark Heading */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Equipment & Asset Registry
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Industrial equipment database, serial numbers, and maintenance logs.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading equipment assets..." />
      ) : (
        <Table headers={['Equipment Name', 'Category', 'Customer', 'Serial Number', 'Location', 'Status', 'Open Jobs']}>
          {assets.map((ast) => (
            <TableRow key={ast.assetId}>
              <TableCell className="font-bold text-slate-900 dark:text-slate-100">{ast.name}</TableCell>
              <TableCell><Badge variant="blue">{ast.category}</Badge></TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{ast.customerName}</TableCell>
              <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold">{ast.serialNumber}</TableCell>
              <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium">{ast.location}</TableCell>
              <TableCell>
                <Badge variant={ast.status === 'OPERATIONAL' ? 'emerald' : ast.status === 'DEGRADED' ? 'amber' : 'rose'}>
                  {ast.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">{ast.openJobsCount}</TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
