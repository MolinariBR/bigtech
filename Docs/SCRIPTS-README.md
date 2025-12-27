# Scripts de Gerenciamento - BigTech

## 📋 Visão Geral

Scripts automatizados para iniciar, parar e monitorar os serviços do projeto BigTech.

## 🚀 `start-server.sh`

### Opções Disponíveis:
1. **frontend-app** (porta 3000)
2. **frontend-admin** (porta 3001)
3. **backend** (porta 8080)
4. **Todos** - Inicia todos os serviços
5. **Todos + Logs** - Inicia serviços + visualização automática de logs (requer tmux/screen)

### Funcionalidades:
- ✅ Verificação automática de conflitos de portas
- ✅ Encerramento de processos existentes antes de iniciar
- ✅ Logs estruturados em `logs/`
- ✅ Backend em modo desenvolvimento (carrega plugins corretamente)
- ✅ Opção de visualização automática de logs

### Exemplo de Uso:
```bash
./start-server.sh
# Escolha opção 5 para iniciar tudo + logs automaticamente
```

## 🛑 `stop-server.sh`

### Funcionalidades de Encerramento:
- ✅ Parada por arquivos PID
- ✅ Liberação de portas (3000, 3001, 8080, 4000)
- ✅ Encerramento por padrões de processo
- ✅ Encerramento de sessões tmux/screen de logs

### Opções de Limpeza/Otimização:
1. **Limpeza básica** - Cache do Node.js (npm, yarn, pnpm)
2. **Limpeza completa** - Cache + arquivos temporários (.next, out/, tsconfig.tsbuildinfo)
3. **Otimização completa** - Limpeza + otimização de espaço (npm prune)
4. **Verificar status** - Mostra portas e processos ativos
5. **Pular limpeza** - Apenas parar serviços

### Funcionalidades de Limpeza:
- 🧹 Cache do Node.js (npm, yarn, pnpm)
- 🗂️ Arquivos temporários do Next.js (.next, out/)
- 📝 Arquivos de build do TypeScript
- 🗑️ Arquivos .pid órfãos
- 📅 Logs antigos (>7 dias)
- 💾 Otimização de pacotes não utilizados

## 📊 `watch-logs.sh`

### Modos de Uso:

#### Interativo:
```bash
./watch-logs.sh
```

#### Direto:
```bash
# Log específico
./watch-logs.sh backend
./watch-logs.sh frontend-admin
./watch-logs.sh frontend-app

# Todos os logs (requer tmux/screen)
./watch-logs.sh all
```

### Dependências para Visualização Automática:
```bash
# Recomendado
sudo apt install tmux

# Alternativa
sudo apt install screen
```

## 📁 Estrutura de Logs

```
logs/
├── backend.log          # Backend (porta 8080)
├── frontend-admin.log   # Frontend Admin (porta 3001)
├── frontend-app.log     # Frontend App (porta 3000)
├── *.pid               # Arquivos de PID dos processos
└── README.md           # Esta documentação
```

## 🔧 Comandos Manuais

### Visualização Manual:
```bash
tail -f logs/backend.log
tail -f logs/frontend-admin.log
tail -f logs/frontend-app.log
```

### Verificação de Status:
```bash
# Portas em uso
netstat -tlnp | grep -E ":(3000|3001|8080)"

# Processos ativos
ps aux | grep -E "(node|npm|next)" | grep -v grep
```

## ⚡ Dicas de Uso

1. **Sempre use `./stop-server.sh`** antes de reiniciar serviços
2. **Use a opção 5** do start-server para desenvolvimento com logs
3. **Execute limpeza semanal** com opção 3 do stop-server
4. **Monitore logs** com `./watch-logs.sh` em terminal separado

## 🔍 Troubleshooting

### Serviços não param:
```bash
# Forçar parada manual
pkill -9 -f "node"
pkill -9 -f "next"
pkill -9 -f "npm"
```

### Portas ocupadas:
```bash
# Verificar quem está usando
lsof -i :8080
lsof -i :3001
lsof -i :3000

# Matar processo específico
kill -9 <PID>
```

### Logs não aparecem:
```bash
# Verificar se diretório existe
ls -la logs/

# Criar manualmente se necessário
mkdir -p logs
touch logs/backend.log
```