import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings as SettingsIcon,
  CreditCard,
  Mail,
  Server,
  Gauge,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  billing: {
    minCreditPurchase: number;
    maxCreditPurchase: number;
    creditValue: number;
    retentionDays: number;
  };
  email: {
    fromEmail: string;
    replyToEmail: string;
    supportEmail: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  rates: {
    defaultRateLimit: number;
    fallbackCostMultiplier: number;
  };
}

interface SettingsStatus {
  lastUpdated: string | null;
  isValid: boolean;
  hasChanges: boolean;
}

// Página de configurações do sistema melhorada (TASK-016)
const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    billing: { minCreditPurchase: 1, maxCreditPurchase: 1000, creditValue: 1.0, retentionDays: 365 },
    email: { fromEmail: '', replyToEmail: '', supportEmail: '' },
    smtp: { host: '', port: 587, secure: false, user: '', pass: '' },
    rates: { defaultRateLimit: 100, fallbackCostMultiplier: 1.5 },
  });

  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);
  const [status, setStatus] = useState<SettingsStatus>({
    lastUpdated: null,
    isValid: true,
    hasChanges: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check for changes
    const hasChanges = originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setStatus(prev => ({ ...prev, hasChanges: !!hasChanges }));

    // Validate settings
    const isValid = validate();
    setStatus(prev => ({ ...prev, isValid }));
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
        setStatus(prev => ({ ...prev, lastUpdated: new Date().toISOString() }));
        toast.success('Configurações carregadas com sucesso');
      } else {
        toast.error('Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Billing validation
    if (settings.billing.minCreditPurchase >= settings.billing.maxCreditPurchase) {
      newErrors.minCreditPurchase = 'Valor mínimo deve ser menor que o máximo';
    }
    if (settings.billing.minCreditPurchase < 0) {
      newErrors.minCreditPurchase = 'Valor mínimo deve ser positivo';
    }
    if (settings.billing.maxCreditPurchase <= 0) {
      newErrors.maxCreditPurchase = 'Valor máximo deve ser positivo';
    }
    if (settings.billing.creditValue <= 0) {
      newErrors.creditValue = 'Valor do crédito deve ser positivo';
    }
    if (settings.billing.retentionDays < 1) {
      newErrors.retentionDays = 'Dias de retenção deve ser pelo menos 1';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.email.fromEmail && !emailRegex.test(settings.email.fromEmail)) {
      newErrors.fromEmail = 'Email de remetente inválido';
    }
    if (settings.email.replyToEmail && !emailRegex.test(settings.email.replyToEmail)) {
      newErrors.replyToEmail = 'Email de resposta inválido';
    }
    if (settings.email.supportEmail && !emailRegex.test(settings.email.supportEmail)) {
      newErrors.supportEmail = 'Email de suporte inválido';
    }

    // SMTP validation
    if (settings.smtp.host && !settings.smtp.host.trim()) {
      newErrors.smtpHost = 'Host SMTP é obrigatório';
    }
    if (settings.smtp.port < 1 || settings.smtp.port > 65535) {
      newErrors.smtpPort = 'Porta SMTP deve estar entre 1 e 65535';
    }
    if (settings.smtp.user && !settings.smtp.user.trim()) {
      newErrors.smtpUser = 'Usuário SMTP é obrigatório';
    }
    if (settings.smtp.pass && !settings.smtp.pass.trim()) {
      newErrors.smtpPass = 'Senha SMTP é obrigatória';
    }

    // Rates validation
    if (settings.rates.defaultRateLimit < 1) {
      newErrors.defaultRateLimit = 'Rate limit deve ser pelo menos 1';
    }
    if (settings.rates.fallbackCostMultiplier <= 0) {
      newErrors.fallbackCostMultiplier = 'Multiplicador deve ser positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!status.isValid) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setSaving(true);
    setAuditId(null);

    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const result = await response.json();
        setAuditId(result.auditId);
        setOriginalSettings(settings);
        setStatus(prev => ({
          ...prev,
          lastUpdated: new Date().toISOString(),
          hasChanges: false
        }));
        toast.success('Configurações salvas com sucesso!');
      } else {
        const error = await response.json();
        toast.error(`Erro ao salvar: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setStatus(prev => ({ ...prev, hasChanges: false }));
      toast.info('Configurações restauradas');
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Carregando configurações...</span>
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
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações globais da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!status.hasChanges || saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!status.hasChanges || !status.isValid || saving}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status das Configurações</CardTitle>
            {status.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.isValid ? 'Válidas' : 'Com Erros'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(errors).length} erro(s) encontrado(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alterações Pendentes</CardTitle>
            <SettingsIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status.hasChanges ? 'Sim' : 'Não'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status.hasChanges ? 'Alterações não salvas' : 'Tudo sincronizado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {status.lastUpdated
                ? new Date(status.lastUpdated).toLocaleString('pt-BR')
                : 'Nunca'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {auditId ? `Audit: ${auditId.substring(0, 8)}...` : 'Sem auditoria'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Alert */}
      {!status.isValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem erros de validação que precisam ser corrigidos antes de salvar as configurações.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="billing" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="smtp" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                SMTP
              </TabsTrigger>
              <TabsTrigger value="rates" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Rates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Limites de Compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="minCreditPurchase">Compra Mínima de Créditos</Label>
                      <Input
                        id="minCreditPurchase"
                        type="number"
                        min="0"
                        value={settings.billing.minCreditPurchase}
                        onChange={(e) => updateSettings('billing.minCreditPurchase', Number(e.target.value))}
                        className={errors.minCreditPurchase ? 'border-red-500' : ''}
                      />
                      {errors.minCreditPurchase && (
                        <p className="text-sm text-red-500 mt-1">{errors.minCreditPurchase}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="maxCreditPurchase">Compra Máxima de Créditos</Label>
                      <Input
                        id="maxCreditPurchase"
                        type="number"
                        min="1"
                        value={settings.billing.maxCreditPurchase}
                        onChange={(e) => updateSettings('billing.maxCreditPurchase', Number(e.target.value))}
                        className={errors.maxCreditPurchase ? 'border-red-500' : ''}
                      />
                      {errors.maxCreditPurchase && (
                        <p className="text-sm text-red-500 mt-1">{errors.maxCreditPurchase}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valores e Retenção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="creditValue">Valor por Crédito</Label>
                      <Input
                        id="creditValue"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={settings.billing.creditValue}
                        onChange={(e) => updateSettings('billing.creditValue', Number(e.target.value))}
                        className={errors.creditValue ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(settings.billing.creditValue)} por crédito
                      </p>
                      {errors.creditValue && (
                        <p className="text-sm text-red-500 mt-1">{errors.creditValue}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="retentionDays">Dias de Retenção</Label>
                      <Input
                        id="retentionDays"
                        type="number"
                        min="1"
                        value={settings.billing.retentionDays}
                        onChange={(e) => updateSettings('billing.retentionDays', Number(e.target.value))}
                        className={errors.retentionDays ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Dados mantidos por {settings.billing.retentionDays} dias
                      </p>
                      {errors.retentionDays && (
                        <p className="text-sm text-red-500 mt-1">{errors.retentionDays}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações de Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fromEmail">Email de Remetente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="noreply@bigtech.com.br"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSettings('email.fromEmail', e.target.value)}
                      className={errors.fromEmail ? 'border-red-500' : ''}
                    />
                    {errors.fromEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.fromEmail}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="replyToEmail">Email de Resposta</Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      placeholder="support@bigtech.com.br"
                      value={settings.email.replyToEmail}
                      onChange={(e) => updateSettings('email.replyToEmail', e.target.value)}
                      className={errors.replyToEmail ? 'border-red-500' : ''}
                    />
                    {errors.replyToEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.replyToEmail}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Email de Suporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      placeholder="help@bigtech.com.br"
                      value={settings.email.supportEmail}
                      onChange={(e) => updateSettings('email.supportEmail', e.target.value)}
                      className={errors.supportEmail ? 'border-red-500' : ''}
                    />
                    {errors.supportEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.supportEmail}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações de SMTP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">Host</Label>
                      <Input
                        id="smtpHost"
                        placeholder="smtp.gmail.com"
                        value={settings.smtp.host}
                        onChange={(e) => updateSettings('smtp.host', e.target.value)}
                        className={errors.smtpHost ? 'border-red-500' : ''}
                      />
                      {errors.smtpHost && (
                        <p className="text-sm text-red-500 mt-1">{errors.smtpHost}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">Porta</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        min="1"
                        max="65535"
                        value={settings.smtp.port}
                        onChange={(e) => updateSettings('smtp.port', Number(e.target.value))}
                        className={errors.smtpPort ? 'border-red-500' : ''}
                      />
                      {errors.smtpPort && (
                        <p className="text-sm text-red-500 mt-1">{errors.smtpPort}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.smtp.secure}
                      onCheckedChange={(checked) => updateSettings('smtp.secure', checked)}
                    />
                    <Label htmlFor="smtpSecure">Conexão Segura (SSL/TLS)</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">Usuário</Label>
                      <Input
                        id="smtpUser"
                        placeholder="seu-email@gmail.com"
                        value={settings.smtp.user}
                        onChange={(e) => updateSettings('smtp.user', e.target.value)}
                        className={errors.smtpUser ? 'border-red-500' : ''}
                      />
                      {errors.smtpUser && (
                        <p className="text-sm text-red-500 mt-1">{errors.smtpUser}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="smtpPass">Senha</Label>
                      <Input
                        id="smtpPass"
                        type="password"
                        placeholder="••••••••"
                        value={settings.smtp.pass}
                        onChange={(e) => updateSettings('smtp.pass', e.target.value)}
                        className={errors.smtpPass ? 'border-red-500' : ''}
                      />
                      {errors.smtpPass && (
                        <p className="text-sm text-red-500 mt-1">{errors.smtpPass}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações de Rate Limiting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="defaultRateLimit">Rate Limit Padrão</Label>
                    <Input
                      id="defaultRateLimit"
                      type="number"
                      min="1"
                      value={settings.rates.defaultRateLimit}
                      onChange={(e) => updateSettings('rates.defaultRateLimit', Number(e.target.value))}
                      className={errors.defaultRateLimit ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Consultas por hora por usuário
                    </p>
                    {errors.defaultRateLimit && (
                      <p className="text-sm text-red-500 mt-1">{errors.defaultRateLimit}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="fallbackCostMultiplier">Multiplicador de Custo Fallback</Label>
                    <Input
                      id="fallbackCostMultiplier"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={settings.rates.fallbackCostMultiplier}
                      onChange={(e) => updateSettings('rates.fallbackCostMultiplier', Number(e.target.value))}
                      className={errors.fallbackCostMultiplier ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Multiplicador aplicado quando API principal falha
                    </p>
                    {errors.fallbackCostMultiplier && (
                      <p className="text-sm text-red-500 mt-1">{errors.fallbackCostMultiplier}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Success Alert */}
      {auditId && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configurações salvas com sucesso! Audit ID: {auditId}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SettingsPage;