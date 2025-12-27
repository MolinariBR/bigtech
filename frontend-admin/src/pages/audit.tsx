// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 4.Entities → 5.Pages → 8.DesignSystem
// Decisão: Página de auditoria melhorada para compliance (conforme US-012, TASK-015)

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Shield,
  Search,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  MoreHorizontal,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/api/audit';

interface AuditLog {
  $id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalActions: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
}

// Página de auditoria melhorada (TASK-015)
export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadStats = async () => {
    try {
      const statsData = await api.getAuditStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (userFilter.trim()) filters.userId = userFilter.trim();
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await api.listAuditLogs(page, 20, filters);
      setLogs(response.items || []);
      setTotalPages(Math.ceil((response.total || 0) / 20));
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [userFilter, actionFilter, searchTerm, startDate, endDate, page]);

  useEffect(() => {
    loadStats();
    loadAuditLogs();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [page, userFilter, actionFilter, startDate, endDate, loadAuditLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters: Record<string, string> = {};
      if (userFilter.trim()) filters.userId = userFilter.trim();
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await api.exportAuditLogs(filters);
      toast.success(`Exportação iniciada: ${result.jobId}`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erro ao exportar logs');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const handleSearch = () => {
    setPage(1);
    loadAuditLogs();
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'user_login': 'bg-green-100 text-green-800',
      'user_logout': 'bg-gray-100 text-gray-800',
      'billing_credit': 'bg-blue-100 text-blue-800',
      'billing_debit': 'bg-red-100 text-red-800',
      'plugin_enabled': 'bg-purple-100 text-purple-800',
      'plugin_disabled': 'bg-orange-100 text-orange-800',
      'consulta_executada': 'bg-cyan-100 text-cyan-800',
      'admin_action': 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant="secondary" className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
        {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isCriticalAction = (action: string) => {
    const criticalActions = ['admin_action', 'billing_debit', 'user_deleted'];
    return criticalActions.includes(action);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auditoria de Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Monitoramento e rastreamento de todas as ações do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadStats();
              loadAuditLogs();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalActions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <User className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ação Mais Comum</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.topActions[0]?.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.topActions[0]?.count || 0} ocorrências
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, ação ou recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-filter">User ID</Label>
              <Input
                id="user-filter"
                placeholder="Filtrar por usuário"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-filter">Ação</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="user_login">Login</SelectItem>
                  <SelectItem value="user_logout">Logout</SelectItem>
                  <SelectItem value="billing_credit">Crédito</SelectItem>
                  <SelectItem value="billing_debit">Débito</SelectItem>
                  <SelectItem value="plugin_enabled">Plugin Habilitado</SelectItem>
                  <SelectItem value="plugin_disabled">Plugin Desabilitado</SelectItem>
                  <SelectItem value="consulta_executada">Consulta Executada</SelectItem>
                  <SelectItem value="admin_action">Ação Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Carregando logs de auditoria...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                Não há logs de auditoria que correspondam aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead className="w-[120px]">Usuário</TableHead>
                    <TableHead className="w-[150px]">Ação</TableHead>
                    <TableHead className="w-[200px]">Recurso</TableHead>
                    <TableHead className="w-[120px]">IP</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.$id}>
                      <TableCell className="font-mono text-sm">
                        {formatDateTime(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.userId ? log.userId.substring(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-[200px] truncate">
                        {log.resource}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {isCriticalAction(log.action) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Ação Crítica
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Anterior
          </Button>
          <span className="flex items-center px-3 py-2 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Log de Auditoria
            </DialogTitle>
            <DialogDescription>
              Log ID: {selectedLog?.$id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Data/Hora</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ação</Label>
                  <div className="mt-1">
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm font-mono text-muted-foreground">
                    {selectedLog.userId || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recurso</Label>
                  <p className="text-sm font-mono text-muted-foreground">
                    {selectedLog.resource}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm font-mono text-muted-foreground">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Detalhes</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg max-h-64 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}