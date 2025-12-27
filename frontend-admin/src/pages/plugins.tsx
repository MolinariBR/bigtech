// Página de gestão de plugins globais - TASK-005
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Puzzle, CheckCircle, Loader2, Settings, MoreHorizontal, Trash2, Zap, Package, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  type: string;
  version: string;
  config?: Record<string, unknown>;
}

interface GlobalPlugin {
  pluginId: string;
  type: string;
  version: string;
  status: 'installed' | 'configured';
  config: string; // JSON string
  installedBy: string;
  installedAt: string;
  updatedAt: string;
  $id: string;
}

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: {
    attempts: number;
    totalTime: number;
    lastError?: string;
    httpStatus?: number;
    responseTime?: number;
  };
}

export default function PluginsPage() {
  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
  const [globalPlugins, setGlobalPlugins] = useState<GlobalPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [services, setServices] = useState<Record<string, unknown>[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [uninstallingPlugin, setUninstallingPlugin] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, ConnectionTestResult>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar plugins disponíveis
      const availableRes = await fetch('http://localhost:8080/api/admin/plugin-access/plugins/available');
      if (!availableRes.ok) throw new Error('Failed to load available plugins');
      const availableData = await availableRes.json();
      setAvailablePlugins(availableData.plugins || []);

      // Carregar plugins globais instalados
      const globalRes = await fetch('http://localhost:8080/api/admin/plugins/global');
      if (!globalRes.ok) throw new Error('Failed to load global plugins');
      const globalData = await globalRes.json();
      setGlobalPlugins(globalData.plugins || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPluginStatus = (pluginId: string): 'not_installed' | 'installed' | 'configured' => {
    const globalPlugin = globalPlugins.find(p => p.pluginId === pluginId);
    if (!globalPlugin) return 'not_installed';
    return globalPlugin.status as 'installed' | 'configured';
  };

  const getPluginConfig = (pluginId: string): Record<string, unknown> | null => {
    const globalPlugin = globalPlugins.find(p => p.pluginId === pluginId);
    if (!globalPlugin) return null;
    try {
      return JSON.parse(globalPlugin.config);
    } catch {
      return null;
    }
  };

  const handleInstall = async (plugin: Plugin) => {
    try {
      setSaving(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/global/${plugin.id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: {} })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to install plugin');
      }

      toast.success(`Plugin ${plugin.name} instalado globalmente com sucesso!`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao instalar plugin');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigure = (plugin: Plugin) => {
    const config = getPluginConfig(plugin.id) || {};
    setEditingPlugin({ ...plugin, config });
    setActiveTab('config');
    loadServices(plugin.id);
    setIsDialogOpen(true);
  };

  const loadServices = async (pluginId: string) => {
    try {
      setLoadingServices(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}/services?tenantId=demo-tenant`);
      if (!res.ok) throw new Error('Failed to load services');
      const data = await res.json();

      // Merge with existing custom prices from plugin config
      const customPrices = editingPlugin?.config?.servicePrices || {};
      const servicesWithPrices = data.services.map((service: Record<string, unknown>) => ({
        ...service,
        customPrice: customPrices[String(service.id)] || 0
      }));

      setServices(servicesWithPrices);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!editingPlugin) return;

    try {
      setSaving(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/global/${editingPlugin.id}/configure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: editingPlugin.config })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to configure plugin');
      }

      toast.success(`Plugin ${editingPlugin.name} configurado com sucesso!`);
      setIsDialogOpen(false);
      setEditingPlugin(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao configurar plugin');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrices = async () => {
    if (!editingPlugin) return;

    try {
      setSaving(true);

      // Prepare servicePrices object
      const servicePrices: { [key: string]: number } = {};
      services.forEach(service => {
        const customPrice = service.customPrice as number;
        if (customPrice && customPrice > 0) {
          servicePrices[String(service.id)] = customPrice;
        }
      });

      // Update plugin config with servicePrices
      const updatedConfig = {
        ...editingPlugin.config,
        servicePrices
      };

      const res = await fetch(`http://localhost:8080/api/admin/plugins/global/${editingPlugin.id}/configure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save prices');
      }

      toast.success('Preços salvos com sucesso!');
      setIsDialogOpen(false);
      setEditingPlugin(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar preços');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (pluginId: string) => {
    try {
      setTestingConnection(pluginId);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/global/${pluginId}/test-connection`, {
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

      const result: ConnectionTestResult = await res.json();

      if (result.success) {
        toast.success(`Conexão com ${pluginId} estabelecida com sucesso!`);
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

  const handleUninstall = async (pluginId: string) => {
    try {
      setUninstallingPlugin(pluginId);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/global/${pluginId}/uninstall`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to uninstall plugin');
      }

      toast.success(`Plugin ${pluginId} desinstalado globalmente!`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desinstalar plugin');
    } finally {
      setUninstallingPlugin(null);
    }
  };

  const getStatusBadge = (status: 'not_installed' | 'installed' | 'configured') => {
    switch (status) {
      case 'not_installed':
        return <Badge variant="secondary">Não Instalado</Badge>;
      case 'installed':
        return <Badge variant="outline">Instalado</Badge>;
      case 'configured':
        return <Badge variant="default" className="bg-green-100 text-green-800">Configurado</Badge>;
    }
  };

  const getConnectionStatus = (pluginId: string) => {
    const result = connectionResults[pluginId];
    if (!result) return null;

    return result.success ? (
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
          <span className="text-muted-foreground">Carregando plugins...</span>
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
          <Button onClick={loadData} variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Gestão Global de Plugins</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie plugins disponíveis globalmente no sistema BigTech
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disponíveis</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePlugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalados Globalmente</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalPlugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalPlugins.filter(p => p.status === 'configured').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins de Consulta</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePlugins.filter(p => p.type === 'consulta').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins de Pagamento</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePlugins.filter(p => p.type === 'pagamento').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins de Mercado</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePlugins.filter(p => p.type === 'mercado').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins Funcionais</CardTitle>
            <Package className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availablePlugins.filter(p => p.type === 'funcional').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Todos os Plugins Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availablePlugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plugin encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não há plugins disponíveis no sistema de nenhum tipo (consulta, pagamento, mercado, funcional).
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[150px]">Conectividade</TableHead>
                    <TableHead className="w-[100px]">Versão</TableHead>
                    <TableHead className="w-[200px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availablePlugins.map((plugin) => {
                    const status = getPluginStatus(plugin.id);
                    const connectionStatus = getConnectionStatus(plugin.id);

                    return (
                      <TableRow key={plugin.id}>
                        <TableCell className="font-medium">{plugin.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {plugin.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(status)}
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

                              {status === 'not_installed' ? (
                                <DropdownMenuItem
                                  onClick={() => handleInstall(plugin)}
                                  disabled={saving}
                                >
                                  <Package className="mr-2 h-4 w-4" />
                                  Instalar Globalmente
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => handleConfigure(plugin)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configurar
                                  </DropdownMenuItem>

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
                                    onClick={() => setUninstallingPlugin(plugin.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Desinstalar
                                  </DropdownMenuItem>
                                </>
                              )}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Plugin Global
            </DialogTitle>
            <DialogDescription>
              Configure as opções do plugin &quot;{editingPlugin?.name}&quot; para uso global no sistema.
            </DialogDescription>
          </DialogHeader>

          {editingPlugin && (
            <Tabs defaultValue={activeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="prices">Preços</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-6 py-4">
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
                        <p className="text-sm text-muted-foreground">
                          URL da API para ambiente de produção
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="homologationUrl">URL de Homologação</Label>
                        <Input
                          id="homologationUrl"
                          placeholder="https://homologacao.api.exemplo.com"
                          value={String(editingPlugin.config?.homologationUrl || '')}
                          onChange={(e) => setEditingPlugin({
                            ...editingPlugin,
                            config: {
                              ...(editingPlugin.config || {}),
                              homologationUrl: e.target.value
                            }
                          })}
                        />
                        <p className="text-sm text-muted-foreground">
                          URL da API para ambiente de homologação (opcional)
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={Boolean(editingPlugin.config?.useHomologation) || false}
                          onCheckedChange={(checked) => setEditingPlugin({
                            ...editingPlugin,
                            config: {
                              ...(editingPlugin.config || {}),
                              useHomologation: checked
                            }
                          })}
                        />
                        <Label htmlFor="useHomologation" className="text-sm font-medium">
                          Usar Ambiente de Homologação
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quando ativado, usa a URL de homologação ao invés da produção
                      </p>
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
                      <p className="text-sm text-muted-foreground">
                        Chave de autenticação da API (será encriptada)
                      </p>
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

                {/* Validação de campos obrigatórios */}
                {(!editingPlugin.config?.baseUrl || !editingPlugin.config?.apiKey) && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Campos marcados com * são obrigatórios
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="prices" className="space-y-6 py-4">
                {loadingServices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Carregando serviços...</span>
                  </div>
                ) : services.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Configuração de Preços por Serviço</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure os preços personalizados para cada serviço oferecido por este plugin.
                    </p>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Preço Atual (R$)</TableHead>
                            <TableHead>Preço Personalizado (R$)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {services.map((service: Record<string, unknown>) => (
                            <TableRow key={String(service.id)}>
                              <TableCell className="font-medium">
                                {String(service.name)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {(service.defaultPrice as number)?.toFixed(2) || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={String(service.customPrice || '')}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setServices(prev => prev.map(s =>
                                      s.id === service.id
                                        ? { ...s, customPrice: value }
                                        : s
                                    ));
                                  }}
                                  className="w-24"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSavePrices}
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
                            Salvar Preços
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum serviço encontrado para este plugin.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={saving || !editingPlugin?.config?.baseUrl || !editingPlugin?.config?.apiKey}
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

      {/* Uninstall Confirmation Dialog */}
      <AlertDialog open={!!uninstallingPlugin} onOpenChange={() => setUninstallingPlugin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desinstalação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desinstalar o plugin &quot;{uninstallingPlugin}&quot; globalmente?
              Esta ação não pode ser desfeita e afetará todos os tenants que usam este plugin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => uninstallingPlugin && handleUninstall(uninstallingPlugin)}
              className="bg-red-600 hover:bg-red-700"
            >
              Desinstalar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}