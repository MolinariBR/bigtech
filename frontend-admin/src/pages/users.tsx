// Página de gestão de usuários do frontend-app
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Power, PowerOff, MoreHorizontal, CheckCircle, XCircle, Loader2, User, Mail, Shield, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  identifier: string; // CPF/CNPJ
  name?: string;
  email?: string;
  phone?: string;
  tenantId: string;
  type: string;
  role: string;
  status: 'active' | 'inactive';
  credits: number;
  createdAt: string;
  updatedAt: string;
}

interface UserPlugin {
  pluginId: string;
  allowed: boolean;
  config?: Record<string, any>;
}

interface AvailablePlugin {
  id: string;
  name: string;
  type: string;
  version: string;
  config?: Record<string, any>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [managingPluginsUser, setManagingPluginsUser] = useState<User | null>(null);
  const [userPlugins, setUserPlugins] = useState<UserPlugin[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>([]);
  const [isPluginsDialogOpen, setIsPluginsDialogOpen] = useState(false);
  const [savingPlugins, setSavingPlugins] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
      console.error('Error loading available plugins:', err);
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
      setUserPlugins(data.plugins || []);
    } catch (err) {
      console.error('Error loading user plugins:', err);
      toast.error('Erro ao carregar plugins do usuário');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      // Preparar dados para atualização
      const updateData: any = {
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      };

      // Adicionar campos opcionais se fornecidos
      if (editingUser.name !== undefined) updateData.name = editingUser.name;
      if (editingUser.phone !== undefined) updateData.phone = editingUser.phone;

      const res = await fetch(`http://localhost:8080/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) throw new Error('Failed to update user');

      toast.success('Usuário atualizado com sucesso');
      setIsDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      toast.error('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setTogglingStatus(userId);
      const token = localStorage.getItem('accessToken');
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const res = await fetch(`http://localhost:8080/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update user status');

      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      loadUsers();
    } catch (err) {
      toast.error('Erro ao alterar status do usuário');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleManageUserPlugins = async (user: User) => {
    setManagingPluginsUser(user);
    await loadAvailablePlugins();
    await loadUserPlugins(user.id);
    setIsPluginsDialogOpen(true);
  };

  const handleSaveUserPlugins = async () => {
    if (!managingPluginsUser) return;

    try {
      setSavingPlugins(true);
      const token = localStorage.getItem('accessToken');
      const allowedPlugins = userPlugins
        .filter(up => up.allowed)
        .map(up => up.pluginId);

      const res = await fetch(`http://localhost:8080/api/admin/plugin-access/users/${managingPluginsUser.id}/plugins`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allowedPlugins })
      });

      if (!res.ok) throw new Error('Failed to update user plugins');

      toast.success('Plugins do usuário atualizados com sucesso');
      setIsPluginsDialogOpen(false);
      setManagingPluginsUser(null);
      setUserPlugins([]);
    } catch (err) {
      toast.error('Erro ao atualizar plugins do usuário');
    } finally {
      setSavingPlugins(false);
    }
  };

  const handleToggleUserPlugin = (pluginId: string, allowed: boolean) => {
    setUserPlugins(prev =>
      prev.map(up =>
        up.pluginId === pluginId
          ? { ...up, allowed }
          : up
      )
    );
  };

  const formatIdentifier = (identifier: string) => {
    // Verificar se identifier é válido
    if (!identifier || typeof identifier !== 'string') {
      return '-';
    }

    // Formatar CPF/CNPJ
    const clean = identifier.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return identifier;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar usuários: {error}</p>
        <Button onClick={loadUsers} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários do sistema frontend-app
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificador</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Plugins</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono">
                    {formatIdentifier(user.identifier)}
                  </TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.tenantId}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageUserPlugins(user)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          disabled={togglingStatus === user.id}
                        >
                          {togglingStatus === user.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : user.status === 'active' ? (
                            <PowerOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Power className="h-4 w-4 mr-2" />
                          )}
                          {user.status === 'active' ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de gerenciamento de plugins */}
      <Dialog open={isPluginsDialogOpen} onOpenChange={setIsPluginsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Plugins - {managingPluginsUser?.identifier}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availablePlugins.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum plugin disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availablePlugins.map((plugin) => {
                  const userPlugin = userPlugins.find(up => up.pluginId === plugin.id);
                  const isAllowed = userPlugin?.allowed || false;

                  return (
                    <div key={plugin.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{plugin.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Tipo: {plugin.type} | Versão: {plugin.version}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={isAllowed ? 'default' : 'secondary'}>
                          {isAllowed ? 'Permitido' : 'Bloqueado'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserPlugin(plugin.id, !isAllowed)}
                        >
                          {isAllowed ? 'Bloquear' : 'Permitir'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsPluginsDialogOpen(false)}
                disabled={savingPlugins}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveUserPlugins} disabled={savingPlugins}>
                {savingPlugins ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="identifier">Identificador (CPF/CNPJ)</Label>
                <Input
                  id="identifier"
                  value={formatIdentifier(editingUser.identifier)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Nome completo"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Função</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value) => setEditingUser({ ...editingUser, status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveUser} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}