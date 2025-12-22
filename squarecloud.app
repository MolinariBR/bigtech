# Configuração da Square Cloud para o projeto BigTech
# Arquivo de configuração para deploy na plataforma Square Cloud
# Documentação: https://docs.squarecloud.app/en/getting-started/config-file

# Arquivo principal da aplicação (TypeScript)
MAIN=backend/src/index.ts

# Versão do Node.js recomendada
VERSION=recommended

# Memória alocada (512MB mínimo para aplicações)
MEMORY=512

# Nome de exibição da aplicação
DISPLAY_NAME=BigTech Backend API

# Descrição da aplicação
DESCRIPTION=API backend do sistema BigTech para gerenciamento de tenants e plugins

# Comando customizado para iniciar (opcional - se não definido, usa MAIN)
# START=npm run start

# Reinício automático em caso de falha
AUTORESTART=true

# Subdomínio para acesso web (se aplicável)
# SUBDOMAIN=bigtech-api

# Runtime (inferido automaticamente pelo MAIN, mas pode ser especificado)
# RUNTIME=nodejs