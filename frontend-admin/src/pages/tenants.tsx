// Página de gestão de tenants (TASK-TENANT-001)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Power, PowerOff, Puzzle, CreditCard, Trash2, MoreHorizontal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  plugins: string[];
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<string | null>(null);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/admin/tenants');
      if (!res.ok) throw new Error('Failed to load tenants');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreate = () => {
    setEditingTenant({ id: '', name: '', status: 'active', plugins: [], createdAt: new Date().toISOString().split('T')[0] });
    setIsDialogOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTenant) return;

    // Validação básica
    if (!editingTenant.name.trim()) {
      toast.error('Nome do tenant é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const method = editingTenant.id ? 'PUT' : 'POST';
      const url = editingTenant.id ? `http://localhost:8080/api/admin/tenants/${editingTenant.id}` : 'http://localhost:8080/api/admin/tenants';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTenant),
      });
      if (!res.ok) throw new Error('Failed to save tenant');

      await loadTenants();
      setIsDialogOpen(false);
      setEditingTenant(null);
      toast.success(editingTenant.id ? 'Tenant atualizado com sucesso!' : 'Tenant criado com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar tenant');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;

    setTogglingStatus(id);
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`http://localhost:8080/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tenant, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update tenant');

      await loadTenants();
      toast.success(`Tenant ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      toast.error('Erro ao alterar status do tenant');
      console.error(err);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingTenant(id);
    try {
      const res = await fetch(`http://localhost:8080/api/admin/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tenant');

      await loadTenants();
      toast.success('Tenant excluído com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir tenant');
      console.error(err);
    } finally {
      setDeletingTenant(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Carregando tenants...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold text-destructive">Erro ao carregar tenants</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadTenants} variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie organizações e seus respectivos tenants
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Criar Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Inativos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => t.status === 'inactive').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Lista de Tenants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum tenant encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro tenant para organizar usuários e recursos.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Tenant
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nome</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[200px]">Plugins</TableHead>
                    <TableHead className="w-[150px]">Criado em</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tenant.status === 'active' ? 'default' : 'secondary'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {tenant.status === 'active' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tenant.plugins.length > 0 ? (
                            tenant.plugins.slice(0, 2).map((plugin, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {plugin}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Nenhum</span>
                          )}
                          {tenant.plugins.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tenant.plugins.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
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
                            <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(tenant.id)}
                              disabled={togglingStatus === tenant.id}
                            >
                              {togglingStatus === tenant.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : tenant.status === 'active' ? (
                                <PowerOff className="mr-2 h-4 w-4" />
                              ) : (
                                <Power className="mr-2 h-4 w-4" />
                              )}
                              {tenant.status === 'active' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/plugins?tenantId=${tenant.id}`} className="flex items-center">
                                <Puzzle className="mr-2 h-4 w-4" />
                                Plugins
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/billing?tenantId=${tenant.id}`} className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Billing
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Tenant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o tenant "{tenant.name}"?
                                    Esta ação não pode ser desfeita e todos os dados associados
                                    serão permanentemente removidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(tenant.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deletingTenant === tenant.id}
                                  >
                                    {deletingTenant === tenant.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Excluindo...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
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

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTenant?.id ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editar Tenant
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Criar Tenant
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {editingTenant && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Tenant</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome do tenant"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className={editingTenant.name.trim() ? '' : 'border-destructive'}
                />
                {!editingTenant.name.trim() && (
                  <p className="text-sm text-destructive">Nome é obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingTenant.status}
                  onValueChange={(value: 'active' | 'inactive') => setEditingTenant({ ...editingTenant, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Ativo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        Inativo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plugins">Plugins (separados por vírgula)</Label>
                <Input
                  id="plugins"
                  placeholder="plugin1, plugin2, plugin3"
                  value={editingTenant.plugins.join(', ')}
                  onChange={(e) => setEditingTenant({
                    ...editingTenant,
                    plugins: e.target.value.split(', ').filter(p => p.trim())
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Digite os nomes dos plugins separados por vírgula
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
              disabled={saving || !editingTenant?.name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}