# BigTech - Infraestrutura Docker/Kubernetes

## Visão Geral

Este documento descreve a infraestrutura de containers para o Projeto BigTech, implementando isolamento multi-tenant via Docker e Kubernetes conforme definido na arquitetura.

## Estrutura

```
infrastructure/
├── docker/
│   ├── docker-compose.prod.yml    # Produção com isolamento
│   ├── docker-compose.dev.yml     # Desenvolvimento local
│   ├── Dockerfile.base            # Imagem base otimizada
│   └── nginx.conf                 # Reverse proxy configuration
└── k8s/
    ├── deployment.yaml            # Deployments Kubernetes
    ├── service.yaml              # Serviços internos
    └── ingress.yaml              # Ingress para domínios
```

## Pré-requisitos

- Docker >= 20.10
- Docker Compose >= 2.0
- Kubernetes >= 1.24 (para produção)
- kubectl configurado (para produção)

## Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
# Edite .env com suas chaves API e senhas
```

### 2. Desenvolvimento Local

Para desenvolvimento, use o docker-compose.dev.yml:

```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

Isso iniciará:
- Frontend User: http://localhost:3000
- Frontend Admin: http://localhost:3001
- Backend Core: http://localhost:4000

### 3. Produção

Para produção, use o docker-compose.prod.yml:

```bash
cd infrastructure/docker
docker-compose -f docker-compose.prod.yml up -d
```

Isso iniciará todos os serviços incluindo:
- Appwrite: http://localhost/console
- Frontend User: http://localhost:3000
- Frontend Admin: http://localhost:3001
- Backend Core (multi-tenant): http://localhost:4001, http://localhost:4002
- Nginx Proxy: http://localhost (roteamento baseado em domínio)

### 4. Kubernetes (Produção)

Para deploy em Kubernetes:

```bash
# Aplicar configurações
kubectl apply -f infrastructure/k8s/

# Verificar status
kubectl get pods -n bigtech
kubectl get services -n bigtech
kubectl get ingress -n bigtech
```

## Isolamento Multi-Tenant

### Docker Compose
- Cada tenant roda em container separado (backend-core-tenant1, backend-core-tenant2)
- Plugins ativos são configurados via variável de ambiente ACTIVE_PLUGINS
- Dados isolados via namespaces no Appwrite

### Kubernetes
- Deployments separados por tenant
- ConfigMaps para configuração de plugins
- Secrets para chaves API
- Ingress com roteamento baseado em host

## Monitoramento

### Health Checks
Todos os containers incluem health checks automáticos:
- Frontend: Verificação HTTP na rota principal
- Backend: Endpoint /health
- Appwrite: Verificação via API

### Logs
```bash
# Ver logs de um serviço específico
docker-compose logs backend-core-tenant1

# Ver logs de todos os serviços
docker-compose logs
```

## Segurança

- Containers rodam como usuário não-root
- Secrets gerenciados via Kubernetes Secrets
- Rate limiting configurado no Nginx
- TLS obrigatório em produção (via cert-manager)

## Troubleshooting

### Problemas Comuns

1. **Portas ocupadas**: Verifique se as portas 3000-4002 estão livres
2. **Appwrite não conecta**: Verifique se o Appwrite está rodando e acessível
3. **Plugins não carregam**: Verifique variável ACTIVE_PLUGINS e arquivos de configuração

### Debug

```bash
# Ver status dos containers
docker-compose ps

# Acessar container
docker-compose exec backend-core-tenant1 sh

# Ver logs detalhados
docker-compose logs -f backend-core-tenant1
```

## Próximos Passos

Após configurar a infraestrutura:
1. Implementar autenticação (TASK-004)
2. Criar dashboards (TASK-006, TASK-011)
3. Desenvolver plugins (TASK-016, TASK-017)