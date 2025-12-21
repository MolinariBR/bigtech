"use strict";
// Baseado em: 2.Architecture.md v1.0.2, 4.Entities.md v1.2, 7.Tasks.md v1.9
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Plugin Asaas para processamento de pagamentos conforme TASK-017
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAsaasWebhook = handleAsaasWebhook;
const axios_1 = __importDefault(require("axios"));
const appwrite_1 = require("../../lib/appwrite");
const plugin = {
    id: 'pagamento-asaas',
    type: 'pagamento',
    version: '1.0.0',
    async install() {
        console.log('Instalando plugin Asaas...');
        // Verificar dependências e configurações necessárias
        const requiredEnvVars = ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_URL'];
        const missing = requiredEnvVars.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`);
        }
        console.log('✅ Plugin Asaas instalado com sucesso');
    },
    async enable(tenantId) {
        console.log(`Habilitando plugin Asaas para tenant ${tenantId}...`);
        // Verificar se o tenant tem configurações válidas
        const appwrite = appwrite_1.AppwriteService.getInstance();
        try {
            const tenantConfig = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'tenants', tenantId);
            if (!tenantConfig.pluginConfig?.asaas) {
                throw new Error('Configuração Asaas não encontrada para o tenant');
            }
            console.log(`✅ Plugin Asaas habilitado para tenant ${tenantId}`);
        }
        catch (error) {
            console.error(`❌ Erro ao habilitar plugin Asaas para tenant ${tenantId}:`, error);
            throw error;
        }
    },
    async disable(tenantId) {
        console.log(`Desabilitando plugin Asaas para tenant ${tenantId}...`);
        // Cleanup se necessário
        console.log(`✅ Plugin Asaas desabilitado para tenant ${tenantId}`);
    },
    async execute(context) {
        try {
            const paymentContext = context.input;
            const config = this.getAsaasConfig(paymentContext.tenantId);
            // Criar ou obter cliente no Asaas
            const customerId = await this.getOrCreateCustomer(paymentContext, config);
            // Criar cobrança
            const payment = await this.createPayment(customerId, paymentContext, config);
            // Registrar transação no billing
            await this.registerBillingTransaction(paymentContext, payment);
            return {
                success: true,
                data: {
                    transactionId: payment.id,
                    status: payment.status,
                    paymentMethod: paymentContext.paymentMethod,
                    qrCode: payment.qrCode,
                    encodedImage: payment.encodedImage,
                    payload: payment.payload,
                    netValue: payment.netValue,
                    dueDate: payment.dueDate
                },
                cost: 0 // Pagamento não consome créditos
            };
        }
        catch (error) {
            console.error('Erro no processamento de pagamento Asaas:', error);
            return {
                success: false,
                error: `Falha no processamento do pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            };
        }
    }
};
// Métodos auxiliares
function getAsaasConfig(tenantId) {
    const appwrite = appwrite_1.AppwriteService.getInstance();
    // Em produção, buscar configuração do tenant
    // Por enquanto, usar variáveis de ambiente
    return {
        apiKey: process.env.ASAAS_API_KEY,
        webhookUrl: process.env.ASAAS_WEBHOOK_URL,
        environment: process.env.ASAAS_ENVIRONMENT || 'sandbox'
    };
}
async function getOrCreateCustomer(context, config) {
    const baseUrl = config.environment === 'production'
        ? 'https://www.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3';
    try {
        // Buscar cliente existente
        const searchResponse = await axios_1.default.get(`${baseUrl}/customers`, {
            params: { cpfCnpj: context.customerDocument },
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
            return searchResponse.data.data[0].id;
        }
        // Criar novo cliente
        const createResponse = await axios_1.default.post(`${baseUrl}/customers`, {
            name: context.customerName,
            cpfCnpj: context.customerDocument,
            email: context.customerEmail
        }, {
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        return createResponse.data.id;
    }
    catch (error) {
        console.error('Erro ao gerenciar cliente Asaas:', error);
        throw new Error('Falha ao processar dados do cliente');
    }
}
async function createPayment(customerId, context, config) {
    const baseUrl = config.environment === 'production'
        ? 'https://www.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3';
    const paymentData = {
        customer: customerId,
        billingType: context.paymentMethod.toUpperCase(),
        value: context.amount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vence amanhã
        description: `Compra de ${context.creditAmount} créditos - R$ ${context.creditValue.toFixed(2)} cada`,
        externalReference: `credit_purchase_${context.userId}_${Date.now()}`,
        callback: {
            successUrl: `${process.env.FRONTEND_URL}/financeiro/sucesso`,
            autoRedirect: true
        }
    };
    try {
        const response = await axios_1.default.post(`${baseUrl}/payments`, paymentData, {
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Erro ao criar pagamento Asaas:', error);
        throw new Error('Falha ao processar pagamento');
    }
}
async function registerBillingTransaction(context, payment) {
    const appwrite = appwrite_1.AppwriteService.getInstance();
    try {
        await appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'billing', 'unique()', // ID único
        {
            tenantId: context.tenantId,
            userId: context.userId,
            type: 'credit_purchase',
            amount: context.amount,
            currency: 'BRL',
            pluginId: 'pagamento-asaas',
            creditAmount: context.creditAmount,
            creditValue: context.creditValue,
            paymentMethod: context.paymentMethod,
            externalTransactionId: payment.id,
            status: 'pending',
            processedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });
        console.log(`Transação de compra de créditos registrada: ${payment.id}`);
    }
    catch (error) {
        console.error('Erro ao registrar transação no billing:', error);
        throw error;
    }
}
// Webhook handler para confirmação de pagamento
async function handleAsaasWebhook(webhookData) {
    const appwrite = appwrite_1.AppwriteService.getInstance();
    try {
        const { payment, event } = webhookData;
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            // Atualizar status da transação
            const billingRecords = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'billing', [
                appwrite.Query.equal('externalTransactionId', payment.id),
                appwrite.Query.equal('status', 'pending')
            ]);
            if (billingRecords.documents.length > 0) {
                const billingRecord = billingRecords.documents[0];
                // Atualizar status para completed
                await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'billing', billingRecord.$id, {
                    status: 'completed',
                    processedAt: new Date().toISOString()
                });
                // Atualizar créditos do usuário
                const userRecord = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', billingRecord.userId);
                const newCredits = (userRecord.credits || 0) + billingRecord.creditAmount;
                await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', billingRecord.userId, {
                    credits: newCredits,
                    updatedAt: new Date().toISOString()
                });
                console.log(`Créditos atualizados para usuário ${billingRecord.userId}: ${newCredits}`);
            }
        }
    }
    catch (error) {
        console.error('Erro ao processar webhook Asaas:', error);
        throw error;
    }
}
exports.default = plugin;
//# sourceMappingURL=index.js.map