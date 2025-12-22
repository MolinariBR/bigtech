# Configuração da Square Cloud para o projeto BigTech
# Arquivo de configuração para deploy na plataforma Square Cloud
# Documentação: https://docs.squarecloud.app/en/getting-started/config-file

# Arquivo principal da aplicação (servidor estático)
MAIN=server.js

# Versão do Node.js recomendada
VERSION=recommended

# Memória alocada (1024MB disponível no plano)
MEMORY=512

# Nome de exibição da aplicação
DISPLAY_NAME=BigTech Frontend App

# Descrição da aplicação
DESCRIPTION=Aplicação frontend Next.js do sistema BigTech (static export com servidor Express)

# Comando customizado para iniciar
START=node server.js

# Reinício automático em caso de falha
AUTORESTART=true

# Subdomínio para acesso web
SUBDOMAIN=bigtech-app

# Runtime
RUNTIME=nodejs