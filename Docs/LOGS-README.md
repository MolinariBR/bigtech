# Sistema de Logs - BigTech

## Scripts Disponíveis

### `start-server.sh`
Script principal para iniciar servidores:
- Opção 5: "Todos + Logs" - Inicia todos os servidores E abre visualização automática de logs

### `watch-logs.sh`
Script dedicado para visualização de logs em tempo real:

#### Uso Interativo
```bash
./watch-logs.sh
```
Mostra menu para escolher visualização

#### Uso Direto
```bash
# Log específico
./watch-logs.sh backend
./watch-logs.sh frontend-admin
./watch-logs.sh frontend-app

# Todos os logs (requer tmux ou screen)
./watch-logs.sh all
```

#### Visualização Manual
```bash
tail -f logs/backend.log
tail -f logs/frontend-admin.log
tail -f logs/frontend-app.log
```

## Dependências para Visualização Automática

Para usar `./watch-logs.sh all` ou a opção 5 do start-server:

```bash
# Instalar tmux (recomendado)
sudo apt install tmux

# Ou instalar screen (alternativa)
sudo apt install screen
```

## Estrutura de Logs

```
logs/
├── backend.log          # Logs do backend (porta 8080)
├── frontend-admin.log   # Logs do frontend-admin (porta 3001)
└── frontend-app.log     # Logs do frontend-app (porta 3000)
```