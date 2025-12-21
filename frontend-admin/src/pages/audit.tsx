// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 4.Entities → 5.Pages → 8.DesignSystem
// Decisão: Página de auditoria para compliance (conforme US-012, TASK-015)

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Modal from '@/components/ui/modal';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    tenantId: '',
    userId: '',
    action: '',
    resource: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queries = [];
      if (filters.tenantId) queries.push(Query.equal('tenantId', filters.tenantId));
      if (filters.userId) queries.push(Query.equal('userId', filters.userId));
      if (filters.action) queries.push(Query.equal('action', filters.action));
      if (filters.resource) queries.push(Query.equal('resource', filters.resource));
      if (filters.startDate) queries.push(Query.greaterThanEqual('timestamp', filters.startDate.toISOString()));
      if (filters.endDate) queries.push(Query.lessThanEqual('timestamp', filters.endDate.toISOString()));

      const result = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        queries
      );
      setLogs(result.documents as unknown as AuditLog[]);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    // Implementar exportação CSV/JSON
    const csv = logs.map(log => `${log.timestamp},${log.action},${log.resource},${log.ipAddress}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auditoria de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Tenant ID"
              value={filters.tenantId}
              onChange={(e) => setFilters({ ...filters, tenantId: e.target.value })}
            />
            <Input
              placeholder="User ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
            <Select
              value={filters.action || "all"}
              onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="consulta_executada">Consulta Executada</SelectItem>
                <SelectItem value="plugin_enabled">Plugin Habilitado</SelectItem>
                {/* Adicionar mais ações conforme necessário */}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value ? new Date(e.target.value) : null })}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value ? new Date(e.target.value) : null })}
              placeholder="Data final"
            />
            <Button onClick={handleExport}>Exportar</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.tenantId}</TableCell>
                  <TableCell>{log.userId || '-'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <Button onClick={() => setSelectedLog(log)}>Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedLog && (
        <Modal isOpen={true} onClose={() => setSelectedLog(null)}>
          <h3>Detalhes do Log</h3>
          <pre>{JSON.stringify(JSON.parse(selectedLog.details), null, 2)}</pre>
        </Modal>
      )}
    </div>
  );
}