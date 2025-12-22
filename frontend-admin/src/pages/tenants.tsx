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
import Link from 'next/link';

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

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenants');
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
    try {
      const method = editingTenant.id ? 'PUT' : 'POST';
      const url = editingTenant.id ? `/api/admin/tenants/${editingTenant.id}` : '/api/admin/tenants';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTenant),
      });
      if (!res.ok) throw new Error('Failed to save tenant');
      await loadTenants();
      setIsDialogOpen(false);
      setEditingTenant(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tenant, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update tenant');
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tenant');
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Tenants</h1>
        <Button onClick={handleCreate}>Criar Tenant</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhum tenant encontrado. Clique em "Criar Tenant" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plugins</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.plugins.join(', ')}</TableCell>
                    <TableCell>{tenant.createdAt}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tenant)}>Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleStatus(tenant.id)}>
                        {tenant.status === 'active' ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Link href={`/plugins?tenant=${tenant.id}`}>
                        <Button variant="outline" size="sm">Plugins</Button>
                      </Link>
                      <Link href={`/billing?tenant=${tenant.id}`}>
                        <Button variant="outline" size="sm">Billing</Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(tenant.id)}>Excluir</Button>
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
            <DialogTitle>{editingTenant?.id ? 'Editar Tenant' : 'Criar Tenant'}</DialogTitle>
          </DialogHeader>
          {editingTenant && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editingTenant.status} onValueChange={(value: 'active' | 'inactive') => setEditingTenant({ ...editingTenant, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plugins">Plugins (separados por vírgula)</Label>
                <Input
                  id="plugins"
                  value={editingTenant.plugins.join(', ')}
                  onChange={(e) => setEditingTenant({ ...editingTenant, plugins: e.target.value.split(', ').filter(p => p) })}
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