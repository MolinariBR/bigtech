# Configuração da Square Cloud para o projeto BigTech
# Arquivo de configuração para deploy na plataforma Square Cloud
# Documentação: https://docs.squarecloud.app/en/getting-started/config-file

# Arquivo principal da aplicação Next.js
MAIN=frontend-app/next.config.js

# Versão do Node.js (18 para menor uso de memória)
VERSION=18

# Memória alocada (1024MB disponível no plano)
MEMORY=1024

# Nome de exibição da aplicação
DISPLAY_NAME=BigTech Frontend App

# Descrição da aplicação
DESCRIPTION=Aplicação frontend Next.js do sistema BigTech

# Comando customizado para iniciar (build + start para Next.js)
START=npm run build --workspace=frontend-app && npm run start --workspace=frontend-app

# Reinício automático em caso de falha
AUTORESTART=true

# Subdomínio para acesso web
SUBDOMAIN=bigtech-app

# Runtime (Next.js é Node.js/TypeScript)
RUNTIME=nodejs