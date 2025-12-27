// Página de gestão de plugins por tenant - TASK-007 (configuração de preços)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Puzzle, CheckCircle, Loader2, Settings, MoreHorizontal, Play, Pause, Trash2, Zap, Package, AlertCircle, Wifi, WifiOff, DollarSign, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  type: string;
  version: string;
  status: string;
  config?: Record<string, unknown>;
  installedAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isCustomPrice: boolean;
  active: boolean;
}

export default function TenantPluginsPage() {
  const router = useRouter();
  const { tenantId } = router.query;

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isPricesDialogOpen, setIsPricesDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [removingPlugin, setRemovingPlugin] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, unknown>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadPlugins = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`http://localhost:8080/api/admin/plugins?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('Failed to load tenant plugins');
      const data = await res.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (pluginId: string) => {
    if (!tenantId) return;

    try {
      setServicesLoading(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}/services?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('Failed to load plugin services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      toast.error('Erro ao carregar serviços do plugin');
      console.error('Failed to load services:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadPlugins();
    }
  }, [tenantId, loadPlugins]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disabled':
        return <Badge variant="secondary">Desabilitado</Badge>;
      case 'enabled':
        return <Badge variant="default" className="bg-green-100 text-green-800">Habilitado</Badge>;
      case 'configured':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Configurado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleTogglePlugin = async (pluginId: string, action: 'enable' | 'disable') => {
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}/toggle?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to toggle plugin');
      }

      toast.success(`Plugin ${action === 'enable' ? 'habilitado' : 'desabilitado'} com sucesso!`);
      await loadPlugins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status do plugin');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigurePlugin = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!editingPlugin || !tenantId) return;

    try {
      setSaving(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${editingPlugin.id}/config?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: editingPlugin.config,
          servicePrices: {},
          fallbackConfig: {},
          rateLimitConfig: {}
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to configure plugin');
      }

      toast.success(`Plugin configurado com sucesso!`);
      setIsConfigDialogOpen(false);
      setEditingPlugin(null);
      await loadPlugins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao configurar plugin');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPrices = async (pluginId: string) => {
    setSelectedPlugin(pluginId);
    await loadServices(pluginId);
    setIsPricesDialogOpen(true);
  };

  const handleSavePrices = async () => {
    if (!selectedPlugin || !tenantId) return;

    try {
      setSaving(true);

      // Criar objeto com preços customizados
      const servicePrices: Record<string, number> = {};
      services.forEach(service => {
        if (service.isCustomPrice) {
          servicePrices[service.id] = service.price;
        }
      });

      const res = await fetch(`http://localhost:8080/api/admin/plugins/${selectedPlugin}/config?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {},
          servicePrices,
          fallbackConfig: {},
          rateLimitConfig: {}
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save prices');
      }

      toast.success('Preços salvos com sucesso!');
      setIsPricesDialogOpen(false);
      setSelectedPlugin(null);
      setServices([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar preços');
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (serviceId: string, newPrice: number) => {
    setServices(prev => prev.map(service =>
      service.id === serviceId
        ? { ...service, price: newPrice, isCustomPrice: true }
        : service
    ));
  };

  const handleResetPrice = (serviceId: string) => {
    setServices(prev => prev.map(service =>
      service.id === serviceId
        ? { ...service, price: 0, isCustomPrice: false } // O backend vai usar o preço padrão
        : service
    ));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTestConnection = async (pluginId: string) => {
    try {
      setTestingConnection(pluginId);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}/test-connection?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testOptions: {
            timeout: 5000,
            retries: 2,
            retryDelay: 1000
          }
        })
      });

      const result = await res.json();

      if (result.status === 'connected') {
        toast.success(`Conexão estabelecida com sucesso!`);
      } else {
        toast.error(`Falha na conexão: ${result.error}`);
      }

      setConnectionResults(prev => ({ ...prev, [pluginId]: result }));
    } catch {
      toast.error('Erro ao testar conexão');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleRemovePlugin = async (pluginId: string) => {
    try {
      setRemovingPlugin(pluginId);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}?tenantId=${tenantId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove plugin');
      }

      toast.success('Plugin removido com sucesso!');
      await loadPlugins();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover plugin');
    } finally {
      setRemovingPlugin(null);
    }
  };

  const getConnectionStatus = (pluginId: string) => {
    const result = connectionResults[pluginId];
    if (!result) return null;

    const status = (result as { status: string }).status;
    return status === 'connected' ? (
      <div className="flex items-center gap-1 text-green-600">
        <Wifi className="h-4 w-4" />
        <span className="text-sm">Conectado</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Falha</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Carregando plugins do tenant...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Puzzle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold text-destructive">Erro ao carregar plugins</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadPlugins} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plugins do Tenant</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie plugins e configure preços para o tenant: <strong>{tenantId}</strong>
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Plugins</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habilitados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.filter(p => p.status === 'enabled').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurados</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.filter(p => p.status === 'configured').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins de Consulta</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.filter(p => p.type === 'consulta').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Plugins do Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plugin encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Este tenant não possui plugins instalados.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Plugin</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[150px]">Conectividade</TableHead>
                    <TableHead className="w-[100px]">Versão</TableHead>
                    <TableHead className="w-[200px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => {
                    const connectionStatus = getConnectionStatus(plugin.id);

                    return (
                      <TableRow key={plugin.id}>
                        <TableCell className="font-medium">{plugin.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {plugin.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plugin.status)}
                        </TableCell>
                        <TableCell>
                          {connectionStatus || (
                            <span className="text-muted-foreground text-sm">Não testado</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {plugin.version}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              {plugin.status === 'disabled' ? (
                                <DropdownMenuItem
                                  onClick={() => handleTogglePlugin(plugin.id, 'enable')}
                                  disabled={saving}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Habilitar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleTogglePlugin(plugin.id, 'disable')}
                                  disabled={saving}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Desabilitar
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleConfigurePlugin(plugin)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Configurar
                              </DropdownMenuItem>

                              {plugin.type === 'consulta' && (
                                <DropdownMenuItem onClick={() => handleEditPrices(plugin.id)}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Configurar Preços
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleTestConnection(plugin.id)}
                                disabled={testingConnection === plugin.id}
                              >
                                {testingConnection === plugin.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Wifi className="mr-2 h-4 w-4" />
                                )}
                                Testar Conexão
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setRemovingPlugin(plugin.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Plugin
            </DialogTitle>
            <DialogDescription>
              Configure as opções do plugin &quot;{editingPlugin?.id}&quot; para este tenant.
            </DialogDescription>
          </DialogHeader>

          {editingPlugin && (
            <div className="space-y-6 py-4">
              {/* Configurações específicas por tipo de plugin */}
              {editingPlugin.type === 'consulta' && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Configurações de API</h4>

                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">URL de Produção *</Label>
                      <Input
                        id="baseUrl"
                        placeholder="https://api.exemplo.com"
                        value={String(editingPlugin.config?.baseUrl || '')}
                        onChange={(e) => setEditingPlugin({
                          ...editingPlugin,
                          config: {
                            ...(editingPlugin.config || {}),
                            baseUrl: e.target.value
                          }
                        })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key *</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Digite a chave da API"
                        value={String(editingPlugin.config?.apiKey || '')}
                        onChange={(e) => setEditingPlugin({
                          ...editingPlugin,
                          config: {
                            ...(editingPlugin.config || {}),
                            apiKey: e.target.value
                          }
                        })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Configurações para plugins de pagamento */}
              {editingPlugin.type === 'pagamento' && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Configurações de Gateway</h4>

                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">URL da API *</Label>
                      <Input
                        id="baseUrl"
                        placeholder="https://api.gateway.com"
                        value={String(editingPlugin.config?.baseUrl || '')}
                        onChange={(e) => setEditingPlugin({
                          ...editingPlugin,
                          config: {
                            ...(editingPlugin.config || {}),
                            baseUrl: e.target.value
                          }
                        })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key *</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Digite a chave da API"
                        value={String(editingPlugin.config?.apiKey || '')}
                        onChange={(e) => setEditingPlugin({
                          ...editingPlugin,
                          config: {
                            ...(editingPlugin.config || {}),
                            apiKey: e.target.value
                          }
                        })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prices Configuration Dialog */}
      <Dialog open={isPricesDialogOpen} onOpenChange={setIsPricesDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configurar Preços dos Serviços
            </DialogTitle>
            <DialogDescription>
              Configure preços customizados para os serviços do plugin &quot;{selectedPlugin}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden py-4">
            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando serviços...</span>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum serviço encontrado para este plugin.</p>
              </div>
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                {/* Search and filters */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar serviços..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedCategories(new Set())}
                      >
                        Recolher Tudo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedCategories(new Set(Object.keys(
                          services.reduce((acc, service) => {
                            acc[service.category] = [];
                            return acc;
                          }, {} as Record<string, Service[]>)
                        )))}
                      >
                        Expandir Tudo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Services grouped by category */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {Object.entries(
                    filteredServices.reduce((acc, service) => {
                      if (!acc[service.category]) acc[service.category] = [];
                      acc[service.category].push(service);
                      return acc;
                    }, {} as Record<string, Service[]>)
                  ).map(([category, categoryServices]) => {
                    const isExpanded = expandedCategories.has(category);
                    const customCount = categoryServices.filter(s => s.isCustomPrice).length;

                    return (
                      <div key={category} className="mb-4 border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Badge variant="outline" className="capitalize">
                              {category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {categoryServices.length} serviços
                              {customCount > 0 && (
                                <span className="ml-2 text-blue-600 font-medium">
                                  ({customCount} customizados)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {customCount > 0 && (
                              <Badge variant="default" className="text-xs">
                                {customCount}
                              </Badge>
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-background">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categoryServices.map((service) => (
                                <div
                                  key={service.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{service.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{service.description}</div>
                                  </div>

                                  <div className="flex items-center gap-3 ml-4">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`price-${service.id}`} className="text-sm font-medium">
                                        R$
                                      </Label>
                                      <Input
                                        id={`price-${service.id}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={service.price}
                                        onChange={(e) => handlePriceChange(service.id, parseFloat(e.target.value) || 0)}
                                        className="w-20 h-8 text-sm"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {service.isCustomPrice ? (
                                        <Badge variant="default" className="text-xs">Custom</Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                      )}

                                      {service.isCustomPrice && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleResetPrice(service.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary and info */}
                <div className="flex-shrink-0 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Total: <strong>{services.length}</strong> serviços
                      </span>
                      <span className="text-muted-foreground">
                        Customizados: <strong>{services.filter(s => s.isCustomPrice).length}</strong>
                      </span>
                      {searchTerm && (
                        <span className="text-muted-foreground">
                          Filtrados: <strong>{filteredServices.length}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md mt-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Preços marcados como &quot;Custom&quot; substituirão os valores padrão do plugin.
                      Clique no ícone de edição para reverter ao preço padrão.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 flex-shrink-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPricesDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrices}
              disabled={saving || servicesLoading}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  &quot;Salvar Preços&quot;
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Plugin Confirmation Dialog */}
      <AlertDialog open={!!removingPlugin} onOpenChange={() => setRemovingPlugin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o plugin &quot;{removingPlugin}&quot; deste tenant?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingPlugin && handleRemovePlugin(removingPlugin)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}