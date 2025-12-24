#!/bin/bash

# watch-logs.sh - Script para visualizar logs em tempo real de todos os serviços
# Criado pelo assistente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)] INFO:${NC} $1"
}

# Função para verificar se um arquivo existe
check_log_file() {
    local log_file=$1
    local service_name=$2

    if [ ! -f "$log_file" ]; then
        info "Arquivo de log $log_file não existe ainda. Criando..."
        mkdir -p logs
        touch "$log_file"
    fi
}

# Função para mostrar logs de um serviço
show_service_logs() {
    local log_file=$1
    local service_name=$2

    check_log_file "$log_file" "$service_name"

    log "Mostrando logs do $service_name (pressione Ctrl+C para sair)"
    info "Arquivo: $log_file"

    # Usar tail -f para acompanhar logs em tempo real
    tail -f "$log_file"
}

# Função para mostrar todos os logs em terminais separados (usando tmux ou screen)
show_all_logs() {
    if command -v tmux &> /dev/null; then
        log "Usando tmux para mostrar todos os logs..."

        # Criar sessão tmux
        tmux new-session -d -s bigtech-logs

        # Criar janelas para cada serviço
        tmux rename-window -t bigtech-logs:0 'backend'
        tmux send-keys -t bigtech-logs:0 'tail -f logs/backend.log' C-m

        tmux new-window -t bigtech-logs:1 -n 'frontend-admin'
        tmux send-keys -t bigtech-logs:1 'tail -f logs/frontend-admin.log' C-m

        tmux new-window -t bigtech-logs:2 -n 'frontend-app'
        tmux send-keys -t bigtech-logs:2 'tail -f logs/frontend-app.log' C-m

        # Anexar à sessão
        tmux attach-session -t bigtech-logs

    elif command -v screen &> /dev/null; then
        log "Usando screen para mostrar todos os logs..."

        # Criar sessões screen
        screen -dmS bigtech-backend bash -c 'tail -f logs/backend.log'
        screen -dmS bigtech-frontend-admin bash -c 'tail -f logs/frontend-admin.log'
        screen -dmS bigtech-frontend-app bash -c 'tail -f logs/frontend-app.log'

        info "Logs disponíveis em sessões screen:"
        info "  - backend: screen -r bigtech-backend"
        info "  - frontend-admin: screen -r bigtech-frontend-admin"
        info "  - frontend-app: screen -r bigtech-frontend-app"

        # Conectar à primeira sessão
        screen -r bigtech-backend

    else
        error "Nem tmux nem screen estão instalados."
        error "Instale um deles: sudo apt install tmux  ou  sudo apt install screen"
        error "Ou use as opções individuais:"
        echo
        info "Opções disponíveis:"
        echo "1) Backend: $0 backend"
        echo "2) Frontend Admin: $0 frontend-admin"
        echo "3) Frontend App: $0 frontend-app"
        exit 1
    fi
}

main() {
    mkdir -p logs

    if [ $# -eq 0 ]; then
        echo
        info "BigTech Log Watcher"
        echo "==================="
        echo
        info "Selecione uma opção:"
        echo "1) Todos os logs (tmux/screen)"
        echo "2) Apenas backend"
        echo "3) Apenas frontend-admin"
        echo "4) Apenas frontend-app"
        echo "5) Sair"
        echo

        read -p "Digite sua opção (1-5): " choice

        case $choice in
            1)
                show_all_logs
                ;;
            2)
                show_service_logs "logs/backend.log" "backend"
                ;;
            3)
                show_service_logs "logs/frontend-admin.log" "frontend-admin"
                ;;
            4)
                show_service_logs "logs/frontend-app.log" "frontend-app"
                ;;
            5)
                log "Saindo..."
                exit 0
                ;;
            *)
                error "Opção inválida"
                exit 1
                ;;
        esac
    else
        case $1 in
            "backend")
                show_service_logs "logs/backend.log" "backend"
                ;;
            "frontend-admin")
                show_service_logs "logs/frontend-admin.log" "frontend-admin"
                ;;
            "frontend-app")
                show_service_logs "logs/frontend-app.log" "frontend-app"
                ;;
            "all")
                show_all_logs
                ;;
            *)
                error "Serviço inválido. Use: backend, frontend-admin, frontend-app, ou all"
                exit 1
                ;;
        esac
    fi
}

main "$@"