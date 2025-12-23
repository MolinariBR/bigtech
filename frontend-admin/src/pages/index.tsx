// Baseado em: 5.Pages.md v1.4, 4.Entities.md v1.5
// Dashboard Administrativo: Exibe métricas globais e gráficos de uso (5.3.6)
// Agregação de dados por tenant (4.5)
// Relacionado: 2.Architecture.md (Appwrite para dados), 9.DesignSystem.md (componentes)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, DollarSign, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';

interface Metrics {
  activeTenants: number;
  totalConsumption: number;
  totalUsers: number;
  totalQueries: number;
}

interface AlertItem {
  id: string;
  message: string;
  type: 'error' | 'warning';
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    activeTenants: 0,
    totalConsumption: 0,
    totalUsers: 0,
    totalQueries: 0,
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chartData, setChartData] = useState([]);
  // Mock data para MVP - substituir por Appwrite queries reais
  useEffect(() => {
    // Simular agregação de dados (4.5)
    setMetrics({
      activeTenants: 15,
      totalConsumption: 1250.5,
      totalUsers: 120,
      totalQueries: 450,
    });

    // Mock alerts
    setAlerts([
      { id: '1', message: 'Tenant XYZ excedeu limite de consultas', type: 'warning' },
      { id: '2', message: 'Falha no plugin de pagamento Asaas', type: 'error' },
    ]);

    // Mock chart data
    setChartData([
      { name: 'Jan', consumption: 200 },
      { name: 'Feb', consumption: 300 },
      { name: 'Mar', consumption: 250 },
      { name: 'Apr', consumption: 400 },
    ]);

    // Polling para atualização automática (SWR-like)
    const interval = setInterval(() => {
      // Atualizar dados periodicamente
      console.log('Atualizando métricas...');
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, []);

  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthChecking(false);
  }, [router]);

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
      </div>

      {/* Métricas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.totalConsumption.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Executadas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumo por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumption" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tenants Ativos ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="consumption" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Alertas em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Links para Gestão */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/tenants">
            <Button variant="outline" className="w-full">
              Gerenciar Tenants
            </Button>
          </Link>
          <Link href="/plugins">
            <Button variant="outline" className="w-full">
              Gerenciar Plugins
            </Button>
          </Link>
          <Link href="/billing">
            <Button variant="outline" className="w-full">
              Monitorar Billing
            </Button>
          </Link>
          <Link href="/audit">
            <Button variant="outline" className="w-full">
              Ver Auditoria
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}