#!/bin/bash

# start-server.sh - Script para iniciar servidores do projeto BigTech
# Restauração criada pelo assistente

set -e  # Exit on any error

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

warn() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)] INFO:${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

kill_process_on_port() {
    local port=$1
    local service_name=$2

    if check_port $port; then
        warn "Porta $port ($service_name) está em uso. Encerrando processo..."

        local pid=$(lsof -ti :$port)
        if [ ! -z "$pid" ]; then
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            if check_port $port; then
                warn "Forçando encerramento do processo na porta $port..."
                kill -KILL $pid 2>/dev/null || true
                sleep 1
            fi
            if check_port $port; then
                error "Não foi possível encerrar o processo na porta $port"
                return 1
            else
                log "Processo na porta $port encerrado com sucesso"
            fi
        fi
    else
        info "Porta $port ($service_name) está livre"
    fi
}

check_and_kill_existing_processes() {
    log "Verificando processos existentes..."
    kill_process_on_port 3000 "frontend-app"
    kill_process_on_port 3001 "frontend-admin"
    kill_process_on_port 8080 "backend"
    kill_process_on_port 4000 "backend-dev"

    if pgrep -f "next dev" >/dev/null 2>&1; then
        warn "Encontrados processos 'next dev'. Encerrando..."
        pkill -f "next dev" 2>/dev/null || true
        sleep 2
    fi

    if pgrep -f "node dist/index.js" >/dev/null 2>&1; then
        warn "Encontrados processos 'node dist/index.js'. Encerrando..."
        pkill -f "node dist/index.js" 2>/dev/null || true
        sleep 2
    fi

    if pgrep -f "ts-node-dev" >/dev/null 2>&1; then
        warn "Encontrados processos 'ts-node-dev'. Encerrando..."
        pkill -f "ts-node-dev" 2>/dev/null || true
        sleep 2
    fi

    log "Verificação de processos concluída"
}

start_frontend_app() {
    log "Iniciando frontend-app..."
    cd frontend-app
    npm run dev > ../logs/frontend-app.log 2>&1 &
    local pid=$!
    echo $pid > ../logs/frontend-app.pid
    cd ..
    log "frontend-app iniciado (PID: $pid)"
    info "Logs: logs/frontend-app.log"
    info "URL: http://localhost:3000"
}

start_frontend_admin() {
    log "Iniciando frontend-admin..."
    cd frontend-admin
    npm run dev > ../logs/frontend-admin.log 2>&1 &
    local pid=$!
    echo $pid > ../logs/frontend-admin.pid
    cd ..
    log "frontend-admin iniciado (PID: $pid)"
    info "Logs: logs/frontend-admin.log"
    info "URL: http://localhost:3001"
}

start_backend() {
    log "Iniciando backend..."
    cd backend
    if [ ! -f "dist/index.js" ]; then
        warn "Arquivo dist/index.js não encontrado. Compilando..."
        npm run build
    fi
    NODE_ENV=production PORT=8080 node dist/index.js > ../logs/backend.log 2>&1 &
    local pid=$!
    echo $pid > ../logs/backend.pid
    cd ..
    log "Backend iniciado (PID: $pid)"
    info "Logs: logs/backend.log"
    info "Health check: http://localhost:8080/health"
}

main() {
    mkdir -p logs

    log "=== BigTech Server Manager (restored) ==="
    log "Verificando ambiente..."

    if [ ! -d "frontend-app" ] || [ ! -d "frontend-admin" ] || [ ! -d "backend" ]; then
        error "Este script deve ser executado na raiz do projeto BigTech"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        error "Node.js não está instalado ou não está no PATH"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        error "npm não está instalado ou não está no PATH"
        exit 1
    fi

    check_and_kill_existing_processes

    echo
    info "Selecione qual(is) servidor(es) deseja iniciar:"
    echo "1) frontend-app (porta 3000)"
    echo "2) frontend-admin (porta 3001)"
    echo "3) backend (porta 8080)"
    echo "4) Todos"
    echo "5) Sair"
    echo

    read -p "Digite sua opção (1-5): " choice

    case $choice in
        1)
            start_frontend_app
            ;;
        2)
            start_frontend_admin
            ;;
        3)
            start_backend
            ;;
        4)
            log "Iniciando todos os servidores..."
            start_frontend_app
            sleep 2
            start_frontend_admin
            sleep 2
            start_backend
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

    echo
    log "=== Servidores iniciados com sucesso! ==="
    log "Para parar os servidores, execute: ./stop-server.sh"
    log "Para ver logs: tail -f logs/<servico>.log"
}

main "$@"
