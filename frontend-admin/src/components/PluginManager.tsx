// Componente para gestão de plugins (TASK-PLUGIN-001)
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, Power, PowerOff, Trash2, MoreHorizontal, CheckCircle, XCircle, Loader2, Puzzle, Zap, Package, Play, Pause } from 'lucide-react';
import * as api from '@/lib/api/plugins';
import * as tenantApi from '@/lib/api/tenants';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  status: string;
  plugins: string[];
  createdAt: string;
}

interface Plugin {
  id: string;
  type: string;
  version: string;
  status: string;
  config: {
    apiKey?: string;
    fallbackSources?: string[];
    // BigTech specific config
    baseUrl?: string;
    homologationUrl?: string;
    useHomologation?: boolean;
  } | null;
  installedAt: string | null;
  updatedAt: string | null;
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState<any[]>([]);
  const [selectedPluginToInstall, setSelectedPluginToInstall] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [removingPlugin, setRemovingPlugin] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      const res = await tenantApi.listTenants();
      setTenants(res || []);
      if (res && res.length > 0 && !selectedTenant) {
        setSelectedTenant(res[0].id);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao carregar tenants: ' + (err.message || err));
    }
  };

  const loadPlugins = async () => {
    if (!selectedTenant) return;
    setLoading(true);
    try {
      const res = await api.listPlugins(selectedTenant);
      setPlugins(res || []);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao carregar plugins: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlugins = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/plugins');
      if (!res.ok) throw new Error('Failed to load available plugins');
      const data = await res.json();
      setAvailablePlugins(data.plugins || []);
    } catch (err: any) {
      console.error('Erro ao carregar plugins disponíveis:', err);
    }
  };

  useEffect(() => {
    loadTenants();
    loadAvailablePlugins();
  }, []);

  useEffect(() => {
    loadPlugins();
  }, [selectedTenant]);

  const handleToggleStatus = async (plugin: Plugin) => {
    if (!selectedTenant) return;

    setTogglingStatus(plugin.id);
    const action = plugin.status === 'enabled' ? 'disable' : 'enable';

    try {
      const resp = await api.togglePluginForTenant(selectedTenant, plugin.id, action);
      toast.success(`Plugin ${action === 'enable' ? 'habilitado' : 'desabilitado'} com sucesso!`);
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao alterar status do plugin');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleSave = async () => {
    if (!editingPlugin) return;

    setSaving(true);
    try {
      const resp = await api.configurePlugin(editingPlugin.id, editingPlugin.config, selectedTenant);
      toast.success('Configuração salva com sucesso!');
      setIsDialogOpen(false);
      setEditingPlugin(null);
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleInstallConfirm = async () => {
    if (!selectedPluginToInstall || !selectedTenant) return;

    const plugin = availablePlugins.find(p => p.id === selectedPluginToInstall);
    if (!plugin) return;

    setInstalling(true);
    try {
      const resp = await api.installPlugin({
        name: plugin.id,
        type: plugin.type,
        version: plugin.version
      }, selectedTenant);
      toast.success('Plugin instalado com sucesso!');
      setIsInstallDialogOpen(false);
      setSelectedPluginToInstall('');
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao instalar plugin');
    } finally {
      setInstalling(false);
    }
  };

  const handleInstall = () => {
    setIsInstallDialogOpen(true);
  };

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setIsDialogOpen(true);
  };

  const handleRemove = async (id: string) => {
    setRemovingPlugin(id);
    try {
      const resp = await api.removePlugin(id, selectedTenant);
      toast.success('Plugin removido com sucesso!');
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao remover plugin');
    } finally {
      setRemovingPlugin(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Plugins</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie plugins e suas configurações por tenant
          </p>
        </div>
        <Button onClick={handleInstall} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Instalar Plugin
        </Button>
      </div>

      {/* Tenant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleção de Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-select">Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione um tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        {tenant.status === 'active' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        {tenant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTenant && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Plugins instalados:</span>
                <Badge variant="secondary">{plugins.length}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedTenant && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">Plugins Ativos</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plugins.filter(p => p.status === 'enabled').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plugins Inativos</CardTitle>
              <Pause className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plugins.filter(p => p.status === 'disabled').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plugins Disponíveis</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availablePlugins.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plugins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Plugins Instalados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedTenant ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um Tenant</h3>
              <p className="text-muted-foreground">
                Escolha um tenant acima para visualizar e gerenciar seus plugins.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Carregando plugins...</span>
              </div>
            </div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plugin instalado</h3>
              <p className="text-muted-foreground mb-4">
                Este tenant ainda não possui plugins instalados.
              </p>
              <Button onClick={handleInstall}>
                <Plus className="h-4 w-4 mr-2" />
                Instalar Primeiro Plugin
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Versão</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[150px]">Instalado em</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => (
                    <TableRow key={plugin.id}>
                      <TableCell className="font-medium">{plugin.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plugin.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{plugin.version}</TableCell>
                      <TableCell>
                        <Badge
                          variant={plugin.status === 'enabled' ? 'default' : 'secondary'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {plugin.status === 'enabled' ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                          {plugin.status === 'enabled' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {plugin.installedAt ? new Date(plugin.installedAt).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(plugin)}
                              disabled={togglingStatus === plugin.id}
                            >
                              {togglingStatus === plugin.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : plugin.status === 'enabled' ? (
                                <PowerOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Power className="mr-2 h-4 w-4" />
                              )}
                              {plugin.status === 'enabled' ? 'Desabilitar' : 'Habilitar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(plugin)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Configurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Plugin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o plugin "{plugin.id}"?
                                    Esta ação não pode ser desfeita e todas as configurações
                                    serão permanentemente perdidas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemove(plugin.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={removingPlugin === plugin.id}
                                  >
                                    {removingPlugin === plugin.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Removendo...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remover
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Plugin
            </DialogTitle>
            <DialogDescription>
              Configure as opções do plugin "{editingPlugin?.id}".
            </DialogDescription>
          </DialogHeader>
          {editingPlugin && (
            <div className="space-y-4 py-4">
              {/* Configurações específicas do BigTech */}
              {editingPlugin.type === 'consulta' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">URL de Produção</Label>
                    <Input
                      id="baseUrl"
                      placeholder="https://api.consultasbigtech.com.br/json/service.aspx"
                      value={editingPlugin.config?.baseUrl || ''}
                      onChange={(e) => setEditingPlugin({
                        ...editingPlugin,
                        config: {
                          ...(editingPlugin.config || {}),
                          baseUrl: e.target.value
                        }
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      URL da API BigTech para ambiente de produção
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homologationUrl">URL de Homologação</Label>
                    <Input
                      id="homologationUrl"
                      placeholder="https://api.consultasbigtech.com.br/json/homologa.aspx"
                      value={editingPlugin.config?.homologationUrl || ''}
                      onChange={(e) => setEditingPlugin({
                        ...editingPlugin,
                        config: {
                          ...(editingPlugin.config || {}),
                          homologationUrl: e.target.value
                        }
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      URL da API BigTech para ambiente de homologação
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingPlugin.config?.useHomologation || false}
                      onCheckedChange={(checked) => setEditingPlugin({
                        ...editingPlugin,
                        config: {
                          ...(editingPlugin.config || {}),
                          useHomologation: checked
                        }
                      })}
                    />
                    <Label htmlFor="useHomologation" className="text-sm font-medium">
                      Usar Homologação
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, usa a URL de homologação ao invés da produção
                  </p>
                </>
              )}

              {/* Configurações genéricas */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  placeholder="Digite a chave da API"
                  value={editingPlugin.config?.apiKey || ''}
                  onChange={(e) => setEditingPlugin({
                    ...editingPlugin,
                    config: {
                      ...(editingPlugin.config || {}),
                      apiKey: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallback">Fontes de Fallback (separadas por vírgula)</Label>
                <Input
                  id="fallback"
                  placeholder="fonte1, fonte2, fonte3"
                  value={editingPlugin.config?.fallbackSources?.join(', ') || ''}
                  onChange={(e) => setEditingPlugin({
                    ...editingPlugin,
                    config: {
                      ...(editingPlugin.config || {}),
                      fallbackSources: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Fontes alternativas para consulta em caso de falha da API principal
                </p>
              </div>
            </div>
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
              onClick={handleSave}
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

      {/* Install Dialog */}
      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Instalar Novo Plugin
            </DialogTitle>
            <DialogDescription>
              Selecione um plugin disponível para instalar no tenant atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plugin-select">Plugin Disponível</Label>
              <Select value={selectedPluginToInstall} onValueChange={setSelectedPluginToInstall}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plugin para instalar" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlugins.map((plugin) => (
                    <SelectItem key={plugin.id} value={plugin.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium">{plugin.id}</span>
                          <span className="text-sm text-muted-foreground capitalize">
                            {plugin.type} • v{plugin.version}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPluginToInstall && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Plugin selecionado:</strong> {selectedPluginToInstall}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Este plugin será instalado no tenant "{tenants.find(t => t.id === selectedTenant)?.name}".
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsInstallDialogOpen(false)}
              disabled={installing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInstallConfirm}
              disabled={!selectedPluginToInstall || installing}
            >
              {installing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Instalando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Instalar Plugin
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}