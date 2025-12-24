// Baseado em: 5.Pages.md v1.4, 4.Entities.md v1.5
// Dashboard Administrativo: Exibe métricas globais e gráficos de uso (5.3.6)
// Agregação de dados por tenant (4.5)
// Relacionado: 2.Architecture.md (Appwrite para dados), 9.DesignSystem.md (componentes)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Database,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Metrics {
  activeTenants: number;
  totalConsumption: number;
  totalUsers: number;
  totalQueries: number;
  systemHealth: number;
  avgResponseTime: number;
  errorRate: number;
  revenueToday: number;
  revenueThisMonth: number;
  newTenantsToday: number;
  activePlugins: number;
  totalCreditsSold: number;
}

interface AlertItem {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: string;
  tenant?: string;
  severity: 'low' | 'medium' | 'high';
}

interface ChartData {
  name: string;
  consumption: number;
  queries: number;
  revenue: number;
  tenants: number;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  plugins: 'healthy' | 'warning' | 'error';
  billing: 'healthy' | 'warning' | 'error';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    activeTenants: 0,
    totalConsumption: 0,
    totalUsers: 0,
    totalQueries: 0,
    systemHealth: 0,
    avgResponseTime: 0,
    errorRate: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    newTenantsToday: 0,
    activePlugins: 0,
    totalCreditsSold: 0,
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    api: 'healthy',
    plugins: 'healthy',
    billing: 'healthy',
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authChecking) {
      fetchDashboardData();
    }
  }, [authChecking]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch metrics from API
      const metricsResponse = await fetch('/api/admin/dashboard/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch alerts from API
      const alertsResponse = await fetch('/api/admin/dashboard/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }

      // Fetch chart data from API
      const chartResponse = await fetch('/api/admin/dashboard/charts');
      if (chartResponse.ok) {
        const chartData = await chartResponse.json();
        setChartData(chartData);
      }

      // Fetch system status
      const statusResponse = await fetch('/api/admin/dashboard/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemStatus(statusData);
      }

      setLastUpdate(new Date().toISOString());
      toast.success('Dashboard atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      // Fallback to mock data
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setMetrics({
      activeTenants: 15,
      totalConsumption: 1250.5,
      totalUsers: 120,
      totalQueries: 450,
      systemHealth: 98.5,
      avgResponseTime: 245,
      errorRate: 0.8,
      revenueToday: 1250.50,
      revenueThisMonth: 18500.75,
      newTenantsToday: 2,
      activePlugins: 8,
      totalCreditsSold: 1250,
    });

    setAlerts([
      {
        id: '1',
        message: 'Tenant XYZ excedeu limite de consultas (85% do limite)',
        type: 'warning',
        timestamp: new Date().toISOString(),
        tenant: 'XYZ Corp',
        severity: 'medium'
      },
      {
        id: '2',
        message: 'Plugin InfoSimples temporariamente indisponível',
        type: 'error',
        timestamp: new Date().toISOString(),
        severity: 'high'
      },
      {
        id: '3',
        message: 'Novo tenant registrado: ABC Solutions',
        type: 'info',
        timestamp: new Date().toISOString(),
        tenant: 'ABC Solutions',
        severity: 'low'
      },
    ]);

    setChartData([
      { name: 'Jan', consumption: 1200, queries: 4500, revenue: 18500, tenants: 12 },
      { name: 'Fev', consumption: 1350, queries: 5200, revenue: 22100, tenants: 14 },
      { name: 'Mar', consumption: 1180, queries: 4800, revenue: 19800, tenants: 13 },
      { name: 'Abr', consumption: 1420, queries: 6100, revenue: 24500, tenants: 15 },
      { name: 'Mai', consumption: 1680, queries: 7200, revenue: 28900, tenants: 16 },
      { name: 'Jun', consumption: 1520, queries: 6800, revenue: 26700, tenants: 15 },
    ]);

    setSystemStatus({
      database: 'healthy',
      api: 'healthy',
      plugins: 'warning',
      billing: 'healthy',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Carregando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema e métricas de performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {lastUpdate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Atualizado: {new Date(lastUpdate).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Database:</span>
              <span className={`flex items-center gap-1 ${getStatusColor(systemStatus.database)}`}>
                {getStatusIcon(systemStatus.database)}
                {systemStatus.database === 'healthy' ? 'Saudável' :
                 systemStatus.database === 'warning' ? 'Atenção' : 'Erro'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">API:</span>
              <span className={`flex items-center gap-1 ${getStatusColor(systemStatus.api)}`}>
                {getStatusIcon(systemStatus.api)}
                {systemStatus.api === 'healthy' ? 'Saudável' :
                 systemStatus.api === 'warning' ? 'Atenção' : 'Erro'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Plugins:</span>
              <span className={`flex items-center gap-1 ${getStatusColor(systemStatus.plugins)}`}>
                {getStatusIcon(systemStatus.plugins)}
                {systemStatus.plugins === 'healthy' ? 'Saudável' :
                 systemStatus.plugins === 'warning' ? 'Atenção' : 'Erro'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Billing:</span>
              <span className={`flex items-center gap-1 ${getStatusColor(systemStatus.billing)}`}>
                {getStatusIcon(systemStatus.billing)}
                {systemStatus.billing === 'healthy' ? 'Saudável' :
                 systemStatus.billing === 'warning' ? 'Atenção' : 'Erro'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Saúde Geral do Sistema</span>
              <span>{metrics.systemHealth}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.systemHealth >= 95 ? 'bg-green-600' :
                  metrics.systemHealth >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${metrics.systemHealth}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeTenants)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +{metrics.newTenantsToday} hoje
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenueToday)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12% vs ontem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalQueries)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +8% vs ontem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
              -5% vs ontem
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Meta: {formatCurrency(25000)} ({((metrics.revenueThisMonth / 25000) * 100).toFixed(1)}%)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.revenueThisMonth / 25000) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plugins Ativos</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activePlugins}</div>
            <p className="text-xs text-muted-foreground">
              De 12 plugins disponíveis
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.activePlugins / 12) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: &lt; 1% ({metrics.errorRate < 1 ? '✓' : '✗'})
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.errorRate < 1 ? 'bg-green-600' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(metrics.errorRate * 10, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/tenants">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Gerenciar Tenants</span>
              </Button>
            </Link>
            <Link href="/plugins">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Settings className="h-6 w-6" />
                <span className="text-sm">Gerenciar Plugins</span>
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Monitorar Billing</span>
              </Button>
            </Link>
            <Link href="/audit">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Shield className="h-6 w-6" />
                <span className="text-sm">Ver Auditoria</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Receita e Consultas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
                    name === 'revenue' ? 'Receita' : 'Consultas'
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="queries"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição de Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ativos', value: metrics.activeTenants, color: '#00C49F' },
                    { name: 'Inativos', value: 5, color: '#FF8042' },
                    { name: 'Trial', value: 3, color: '#FFBB28' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Ativos', value: metrics.activeTenants, color: '#00C49F' },
                    { name: 'Inativos', value: 5, color: '#FF8042' },
                    { name: 'Trial', value: 3, color: '#FFBB28' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendência de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Consumo']} />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.slice(0, 5).map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertDescription className="font-medium">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(alert.timestamp).toLocaleString('pt-BR')}</span>
                        {alert.tenant && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.tenant}
                            </Badge>
                          </>
                        )}
                        <Badge
                          variant={alert.severity === 'high' ? 'destructive' :
                                  alert.severity === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.severity === 'high' ? 'Alta' :
                           alert.severity === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p>Nenhum alerta ativo no momento</p>
              </div>
            )}
          </div>
          {alerts.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/audit">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos os Alertas
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}