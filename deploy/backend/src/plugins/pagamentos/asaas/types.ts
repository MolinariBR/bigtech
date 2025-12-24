// Baseado em: 2.Architecture.md v1.0.2, 3.Structure.md v1.1, 4.Entities.md v1.2
// Precedência: 1.Project → 2.Architecture → 3.Structure → 4.Entities
// Decisão: Tipos específicos do plugin Asaas para manter consistência arquitetural

// Interfaces do contrato de plugin (genéricas)
export interface Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(tenantId: string): Promise<void>;
  disable(tenantId: string): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
}

export interface PluginContext {
  tenantId: string;
  userId: string;
  input: any;
  config: any;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  cost?: number;
}

// Interfaces específicas do plugin Asaas
export interface PaymentContext {
  tenantId: string;
  userId: string;
  amount: number;
  creditAmount: number;
  creditValue: number;
  paymentMethod: 'pix' | 'boleto' | 'credit_card';
  customerDocument: string;
  customerName: string;
  customerEmail: string;
}

export interface AsaasPaymentResponse {
  id: string;
  status: string;
  qrCode?: string;
  encodedImage?: string;
  payload?: string;
  netValue?: number;
  billingType: string;
  dueDate?: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  externalReference?: string;
  notificationsDisabled: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  company?: string;
}

export interface AsaasWebhookData {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    billingType: string;
    status: string;
    dueDate: string;
    description: string;
    externalReference: string;
    installmentNumber?: number;
    installmentCount?: number;
  };
  customer: {
    id: string;
    name: string;
    cpfCnpj: string;
    email: string;
  };
}

// Tipos para métodos de pagamento suportados
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

// Mapeamento de status Asaas para status interno
export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

// Eventos de webhook suportados
export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED';