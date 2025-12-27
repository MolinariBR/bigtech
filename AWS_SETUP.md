## 0. Scripts de Configuração (Escolha o mais simples)

### 🚀 Opção 1: ONE-CLICK (Mais simples possível)
```bash
# Configure AWS CLI primeiro
aws configure

# Execute 1 comando - faz TUDO automaticamente
./aws-one-click.sh
```

**Este script é INSANO:**
- ✅ Instala AWS CLI se necessário
- ✅ Verifica credenciais AWS
- ✅ Cria IAM Role, ECR, Key Pair
- ✅ **Mostra TODOS os secrets prontos para copiar!**
- ✅ Copie e cole direto no GitHub

### ⚡ Opção 2: Ultra Simples
```bash
aws configure
./setup-aws-simple.sh
```

### 🔧 Opção 3: Completo (para customização)
```bash
export AWS_ACCESS_KEY_ID=key
export AWS_SECRET_ACCESS_KEY=secret
export AWS_REGION=us-east-1
./setup-aws.sh
```

1. Acesse [AWS Console](https://console.aws.amazon.com/)
2. Crie uma conta AWS se não tiver
3. Vá para [IAM](https://console.aws.amazon.com/iam/) para configurar permissões

## 2. Criar IAM User para GitHub Actions

1. No IAM Console, vá para "Users" > "Create user"
2. Nome: `github-actions-deploy`
3. Selecione "Access key - Programmatic access"
4. Clique "Next: Permissions"

### 3. Anexar Políticas de Permissão

Adicione estas políticas gerenciadas pela AWS:

- ✅ `AmazonEC2FullAccess` - Para gerenciar EC2 (Appwrite VM)
- ✅ `AmazonS3FullAccess` - Para S3 buckets (frontend static hosting)
- ✅ `CloudFrontFullAccess` - Para CloudFront distributions
- ✅ `AmazonECS_FullAccess` - Para ECS (backend deployment)
- ✅ `AWSCloudFormationFullAccess` - Para infraestrutura como código
- ✅ `IAMFullAccess` - Para criar roles necessárias

Ou crie uma política customizada com permissões mínimas:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "s3:*",
                "cloudfront:*",
                "ecs:*",
                "ecr:*",
                "iam:*",
                "cloudformation:*",
                "route53:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### 4. Criar Access Keys

1. Após criar o user, vá para "Security credentials"
2. "Create access key"
3. Selecione "Command Line Interface (CLI)"
4. Baixe o arquivo CSV com Access Key ID e Secret Access Key

## 5. Configurar Secrets no GitHub

1. Vá para seu repositório no GitHub
2. "Settings" > "Secrets and variables" > "Actions"
3. Clique "New repository secret"

### Secrets Necessárias:

#### `AWS_ACCESS_KEY_ID`
- **Valor**: Access Key ID do IAM user
- **Descrição**: AWS Access Key ID para GitHub Actions

#### `AWS_SECRET_ACCESS_KEY`
- **Valor**: Secret Access Key do IAM user
- **Descrição**: AWS Secret Access Key para GitHub Actions

#### `AWS_REGION`
- **Valor**: `us-east-1` (ou sua região preferida)
- **Descrição**: Região AWS para deploy

## 6. Configurar Route 53 (Opcional - para domínio customizado)

Se quiser usar um domínio customizado:

1. Vá para [Route 53](https://console.aws.amazon.com/route53/)
2. "Create hosted zone" para seu domínio
3. Anote o "Hosted zone ID"
4. Adicione mais secrets no GitHub:
   - `ROUTE53_HOSTED_ZONE_ID`: ID da hosted zone
   - `DOMAIN_NAME`: Seu domínio (ex: `meuapp.com`)

## 7. Verificar Configuração

Após configurar as secrets, faça um push para a branch `main` para testar:

```bash
git add .
git commit -m "Setup AWS deployment"
git push origin main
```

## 8. URLs das Aplicações (após deploy)

Após o primeiro deploy bem-sucedido, suas aplicações estarão disponíveis em:

- **Frontend App**: `https://[CLOUDFRONT_DISTRIBUTION_URL]` (CloudFront + S3)
- **Frontend Admin**: `https://[CLOUDFRONT_DISTRIBUTION_URL]` (CloudFront + S3)
- **Backend API**: URL do ECS (será mostrada nos logs do GitHub Actions)
- **Appwrite Console**: `http://[EC2_PUBLIC_IP]`

## 9. Custos Estimados (Free Tier)

- **EC2 t2.micro**: 750 horas/mês gratuito (1 mês)
- **S3**: 5GB storage + transfer grátis
- **CloudFront**: 1TB transfer grátis
- **ECS Fargate**: Até certo limite gratuito
- **ECR**: 500MB storage grátis

## 10. Monitoramento

- Acompanhe os deploys em "Actions" no GitHub
- Verifique logs da AWS em [CloudWatch](https://console.aws.amazon.com/cloudwatch/)
- Monitore custos em [Billing](https://console.aws.amazon.com/billing/)

## ⚠️ Segurança Importante

- ✅ Nunca commite as Access Keys no repositório
- ✅ Use apenas as permissões mínimas necessárias
- ✅ Configure billing alerts na AWS
- ✅ Use VPCs e Security Groups apropriados
- ✅ Ative MFA na conta root

## 🔧 Troubleshooting

### Erro: "Access Denied"
- Verifique se o IAM user tem todas as políticas necessárias
- Confirme se as Access Keys estão corretas

### Erro: "Region not available"
- Verifique se o serviço está disponível na região escolhida
- Algumas regiões não têm todos os serviços

### Erro: "Build failed"
- Verifique se as dependências estão corretas nos package.json
- Confirme se os Dockerfiles estão funcionando localmente

### Erro: "EC2 instance limit exceeded"
- A conta free tier permite apenas 1 t2.micro
- Verifique limites em [EC2 Limits](https://console.aws.amazon.com/ec2/)

## 📊 Comparação Google Cloud vs AWS

| Componente | Google Cloud | AWS | Status |
|------------|-------------|-----|--------|
| VM (Appwrite) | Compute Engine | EC2 t2.micro | ✅ Migrado |
| Static Hosting | Cloud Storage | S3 + CloudFront | ✅ Migrado |
| Container Service | Cloud Run | ECS Fargate | ✅ Migrado |
| Container Registry | GCR | ECR | ✅ Migrado |
| DNS | Cloud DNS | Route 53 | 🔄 Opcional |
| Monitoring | Cloud Logging | CloudWatch | ✅ Migrado |
| CI/CD | Cloud Build | GitHub Actions | ✅ Mantido |

## 🔄 Migração Realizada

### ✅ O que foi migrado:
- **Workflow GitHub Actions**: Atualizado para usar AWS CLI
- **Appwrite**: De Compute Engine para EC2
- **Frontend**: De Cloud Storage para S3
- **Backend**: De Cloud Run para ECS Fargate
- **Registry**: De GCR para ECR

### 📝 Arquivos atualizados:
- `.github/workflows/deploy.yml` - Novo workflow AWS
- `AWS_SETUP.md` - Documentação completa
- `setup-aws.sh` - Script de configuração automática

### 🔧 Próximos passos:
1. Executar `./setup-aws.sh` para configurar AWS
2. Configurar secrets no GitHub
3. Fazer push para testar o deploy
4. (Opcional) Configurar CloudFront para performance</content>
<parameter name="filePath">/home/mau/projeto/consulta/AWS_SETUP.md