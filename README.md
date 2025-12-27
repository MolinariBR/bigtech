# BigTech Consulta

Sistema completo de consulta e análise de dados com frontend, backend e Appwrite.

## 🚀 Deploy na AWS

Este projeto está configurado para deploy automático na AWS usando GitHub Actions.

### 📋 Pré-requisitos

1. **Conta AWS** com permissões administrativas
2. **Repositório GitHub** com GitHub Actions habilitado
3. **Node.js 18+** para desenvolvimento local

### ⚡ Configuração Rápida (2 passos)

1. **Configurar AWS CLI:**
   ```bash
   aws configure
   ```

2. **Setup completo automático:**
   ```bash
   ./aws-one-click.sh
   ```

**🎉 O script instala tudo, configura tudo e mostra os secrets prontos para copiar!**

O GitHub Actions irá automaticamente:
- ✅ Criar instância EC2 com Appwrite
- ✅ Deploy dos frontends no S3
- ✅ Deploy do backend no ECS Fargate
- ✅ Configurar security groups e networking

### 🌐 URLs Após Deploy

Após o deploy bem-sucedido, suas aplicações estarão disponíveis em:

- **Frontend App**: `https://frontend-app-{RUN_ID}.s3-website-{REGION}.amazonaws.com`
- **Frontend Admin**: `https://frontend-admin-{RUN_ID}.s3-website-{REGION}.amazonaws.com`
- **Backend API**: URL do ECS (mostrada nos logs do GitHub Actions)
- **Appwrite Console**: `http://{EC2_PUBLIC_IP}`

## 🏗️ Arquitetura

```
Internet
    ↓
[CloudFront] (CDN - opcional)
    ↓
[S3 Buckets] (frontend-app, frontend-admin)
    ↓
[ECS Fargate] (backend API)
    ↓
[EC2 Instance] (Appwrite)
```

## 🛠️ Desenvolvimento Local

### Iniciar Todos os Serviços
```bash
# Instalar dependências
npm install

# Iniciar tudo
./start-server.sh
```

### Serviços Individuais

#### Frontend App
```bash
cd frontend-app
npm run dev
# Acesse: http://localhost:3000
```

#### Frontend Admin
```bash
cd frontend-admin
npm run dev
# Acesse: http://localhost:3001
```

#### Backend
```bash
cd backend
npm run dev
# Acesse: http://localhost:4000
```

#### Appwrite Local
```bash
cd appwrite-local
docker-compose up -d
# Console: http://localhost:80
```

## 📁 Estrutura do Projeto

```
├── frontend-app/          # Next.js - Interface do usuário
├── frontend-admin/        # Next.js - Painel administrativo
├── backend/              # Node.js/Express - API
├── appwrite/             # Appwrite (produção)
├── appwrite-local/       # Appwrite (desenvolvimento)
├── scripts/              # Scripts de automação
├── shared/               # Código compartilhado
└── .github/workflows/    # CI/CD GitHub Actions
```

## 🔧 Scripts Disponíveis

- `./start-server.sh` - Inicia todos os serviços locais
- `./stop-server.sh` - Para todos os serviços
- `./setup-aws.sh` - Configura recursos AWS
- `./frontend-app.sh` - Expõe frontend app via túnel
- `./frontend-admin.sh` - Expõe frontend admin via túnel

## 📚 Documentação

- [AWS Setup](AWS_SETUP.md) - Configuração completa da AWS
- [TÚNEL README](TUNNEL_README.md) - Exposição local via túnel
- [Docs/](Docs/) - Documentação técnica completa

## 🔒 Segurança

- ✅ Nunca commite chaves AWS no repositório
- ✅ Use IAM com princípio do menor privilégio
- ✅ Configure VPCs e Security Groups
- ✅ Ative MFA na conta root
- ✅ Monitore custos e uso

## 📞 Suporte

Para questões técnicas, consulte a documentação em `Docs/` ou abra uma issue no repositório.

---

**Status**: ✅ Migrado para AWS | ✅ Deploy automático | ✅ Produção ready</content>
<parameter name="filePath">/home/mau/projeto/consulta/README.md