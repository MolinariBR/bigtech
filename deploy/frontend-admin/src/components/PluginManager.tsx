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
import * as api from '@/lib/api/plugins';
import * as tenantApi from '@/lib/api/tenants';

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
  config: { apiKey?: string; fallbackSources?: string[] } | null;
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
      const res = await fetch('/api/plugins');
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
    try {
      const action = plugin.status === 'enabled' ? 'disable' : 'enable';
      const resp = await api.togglePluginForTenant(selectedTenant, plugin.id, action);
      if (resp?.auditId) alert('Operação enviada. auditId: ' + resp.auditId);
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao alterar status: ' + (err.message || err));
    }
  };

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlugin) return;
    try {
      const resp = await api.configurePlugin(editingPlugin.id, editingPlugin.config, selectedTenant);
      if (resp?.auditId) alert('Configuração salva. auditId: ' + resp.auditId);
      setIsDialogOpen(false);
      setEditingPlugin(null);
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar configuração: ' + (err.message || err));
    }
  };

  const handleInstall = () => {
    setIsInstallDialogOpen(true);
  };

  const handleInstallConfirm = async () => {
    if (!selectedPluginToInstall || !selectedTenant) return;

    const plugin = availablePlugins.find(p => p.id === selectedPluginToInstall);
    if (!plugin) return;

    try {
      const resp = await api.installPlugin({
        name: plugin.id,
        type: plugin.type,
        version: plugin.version
      }, selectedTenant);
      if (resp?.auditId) alert('Instalação iniciada. auditId: ' + resp.auditId);
      setIsInstallDialogOpen(false);
      setSelectedPluginToInstall('');
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao instalar plugin: ' + (err.message || err));
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este plugin?')) return;
    try {
      const resp = await api.removePlugin(id, selectedTenant);
      if (resp?.auditId) alert('Remoção iniciada. auditId: ' + resp.auditId);
      await loadPlugins();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao remover plugin: ' + (err.message || err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Label>Selecionar Tenant</Label>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleInstall}>Instalar Novo Plugin</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plugins</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando plugins...</div>
          ) : plugins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum plugin encontrado. Clique em "Instalar Novo Plugin" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plugins.map((plugin) => (
                  <TableRow key={plugin.id}>
                    <TableCell>{plugin.id}</TableCell>
                    <TableCell>{plugin.type}</TableCell>
                    <TableCell>{plugin.version}</TableCell>
                    <TableCell>
                      <Badge variant={plugin.status === 'enabled' ? 'default' : 'secondary'}>
                        {plugin.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(plugin)}>
                        {plugin.status === 'enabled' ? 'Desabilitar' : 'Habilitar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(plugin)}>Configurar</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRemove(plugin.id)}>Remover</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Plugin</DialogTitle>
            <DialogDescription>
              Configure as opções do plugin selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingPlugin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
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
              <div>
                <Label htmlFor="fallback">Fallback Sources (separados por vírgula)</Label>
                <Input
                  id="fallback"
                  value={editingPlugin.config?.fallbackSources?.join(', ') || ''}
                  onChange={(e) => setEditingPlugin({ 
                    ...editingPlugin, 
                    config: { 
                      ...(editingPlugin.config || {}), 
                      fallbackSources: e.target.value.split(',').map(s=>s.trim()).filter(s => s) 
                    } 
                  })}
                />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Novo Plugin</DialogTitle>
            <DialogDescription>
              Selecione um plugin disponível para instalar no tenant atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plugin Disponível</Label>
              <Select value={selectedPluginToInstall} onValueChange={setSelectedPluginToInstall}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plugin" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlugins.map((plugin) => (
                    <SelectItem key={plugin.id} value={plugin.id}>
                      {plugin.id} ({plugin.type}) - v{plugin.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsInstallDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInstallConfirm} disabled={!selectedPluginToInstall}>
                Instalar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}