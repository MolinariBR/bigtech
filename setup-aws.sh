#!/bin/bash

# Script para configurar recursos AWS necessários para o deploy
# Execute este script uma vez antes do primeiro deploy

echo "🚀 Configurando AWS para BigTech Consulta"
echo "=========================================="
echo ""

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_REGION" ]; then
    echo "❌ Erro: Configure as variáveis de ambiente AWS primeiro:"
    echo "   export AWS_ACCESS_KEY_ID=your_access_key"
    echo "   export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "   export AWS_REGION=us-east-1"
    exit 1
fi

echo "✅ AWS credentials encontradas"

# Configurar AWS CLI
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set default.region $AWS_REGION

echo "✅ AWS CLI configurado"

# Criar IAM Role para ECS Task Execution
echo ""
echo "🔧 Criando IAM Role para ECS Task Execution..."

ROLE_NAME="ecsTaskExecutionRole"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Verificar se a role já existe
ROLE_EXISTS=$(aws iam get-role --role-name $ROLE_NAME --query Role.RoleName --output text 2>/dev/null || echo "")

if [ -z "$ROLE_EXISTS" ]; then
    # Criar a role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }'

    # Anexar política gerenciada
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

    echo "✅ Role ECS Task Execution criada"
else
    echo "✅ Role ECS Task Execution já existe"
fi

# Criar Key Pair para EC2 (opcional, se não existir)
echo ""
echo "🔑 Verificando Key Pair para EC2..."

KEY_PAIR_NAME="bigtech-consulta-key"

KEY_EXISTS=$(aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --query KeyPairs[0].KeyName --output text 2>/dev/null || echo "")

if [ -z "$KEY_EXISTS" ]; then
    echo "Criando novo Key Pair..."
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --query 'KeyMaterial' \
        --output text > ${KEY_PAIR_NAME}.pem

    chmod 400 ${KEY_PAIR_NAME}.pem
    echo "✅ Key Pair criado: ${KEY_PAIR_NAME}.pem"
    echo "⚠️  IMPORTANTE: Guarde este arquivo em local seguro!"
    echo "   Ele será necessário para acessar a instância EC2 do Appwrite"
else
    echo "✅ Key Pair já existe"
fi

# Verificar se ECR repository existe, se não, criar
echo ""
echo "🐳 Verificando ECR Repository..."

REPO_NAME="backend-core"

REPO_EXISTS=$(aws ecr describe-repositories --repository-names $REPO_NAME --query repositories[0].repositoryName --output text 2>/dev/null || echo "")

if [ -z "$REPO_EXISTS" ]; then
    aws ecr create-repository --repository-name $REPO_NAME
    echo "✅ ECR Repository criado: $REPO_NAME"
else
    echo "✅ ECR Repository já existe: $REPO_NAME"
fi

# Configurar lifecycle policy para ECR (opcional)
aws ecr put-lifecycle-configuration \
    --repository-name $REPO_NAME \
    --lifecycle-policy-text '{
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    }' 2>/dev/null || true

echo ""
echo "🎉 Configuração AWS concluída!"
echo ""
echo "📋 Resumo da configuração:"
echo "• IAM Role: $ROLE_NAME"
echo "• ECR Repository: $REPO_NAME"
echo "• Key Pair: $KEY_PAIR_NAME"
echo "• Região: $AWS_REGION"
echo ""
echo "📝 Próximos passos:"
echo "1. Adicione o secret AWS_EC2_KEY_PAIR no GitHub com valor: $KEY_PAIR_NAME"
echo "2. Configure os outros secrets conforme AWS_SETUP.md"
echo "3. Faça push para a branch main para iniciar o deploy"
echo ""
echo "⚠️  Lembre-se de configurar os secrets no GitHub Actions!"