import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

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

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    billing: { minCreditPurchase: 1, maxCreditPurchase: 1000, creditValue: 1.0, retentionDays: 365 },
    email: { fromEmail: '', replyToEmail: '', supportEmail: '' },
    smtp: { host: '', port: 587, secure: false, user: '', pass: '' },
    rates: { defaultRateLimit: 100, fallbackCostMultiplier: 1.5 },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (settings.billing.minCreditPurchase >= settings.billing.maxCreditPurchase) {
      newErrors.minCreditPurchase = 'Mínimo deve ser menor que máximo';
    }
    if (settings.billing.creditValue <= 0) {
      newErrors.creditValue = 'Valor deve ser positivo';
    }
    if (!settings.email.fromEmail.includes('@')) {
      newErrors.fromEmail = 'Email inválido';
    }
    if (!settings.email.replyToEmail.includes('@')) {
      newErrors.replyToEmail = 'Email inválido';
    }
    if (!settings.email.supportEmail.includes('@')) {
      newErrors.supportEmail = 'Email inválido';
    }
    if (!settings.smtp.host) {
      newErrors.smtpHost = 'Host obrigatório';
    }
    if (settings.smtp.port < 1 || settings.smtp.port > 65535) {
      newErrors.smtpPort = 'Porta inválida';
    }
    if (!settings.smtp.user) {
      newErrors.smtpUser = 'Usuário obrigatório';
    }
    if (!settings.smtp.pass) {
      newErrors.smtpPass = 'Senha obrigatória';
    }
    if (settings.rates.defaultRateLimit < 1) {
      newErrors.defaultRateLimit = 'Rate limit deve ser positivo';
    }
    if (settings.rates.fallbackCostMultiplier <= 0) {
      newErrors.fallbackCostMultiplier = 'Multiplicador deve ser positivo';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
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
        alert('Configurações salvas com sucesso');
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>
      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Compra Mínima de Créditos</Label>
                <Input
                  type="number"
                  value={settings.billing.minCreditPurchase}
                  onChange={(e) => updateSettings('billing.minCreditPurchase', Number(e.target.value))}
                />
                {errors.minCreditPurchase && <p className="text-red-500">{errors.minCreditPurchase}</p>}
              </div>
              <div>
                <Label>Compra Máxima de Créditos</Label>
                <Input
                  type="number"
                  value={settings.billing.maxCreditPurchase}
                  onChange={(e) => updateSettings('billing.maxCreditPurchase', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Valor por Crédito (BRL)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.billing.creditValue}
                  onChange={(e) => updateSettings('billing.creditValue', Number(e.target.value))}
                />
                {errors.creditValue && <p className="text-red-500">{errors.creditValue}</p>}
              </div>
              <div>
                <Label>Dias de Retenção</Label>
                <Input
                  type="number"
                  value={settings.billing.retentionDays}
                  onChange={(e) => updateSettings('billing.retentionDays', Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>From Email</Label>
                <Input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => updateSettings('email.fromEmail', e.target.value)}
                />
                {errors.fromEmail && <p className="text-red-500">{errors.fromEmail}</p>}
              </div>
              <div>
                <Label>Reply-To Email</Label>
                <Input
                  type="email"
                  value={settings.email.replyToEmail}
                  onChange={(e) => updateSettings('email.replyToEmail', e.target.value)}
                />
                {errors.replyToEmail && <p className="text-red-500">{errors.replyToEmail}</p>}
              </div>
              <div>
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.email.supportEmail}
                  onChange={(e) => updateSettings('email.supportEmail', e.target.value)}
                />
                {errors.supportEmail && <p className="text-red-500">{errors.supportEmail}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Host</Label>
                <Input
                  value={settings.smtp.host}
                  onChange={(e) => updateSettings('smtp.host', e.target.value)}
                />
                {errors.smtpHost && <p className="text-red-500">{errors.smtpHost}</p>}
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  value={settings.smtp.port}
                  onChange={(e) => updateSettings('smtp.port', Number(e.target.value))}
                />
                {errors.smtpPort && <p className="text-red-500">{errors.smtpPort}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.smtp.secure}
                  onCheckedChange={(checked) => updateSettings('smtp.secure', checked)}
                />
                <Label>Secure</Label>
              </div>
              <div>
                <Label>User</Label>
                <Input
                  value={settings.smtp.user}
                  onChange={(e) => updateSettings('smtp.user', e.target.value)}
                />
                {errors.smtpUser && <p className="text-red-500">{errors.smtpUser}</p>}
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={settings.smtp.pass}
                  onChange={(e) => updateSettings('smtp.pass', e.target.value)}
                />
                {errors.smtpPass && <p className="text-red-500">{errors.smtpPass}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rate Limit Padrão (consultas/hora)</Label>
                <Input
                  type="number"
                  value={settings.rates.defaultRateLimit}
                  onChange={(e) => updateSettings('rates.defaultRateLimit', Number(e.target.value))}
                />
                {errors.defaultRateLimit && <p className="text-red-500">{errors.defaultRateLimit}</p>}
              </div>
              <div>
                <Label>Multiplicador de Custo Fallback</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.rates.fallbackCostMultiplier}
                  onChange={(e) => updateSettings('rates.fallbackCostMultiplier', Number(e.target.value))}
                />
                {errors.fallbackCostMultiplier && <p className="text-red-500">{errors.fallbackCostMultiplier}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end space-x-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      {auditId && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          Configurações salvas. Audit ID: {auditId}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;