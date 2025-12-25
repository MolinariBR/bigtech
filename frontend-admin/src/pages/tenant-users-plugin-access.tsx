// Página de gestão de usuários do tenant para controle de acesso a plugins
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Users, ArrowLeft, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface UserPlugin {
  pluginId: string;
  allowed: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  allowedPlugins: UserPlugin[];
}

interface TenantPlugin {
  pluginId: string;
  status: 'active' | 'inactive';
}

interface AvailablePlugin {
  id: string;
  name: string;
  type: string;
  version: string;
}

export default function TenantUsersPluginAccessPage() {
  const router = useRouter();
  const { tenantId } = router.query;

  const [users, setUsers] = useState<User[]>([]);
  const [tenantPlugins, setTenantPlugins] = useState<TenantPlugin[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTenantUsers = async () => {
    if (!tenantId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:8080/api/admin/tenants/${tenantId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load tenant users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Erro ao carregar usuários do tenant');
    }
  };

  const loadTenantPlugins = async () => {
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
      setTenantPlugins((data.plugins || []).map((plugin: any) => ({
        pluginId: plugin.pluginId,
        status: plugin.status as 'active' | 'inactive'
      })));
    } catch (err) {
      toast.error('Erro ao carregar plugins do tenant');
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

  const loadUserPlugins = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:8080/api/admin/plugin-access/users/${userId}/plugins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load user plugins');
      const data = await res.json();

      // Atualizar plugins do usuário
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, allowedPlugins: (data.allowedPlugins || []).map((plugin: any) => ({
              pluginId: plugin.pluginId,
              allowed: Boolean(plugin.allowed)
            })) }
          : user
      ));
    } catch (err) {
      toast.error('Erro ao carregar plugins do usuário');
    }
  };

  const updateUserPlugins = async (userId: string, allowedPlugins: UserPlugin[]) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:8080/api/admin/plugin-access/users/${userId}/plugins`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allowedPlugins })
      });

      if (!res.ok) throw new Error('Failed to update user plugins');

      toast.success('Plugins do usuário atualizados com sucesso');
      loadUserPlugins(userId);
    } catch (err) {
      toast.error('Erro ao atualizar plugins do usuário');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserPluginAccess = (userId: string, pluginId: string, currentlyAllowed: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedPlugins: UserPlugin[] = user.allowedPlugins.map(plugin =>
      plugin.pluginId === pluginId
        ? { ...plugin, allowed: !currentlyAllowed }
        : plugin
    );

    // Se permitindo acesso, garantir que o plugin existe na lista
    const pluginExists = updatedPlugins.find(p => p.pluginId === pluginId);
    if (!pluginExists && !currentlyAllowed) {
      updatedPlugins.push({
        pluginId,
        allowed: true
      });
    }

    updateUserPlugins(userId, updatedPlugins);
  };

  const getPluginName = (pluginId: string) => {
    const plugin = availablePlugins.find(p => p.id === pluginId);
    return plugin?.name || pluginId;
  };

  const getPluginStatus = (pluginId: string) => {
    const tenantPlugin = tenantPlugins.find(tp => tp.pluginId === pluginId);
    return tenantPlugin?.status === 'active';
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (tenantId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          loadTenantUsers(),
          loadTenantPlugins(),
          loadAvailablePlugins()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [tenantId]);

  // Carregar plugins de cada usuário quando a lista de usuários for carregada
  useEffect(() => {
    if (users.length > 0) {
      users.forEach(user => {
        loadUserPlugins(user.id);
      });
    }
  }, [users.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tenant não especificado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/plugin-access')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Usuários do Tenant</h1>
            <p className="text-muted-foreground">
              Controle individual de acesso a plugins por usuário
            </p>
          </div>
        </div>
      </div>

      {/* Plugins Ativos no Tenant */}
      <Card>
        <CardHeader>
          <CardTitle>Plugins Ativos no Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tenantPlugins.filter(tp => tp.status === 'active').map(tp => (
              <Badge key={tp.pluginId} variant="default">
                {getPluginName(tp.pluginId)}
              </Badge>
            ))}
            {tenantPlugins.filter(tp => tp.status === 'active').length === 0 && (
              <p className="text-muted-foreground">Nenhum plugin ativo no tenant</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Busca de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plugins Permitidos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.allowedPlugins.filter(ap => ap.allowed).map(ap => (
                        <Badge key={ap.pluginId} variant="outline" className="text-xs">
                          {getPluginName(ap.pluginId)}
                        </Badge>
                      ))}
                      {user.allowedPlugins.filter(ap => ap.allowed).length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum plugin permitido</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Abrir modal ou página de edição de plugins do usuário
                        toast.info('Funcionalidade em desenvolvimento');
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Editar Acesso
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário no tenant'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controle Individual de Plugins */}
      {filteredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Controle Individual de Acesso</CardTitle>
            <p className="text-sm text-muted-foreground">
              Selecione um usuário para gerenciar seu acesso individual aos plugins ativos no tenant.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Selecione um usuário na tabela acima para gerenciar seu acesso
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}