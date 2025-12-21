// Componente para gestão de plugins (TASK-013)
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
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('tenant1');
  const [loading, setLoading] = useState(false);

  const loadPlugins = async (tenantId: string) => {
    setLoading(true);
    try {
      const res = await api.listPlugins(tenantId);
      setPlugins(res || []);
    } catch (err:any) {
      console.error(err);
      alert('Erro ao carregar plugins: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins(selectedTenant);
  }, [selectedTenant]);

  const handleToggleStatus = async (plugin: Plugin) => {
    try {
      const action = plugin.status === 'enabled' ? 'disable' : 'enable';
      const resp = await api.togglePlugin(plugin.id, action);
      if (resp?.auditId) alert('Operação enviada. auditId: ' + resp.auditId);
      await loadPlugins(selectedTenant);
    } catch (err:any) {
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
      const resp = await api.configurePlugin(editingPlugin.id, editingPlugin.config);
      if (resp?.auditId) alert('Configuração salva. auditId: ' + resp.auditId);
      setIsDialogOpen(false);
      setEditingPlugin(null);
      await loadPlugins(selectedTenant);
    } catch (err:any) {
      console.error(err);
      alert('Erro ao salvar configuração: ' + (err.message || err));
    }
  };

  const handleInstall = async () => {
    try {
      const resp = await api.installPlugin(selectedTenant, { name: 'new-plugin', type: 'consulta', version: '1.0.0' });
      if (resp?.auditId) alert('Instalação iniciada. auditId: ' + resp.auditId);
      await loadPlugins(selectedTenant);
    } catch (err:any) {
      console.error(err);
      alert('Erro ao instalar plugin: ' + (err.message || err));
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este plugin?')) return;
    try {
      const resp = await api.removePlugin(id);
      if (resp?.auditId) alert('Remoção iniciada. auditId: ' + resp.auditId);
      await loadPlugins(selectedTenant);
    } catch (err:any) {
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tenant1">Tenant 1</SelectItem>
              <SelectItem value="tenant2">Tenant 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleInstall}>Instalar Novo Plugin</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plugins para Tenant {selectedTenant}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando plugins...</div>
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
    </div>
  );
}