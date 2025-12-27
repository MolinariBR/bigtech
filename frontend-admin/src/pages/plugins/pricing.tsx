// TASK-007: Página dedicada para configuração de preços por serviço nos plugins de consulta
// Baseado em: 1.Project.md v1.0, 2.Architecture.md v1.0.1, 4.Entities.md v1.7, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  customPrice?: number;
  isCustomPrice: boolean;
}

interface Plugin {
  id: string;
  name: string;
  type: string;
  version: string;
}

export default function PluginPricingPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Para desenvolvimento, usar tenant fixo
  const tenantId = 'demo-tenant';

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar plugins disponíveis do tipo consulta
      const res = await fetch('http://localhost:8080/api/admin/plugin-access/plugins/available');
      if (!res.ok) throw new Error('Failed to load available plugins');
      const data = await res.json();

      // Filtrar apenas plugins de consulta
      const consultaPlugins = data.plugins.filter((p: Plugin) => p.type === 'consulta');
      setPlugins(consultaPlugins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (pluginId: string) => {
    try {
      setLoadingServices(true);
      const res = await fetch(`http://localhost:8080/api/admin/plugins/${pluginId}/services?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('Failed to load services');
      const data = await res.json();

      setServices(data.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
      setServices([]);
      toast.error('Erro ao carregar serviços do plugin');
    } finally {
      setLoadingServices(false);
    }
  };

  const handlePluginChange = (pluginId: string) => {
    setSelectedPlugin(pluginId);
    if (pluginId) {
      loadServices(pluginId);
    } else {
      setServices([]);
    }
  };

  const handlePriceChange = (serviceId: string, price: number) => {
    setServices(prev => prev.map(service =>
      service.id === serviceId
        ? { ...service, customPrice: price, isCustomPrice: price > 0 }
        : service
    ));
  };

  const handleSavePrices = async () => {
    if (!selectedPlugin) return;

    try {
      setSaving(true);

      // Prepare servicePrices object
      const servicePrices: { [key: string]: number } = {};
      services.forEach(service => {
        if (service.customPrice && service.customPrice > 0) {
          servicePrices[service.id] = service.customPrice;
        }
      });

      const res = await fetch(`http://localhost:8080/api/admin/plugins/${selectedPlugin}/config?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicePrices
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save prices');
      }

      toast.success('Preços salvos com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar preços');
    } finally {
      setSaving(false);
    }
  };

  const getTotalCustomPrices = () => {
    return services.filter(s => s.customPrice && s.customPrice > 0).length;
  };

  const getTotalRevenue = () => {
    return services.reduce((total, service) => {
      const price = service.customPrice || service.defaultPrice || 0;
      return total + price;
    }, 0);
  };

  useEffect(() => {
    loadPlugins();
  }, []);

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
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold text-destructive">Erro ao carregar plugins</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadPlugins} variant="outline">
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
          <h1 className="text-3xl font-bold tracking-tight">Configuração de Preços</h1>
          <p className="text-muted-foreground mt-1">
            Configure preços personalizados por serviço nos plugins de consulta
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins Disponíveis</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Configurados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCustomPrices()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {getTotalRevenue().toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plugin Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Selecionar Plugin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plugin-select">Plugin de Consulta</Label>
              <Select value={selectedPlugin} onValueChange={handlePluginChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plugin para configurar preços" />
                </SelectTrigger>
                <SelectContent>
                  {plugins.map((plugin) => (
                    <SelectItem key={plugin.id} value={plugin.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{plugin.name}</span>
                        <Badge variant="outline" className="ml-2">
                          v{plugin.version}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecione o plugin de consulta para visualizar e configurar os preços dos serviços
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Configuration */}
      {selectedPlugin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Serviços do Plugin</span>
              <Button
                onClick={handleSavePrices}
                disabled={saving || services.length === 0}
                className="ml-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preços
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingServices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando serviços...</span>
              </div>
            ) : services.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Serviço</TableHead>
                        <TableHead className="w-[150px]">Categoria</TableHead>
                        <TableHead className="w-[150px]">Preço Padrão (R$)</TableHead>
                        <TableHead className="w-[200px]">Preço Personalizado (R$)</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {service.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {service.defaultPrice?.toFixed(2) || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={service.customPrice || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handlePriceChange(service.id, value);
                              }}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            {service.isCustomPrice ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Personalizado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Padrão
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {getTotalCustomPrices()} de {services.length} serviços com preços personalizados
                  </div>
                  <div className="text-sm font-medium">
                    Receita Total: R$ {getTotalRevenue().toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Este plugin não possui serviços configurados ou disponíveis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!selectedPlugin && (
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>1.</strong> Selecione um plugin de consulta na lista acima para visualizar seus serviços.
              </p>
              <p>
                <strong>2.</strong> Para cada serviço, você pode definir um preço personalizado ou manter o preço padrão.
              </p>
              <p>
                <strong>3.</strong> Preços personalizados têm prioridade sobre os preços padrão do plugin.
              </p>
              <p>
                <strong>4.</strong> Clique em &quot;Salvar Preços&quot; para persistir as alterações no sistema.
              </p>
              <p>
                <strong>5.</strong> As configurações são salvas por tenant e afetam apenas este ambiente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}