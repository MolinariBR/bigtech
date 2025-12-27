"use strict";
// Baseado em: 2.Architecture.md v1.0.2, 4.Entities.md v1.2, 7.Tasks.md v1.9
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Plugin Asaas para processamento de pagamentos conforme TASK-017
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAsaasWebhook = handleAsaasWebhook;
const axios = require('axios');
const appwrite_1 = require("../../../lib/appwrite");
const node_appwrite_1 = require("node-appwrite");
const config_1 = require("./config");
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
    async enable() {
        console.log(`Habilitando plugin Asaas...`);
        // Plugin habilitado sem configurações específicas de tenant
        console.log(`✅ Plugin Asaas habilitado`);
    },
    async disable() {
        console.log(`Desabilitando plugin Asaas...`);
        // Cleanup se necessário
        console.log(`✅ Plugin Asaas desabilitado`);
    },
    async execute(context) {
        try {
            const paymentContext = context.input;
            // Obter configuração (agora sem tenantId)
            const config = await getAsaasConfig();
            // Validar valor mínimo e máximo
            if (paymentContext.amount < config.minAmount || paymentContext.amount > config.maxAmount) {
                return {
                    success: false,
                    error: `Valor deve estar entre R$ ${config.minAmount.toFixed(2)} e R$ ${config.maxAmount.toFixed(2)}`
                };
            }
            // Validar método de pagamento
            if (!config.defaultPaymentMethods.includes(paymentContext.paymentMethod)) {
                return {
                    success: false,
                    error: `Método de pagamento não suportado: ${paymentContext.paymentMethod}`
                };
            }
            // Criar ou obter cliente no Asaas
            const customerId = await getOrCreateCustomer(paymentContext, config);
            // Criar cobrança
            const payment = await createPayment(customerId, paymentContext, config);
            // Registrar transação no billing
            await registerBillingTransaction(paymentContext, payment);
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
async function getAsaasConfig() {
    // Para single-tenant, usar configuração padrão ou buscar de uma coleção global
    const appwrite = appwrite_1.AppwriteService.getInstance();
    try {
        // Buscar configuração global (não por tenant)
        const configs = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'system_settings', [node_appwrite_1.Query.equal('key', 'asaas_config')]);
        if (configs.documents.length === 0) {
            throw new Error('Configuração Asaas não encontrada');
        }
        const config = JSON.parse(configs.documents[0].value);
        // Validar configuração
        const validation = (0, config_1.validateConfig)(config);
        if (!validation.valid) {
            throw new Error(`Configuração Asaas inválida: ${validation.errors.join(', ')}`);
        }
        return config;
    }
    catch (error) {
        console.error('Erro ao obter configuração Asaas:', error);
        throw error;
    }
}
async function getOrCreateCustomer(context, config) {
    const baseUrl = config_1.ASAAS_URLS[config.environment];
    try {
        // Buscar cliente existente
        const searchResponse = await axios.get(`${baseUrl}/customers`, {
            params: { cpfCnpj: context.customerDocument },
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        });
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
            return searchResponse.data.data[0].id;
        }
        // Criar novo cliente
        const createResponse = await axios.post(`${baseUrl}/customers`, {
            name: context.customerName,
            cpfCnpj: context.customerDocument,
            email: context.customerEmail
        }, {
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        });
        return createResponse.data.id;
    }
    catch (error) {
        console.error('Erro ao gerenciar cliente Asaas:', error);
        throw new Error('Falha ao processar dados do cliente');
    }
}
async function createPayment(customerId, context, config) {
    const baseUrl = config_1.ASAAS_URLS[config.environment];
    // Calcular data de vencimento
    const dueDate = new Date(Date.now() + config.defaultDueDateDays * 24 * 60 * 60 * 1000);
    const paymentData = {
        customer: customerId,
        billingType: config_1.PAYMENT_METHOD_MAPPING[context.paymentMethod],
        value: context.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Compra de ${context.creditAmount} créditos - R$ ${context.creditValue.toFixed(2)} cada`,
        externalReference: `credit_purchase_${context.userId}_${Date.now()}`,
        callback: {
            successUrl: config.successUrl,
            autoRedirect: true
        }
    };
    try {
        const response = await axios.post(`${baseUrl}/payments`, paymentData, {
            headers: {
                'access_token': config.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
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
                node_appwrite_1.Query.equal('externalTransactionId', payment.id),
                node_appwrite_1.Query.equal('status', 'pending')
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