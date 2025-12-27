#!/bin/bash

# Script ULTRA SIMPLIFICADO - 1 comando para configurar tudo
# Execute: ./setup-aws-simple.sh

set -e  # Parar em erro

echo "🚀 AWS Setup Ultra Simples - BigTech Consulta"
echo "=============================================="
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não instalado."
    echo "Instale: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'aws.zip' && unzip aws.zip && sudo ./aws/install"
    exit 1
fi

# Verificar credenciais
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Configure AWS primeiro:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS OK"

# Pegar info da conta
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

echo "📍 Conta: $ACCOUNT_ID | Região: $REGION"

# 1. IAM Role
echo ""
echo "🔧 Criando IAM Role..."
ROLE_NAME="ecsTaskExecutionRole"
if ! aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    aws iam create-role --role-name $ROLE_NAME \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' > /dev/null
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null
    echo "✅ Role criada"
else
    echo "✅ Role existe"
fi

# 2. ECR Repository
echo "🐳 Criando ECR Repository..."
REPO_NAME="backend-core"
if ! aws ecr describe-repositories --repository-names $REPO_NAME &> /dev/null; then
    aws ecr create-repository --repository-name $REPO_NAME > /dev/null
    echo "✅ ECR criado"
else
    echo "✅ ECR existe"
fi

# 3. Key Pair
echo "🔑 Criando Key Pair..."
KEY_PAIR_NAME="bigtech-consulta-key"
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME &> /dev/null; then
    aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --query 'KeyMaterial' --output text > ${KEY_PAIR_NAME}.pem
    chmod 400 ${KEY_PAIR_NAME}.pem
    echo "✅ Key Pair criado: ${KEY_PAIR_NAME}.pem"
else
    echo "✅ Key Pair existe"
fi

echo ""
echo "🎉 PRONTO! AWS configurada em segundos!"
echo ""
echo "📋 Secrets para GitHub Actions:"
echo "AWS_ACCESS_KEY_ID     = $(aws configure get aws_access_key_id)"
echo "AWS_SECRET_ACCESS_KEY = $(aws configure get aws_secret_access_key)"
echo "AWS_REGION           = $REGION"
echo "AWS_EC2_KEY_PAIR     = $KEY_PAIR_NAME"
echo ""
echo "🚀 Deploy: git add . && git commit -m 'AWS setup' && git push origin main"