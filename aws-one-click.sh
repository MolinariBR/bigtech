#!/bin/bash

# Script ONE-LINER - Tudo em 1 comando
# Execute: ./aws-one-click.sh

echo "🚀 AWS One-Click Setup - BigTech Consulta"
echo "========================================="
echo ""

# Função para instalar AWS CLI se necessário
install_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "📦 Instalando AWS CLI..."
        curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "aws.zip"
        unzip -q aws.zip
        sudo ./aws/install > /dev/null 2>&1
        rm -rf aws.zip aws/
        echo "✅ AWS CLI instalado"
    fi
}

# Instalar AWS CLI se necessário
install_aws_cli

# Verificar se já está configurado
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS já configurado"
else
    echo "❌ AWS não configurado."
    echo ""
    echo "Configure com um dos métodos:"
    echo ""
    echo "MÉTODO 1 - Interativo:"
    echo "aws configure"
    echo ""
    echo "MÉTODO 2 - Direto (substitua os valores):"
    echo "aws configure set aws_access_key_id YOUR_ACCESS_KEY"
    echo "aws configure set aws_secret_access_key YOUR_SECRET_KEY"
    echo "aws configure set default.region us-east-1"
    echo ""
    exit 1
fi

# Pegar informações
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

echo "📍 Conta: $ACCOUNT_ID | Região: $REGION"

# Executar setup simplificado
echo ""
echo "⚡ Executando setup automático..."

# IAM Role
ROLE_NAME="ecsTaskExecutionRole"
if ! aws iam get-role --role-name $ROLE_NAME &> /dev/null; then
    aws iam create-role --role-name $ROLE_NAME \
        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' > /dev/null 2>&1
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null 2>&1
    echo "✅ IAM Role"
else
    echo "✅ IAM Role (existia)"
fi

# ECR
REPO_NAME="backend-core"
if ! aws ecr describe-repositories --repository-names $REPO_NAME &> /dev/null; then
    aws ecr create-repository --repository-name $REPO_NAME > /dev/null 2>&1
    echo "✅ ECR Repository"
else
    echo "✅ ECR Repository (existia)"
fi

# Key Pair
KEY_PAIR_NAME="bigtech-consulta-key"
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME &> /dev/null; then
    aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --query 'KeyMaterial' --output text > ${KEY_PAIR_NAME}.pem 2>/dev/null
    chmod 400 ${KEY_PAIR_NAME}.pem 2>/dev/null
    echo "✅ Key Pair (${KEY_PAIR_NAME}.pem)"
else
    echo "✅ Key Pair (existia)"
fi

echo ""
echo "🎉 SUCESSO! AWS totalmente configurada!"
echo ""
echo "📋 COPIE estes secrets para GitHub Actions:"
echo "=========================================="
echo "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-$(aws configure get aws_access_key_id)}"
echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-$(aws configure get aws_secret_access_key)}"
echo "AWS_REGION=$REGION"
echo "AWS_EC2_KEY_PAIR=$KEY_PAIR_NAME"
echo "=========================================="
echo ""
echo "🚀 PRÓXIMO: Cole estes valores no GitHub > Settings > Secrets > Actions"
echo ""
echo "💡 DEPOY: git add . && git commit -m 'AWS ready' && git push origin main"