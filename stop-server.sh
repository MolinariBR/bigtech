#!/bin/bash

# stop-server.sh - Script completo para parar servidores e fazer limpeza/otimização
# Criado pelo assistente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] SUCCESS:${NC} $1"
}

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para encerrar processo em uma porta específica
kill_process_on_port() {
    local port=$1
    local service_name=$2

    if check_port $port; then
        warn "Porta $port ($service_name) ainda em uso"
        local pid=$(lsof -ti :$port)
        if [ ! -z "$pid" ]; then
            info "Encerrando processo na porta $port (PID: $pid)"
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            if check_port $port; then
                warn "Forçando encerramento do processo na porta $port"
                kill -KILL $pid 2>/dev/null || true
                sleep 1
            fi
            if check_port $port; then
                error "Não foi possível encerrar processo na porta $port"
            else
                success "Processo na porta $port encerrado"
            fi
        fi
    else
        info "Porta $port ($service_name) está livre"
    fi
}

# Função para encerrar processos por padrão de nome
kill_processes_by_pattern() {
    local pattern=$1
    local description=$2

    if pgrep -f "$pattern" >/dev/null 2>&1; then
        info "Encontrados processos '$description'. Encerrando..."
        pkill -f "$pattern" 2>/dev/null || true
        sleep 2

        # Verificar se ainda existem
        if pgrep -f "$pattern" >/dev/null 2>&1; then
            warn "Forçando encerramento de processos '$description'"
            pkill -9 -f "$pattern" 2>/dev/null || true
            sleep 1
        fi

        if pgrep -f "$pattern" >/dev/null 2>&1; then
            error "Alguns processos '$description' podem ainda estar rodando"
        else
            success "Processos '$description' encerrados"
        fi
    else
        info "Nenhum processo '$description' encontrado"
    fi
}

# Função para limpar cache do Node.js
clean_node_cache() {
    info "Limpando cache do Node.js..."

    # Cache do npm
    if command -v npm &> /dev/null; then
        npm cache clean --force >/dev/null 2>&1 || warn "Erro ao limpar cache npm"
    fi

    # Cache do yarn (se existir)
    if command -v yarn &> /dev/null; then
        yarn cache clean >/dev/null 2>&1 || warn "Erro ao limpar cache yarn"
    fi

    # Cache do pnpm (se existir)
    if command -v pnpm &> /dev/null; then
        pnpm store prune >/dev/null 2>&1 || warn "Erro ao limpar cache pnpm"
    fi

    success "Cache do Node.js limpo"
}

# Função para limpar arquivos temporários
clean_temp_files() {
    info "Limpando arquivos temporários..."

    # Arquivos .log antigos (mais de 7 dias)
    find logs/ -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

    # Arquivos .pid órfãos
    find logs/ -name "*.pid" -type f -exec sh -c '
        pid=$(cat "$1" 2>/dev/null || echo "")
        if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
            rm -f "$1"
            echo "Removido arquivo PID órfão: $1"
        fi
    ' _ {} \;

    # Arquivos temporários do Next.js
    find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "out" -type d -exec rm -rf {} + 2>/dev/null || true

    # Cache do TypeScript
    find . -name "tsconfig.tsbuildinfo" -type f -delete 2>/dev/null || true

    success "Arquivos temporários limpos"
}

# Função para otimizar espaço em disco
optimize_disk_space() {
    info "Otimizando espaço em disco..."

    # Limpar pacotes não utilizados (se existir package manager)
    if [ -f "package-lock.json" ] && command -v npm &> /dev/null; then
        cd frontend-admin && npm prune >/dev/null 2>&1 && cd ..
        cd frontend-app && npm prune >/dev/null 2>&1 && cd ..
        cd backend && npm prune >/dev/null 2>&1 && cd ..
    fi

    success "Espaço em disco otimizado"
}

# Função principal
main() {
    echo
    log "=== BigTech Server Stop & Cleanup ==="
    echo

    ROOT_DIR=$(pwd)
    LOG_DIR="$ROOT_DIR/logs"

    # Verificar se estamos no diretório correto
    if [ ! -d "frontend-app" ] || [ ! -d "frontend-admin" ] || [ ! -d "backend" ]; then
        error "Este script deve ser executado na raiz do projeto BigTech"
        exit 1
    fi

    info "Parando todos os serviços..."

    # 1. Encerrar processos por PID (método mais preciso)
    if [ -d "$LOG_DIR" ]; then
        info "Verificando arquivos PID..."
        for pidfile in "$LOG_DIR"/*.pid; do
            [ -e "$pidfile" ] || continue
            pid=$(cat "$pidfile" 2>/dev/null || echo "")
            if [ -n "$pid" ]; then
                info "Parando PID $pid (arquivo: $(basename "$pidfile"))"
                kill $pid 2>/dev/null || true
                sleep 1
                if kill -0 $pid 2>/dev/null; then
                    warn "Forçando kill do PID $pid"
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
            rm -f "$pidfile" || true
        done
    else
        warn "Diretório de logs não encontrado: $LOG_DIR"
    fi

    # 2. Encerrar processos por porta
    info "Verificando portas em uso..."
    kill_process_on_port 3000 "frontend-app"
    kill_process_on_port 3001 "frontend-admin"
    kill_process_on_port 8080 "backend"
    kill_process_on_port 4000 "backend-dev"

    # 3. Encerrar processos por padrão de nome
    kill_processes_by_pattern "npm run dev" "npm run dev"
    kill_processes_by_pattern "next dev" "Next.js dev server"
    kill_processes_by_pattern "ts-node-dev" "ts-node-dev"
    kill_processes_by_pattern "node dist/index.js" "Node.js production"
    kill_processes_by_pattern "tail -f logs/" "log watchers"

    # 4. Encerrar sessões tmux/screen de logs (se existirem)
    if pgrep -f "tmux.*bigtech-logs" >/dev/null 2>&1; then
        info "Encerrando sessão tmux de logs..."
        tmux kill-session -t bigtech-logs 2>/dev/null || true
    fi

    if screen -ls 2>/dev/null | grep -q "bigtech-"; then
        info "Encerrando sessões screen de logs..."
        screen -ls 2>/dev/null | grep "bigtech-" | awk '{print $1}' | xargs -I {} screen -S {} -X quit 2>/dev/null || true
    fi

    echo
    success "=== Serviços encerrados ==="

    # Menu de limpeza/otimização
    echo
    echo -e "${PURPLE}=== Opções de Limpeza e Otimização ===${NC}"
    echo "1) Limpeza básica (cache Node.js)"
    echo "2) Limpeza completa (temp files + cache)"
    echo "3) Otimização completa (limpeza + otimização disco)"
    echo "4) Apenas verificar status"
    echo "5) Pular limpeza"
    echo

    read -p "Escolha uma opção de limpeza (1-5) [padrão: 1]: " cleanup_choice
    cleanup_choice=${cleanup_choice:-1}

    case $cleanup_choice in
        1)
            log "Executando limpeza básica..."
            clean_node_cache
            ;;
        2)
            log "Executando limpeza completa..."
            clean_node_cache
            clean_temp_files
            ;;
        3)
            log "Executando otimização completa..."
            clean_node_cache
            clean_temp_files
            optimize_disk_space
            ;;
        4)
            log "Verificando status dos serviços..."
            echo
            info "Status das portas:"
            for port in 3000 3001 8080; do
                if check_port $port; then
                    warn "Porta $port: EM USO"
                else
                    success "Porta $port: LIVRE"
                fi
            done
            echo
            info "Processos relacionados:"
            ps aux | grep -E "(node|npm|next)" | grep -v grep || echo "Nenhum processo encontrado"
            ;;
        5)
            info "Pulando limpeza..."
            ;;
        *)
            warn "Opção inválida, executando limpeza básica..."
            clean_node_cache
            ;;
    esac

    echo
    success "=== Operação concluída ==="
    log "Todos os serviços foram parados e limpeza executada"
    info "Para reiniciar: ./start-server.sh"
}

main "$@" 
