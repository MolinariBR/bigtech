// Página de gestão de acesso a plugins de consulta por tenant
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface TenantPlugin {
  pluginId: string;
  status: 'active' | 'inactive';
  config?: Record<string, any>;
}

interface AvailablePlugin {
  id: string;
  name: string;
  type: string;
  version: string;
  config?: Record<string, any>;
}

interface Tenant {
  id: string;
  name: string;
  status: string;
  plugins: TenantPlugin[];
}

export default function PluginAccessPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTenants = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:8080/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load tenants');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      toast.error('Erro ao carregar tenants');
    }
  };

  const loadAvailablePlugins = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:8080/api/admin/plugin-access/plugins/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load available plugins');
      const data = await res.json();
      setAvailablePlugins(data.plugins || []);
    } catch (err) {
      toast.error('Erro ao carregar plugins disponíveis');
    }
  };

  const loadTenantPlugins = async (tenantId: string) => {
    if (!tenantId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:8080/api/admin/plugin-access/tenants/${tenantId}/plugins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load tenant plugins');
      const data = await res.json();

      // Atualizar plugins do tenant selecionado
      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, plugins: (data.plugins || []).map((plugin: any) => ({
              pluginId: plugin.pluginId,
              status: plugin.status as 'active' | 'inactive',
              config: plugin.config
            })) }
          : tenant
      ));
    } catch (err) {
      toast.error('Erro ao carregar plugins do tenant');
    }
  };

  const updateTenantPlugins = async (tenantId: string, plugins: TenantPlugin[]) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:8080/api/admin/plugin-access/tenants/${tenantId}/plugins`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plugins })
      });

      if (!res.ok) throw new Error('Failed to update tenant plugins');

      toast.success('Plugins do tenant atualizados com sucesso');
      loadTenantPlugins(tenantId);
    } catch (err) {
      toast.error('Erro ao atualizar plugins do tenant');
    } finally {
      setSaving(false);
    }
  };

  const togglePluginStatus = (tenantId: string, pluginId: string, currentStatus: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const updatedPlugins: TenantPlugin[] = tenant.plugins.map(plugin =>
      plugin.pluginId === pluginId
        ? { ...plugin, status: currentStatus === 'active' ? 'inactive' as const : 'active' as const }
        : plugin
    );

    // Se ativando, garantir que o plugin existe na lista
    const pluginExists = updatedPlugins.find(p => p.pluginId === pluginId);
    if (!pluginExists && currentStatus === 'inactive') {
      const availablePlugin = availablePlugins.find(p => p.id === pluginId);
      if (availablePlugin) {
        updatedPlugins.push({
          pluginId,
          status: 'active' as const,
          config: availablePlugin.config
        });
      }
    }

    updateTenantPlugins(tenantId, updatedPlugins);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTenants(), loadAvailablePlugins()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadTenantPlugins(selectedTenant);
    }
  }, [selectedTenant]);

  const selectedTenantData = tenants.find(t => t.id === selectedTenant);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Acesso a Plugins</h1>
          <p className="text-muted-foreground">
            Controle quais plugins de consulta estão disponíveis por tenant
          </p>
        </div>
      </div>

      {/* Seleção de Tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Selecionar Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="tenant-select">Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTenantData && (
              <div className="flex items-center gap-2">
                <Badge variant={selectedTenantData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedTenantData.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plugins Disponíveis */}
      {selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Plugins de Consulta Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plugin</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status no Tenant</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availablePlugins.map((plugin) => {
                  const tenantPlugin = selectedTenantData?.plugins.find(tp => tp.pluginId === plugin.id);
                  const isActive = tenantPlugin?.status === 'active';

                  return (
                    <TableRow key={plugin.id}>
                      <TableCell className="font-medium">{plugin.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plugin.type}</Badge>
                      </TableCell>
                      <TableCell>{plugin.version}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`plugin-${plugin.id}`} className="text-sm">
                            {isActive ? 'Ativo' : 'Inativo'}
                          </Label>
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => togglePluginStatus(selectedTenant, plugin.id, tenantPlugin?.status || 'inactive')}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {availablePlugins.length === 0 && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum plugin de consulta disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usuários do Tenant */}
      {selectedTenant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Controle Individual por Usuário
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Quando um plugin é ativado no tenant, todos os usuários ganham acesso automaticamente.
              Use esta seção para restringir acesso individualmente.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                // TODO: Implementar navegação para página de usuários do tenant
                toast.info('Funcionalidade em desenvolvimento');
              }}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários do Tenant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}