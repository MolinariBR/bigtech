# Configuração da Square Cloud para o projeto BigTech
# Arquivo de configuração para deploy na plataforma Square Cloud
# Documentação: https://docs.squarecloud.app/en/getting-started/config-file

# Arquivo principal da aplicação Next.js (static export)
MAIN=frontend-app/out/index.html

# Versão do Node.js recomendada
VERSION=recommended

# Memória alocada (1024MB disponível no plano)
MEMORY=1024

# Nome de exibição da aplicação
DISPLAY_NAME=BigTech Frontend App

# Descrição da aplicação
DESCRIPTION=Aplicação frontend Next.js do sistema BigTech (static export)

# Runtime para sites estáticos
RUNTIME=static

# Reinício automático em caso de falha (não aplicável para static)
AUTORESTART=false

# Subdomínio para acesso web
SUBDOMAIN=bigtech-app