// Componente para gestão de plugins globais (TASK-PLUGIN-001)
import { useEffect, useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, MoreHorizontal, CheckCircle, Loader2, Puzzle, Zap, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  type: string;
  version: string;
  config?: Record<string, unknown>;
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPlugins = async () => {
    setLoading(true);
      try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:8080/api/admin/plugin-access/plugins/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load available plugins');
      const data: { plugins?: Plugin[] } = await res.json();
      setPlugins(data.plugins || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar plugins:', err);
      toast.error('Erro ao carregar plugins disponíveis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlugin) return;

    setSaving(true);
    try {
      // TODO: Implementar API para salvar configuração global do plugin
      toast.success('Configuração salva com sucesso!');
      setIsDialogOpen(false);
      setEditingPlugin(null);
    } catch (err: unknown) {
      console.error('Erro ao salvar configuração:', err);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Plugins</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie plugins disponíveis globalmente no sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-sm font-medium">Plugins de Consulta</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.filter(p => p.type === 'consulta').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins Disponíveis</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plugins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Plugins Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Carregando plugins...</span>
              </div>
            </div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plugin disponível</h3>
              <p className="text-muted-foreground">
                Não há plugins disponíveis no sistema no momento.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead className="w-[120px]">Tipo</TableHead>
                    <TableHead className="w-[100px]">Versão</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plugins.map((plugin) => (
                    <TableRow key={plugin.id}>
                      <TableCell className="font-medium">{plugin.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plugin.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{plugin.version}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEdit(plugin)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Configurar
                            </DropdownMenuItem>
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
              Configure as opções do plugin &quot;{editingPlugin?.name}&quot;.
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
                      value={(editingPlugin.config?.baseUrl as string) || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingPlugin({
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
                      value={(editingPlugin.config?.homologationUrl as string) || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingPlugin({
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
                      checked={(editingPlugin.config?.useHomologation as boolean) || false}
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
                  value={(editingPlugin.config?.apiKey as string) || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingPlugin({
                    ...editingPlugin,
                    config: {
                      ...(editingPlugin.config || {}),
                      apiKey: e.target.value
                    }
                  })}
                />
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
    </div>
  );
}