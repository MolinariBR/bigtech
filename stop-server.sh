#!/bin/bash

# stop-server.sh - Script para parar servidores do projeto BigTech
# Restauração criada pelo assistente

set -e

echo "Parando serviços..."

ROOT_DIR=$(pwd)
LOG_DIR="$ROOT_DIR/logs"

if [ -d "$LOG_DIR" ]; then
  for pidfile in "$LOG_DIR"/*.pid; do
    [ -e "$pidfile" ] || continue
    pid=$(cat "$pidfile" 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
      echo "- Parando PID $pid (arquivo $pidfile)"
      kill $pid 2>/dev/null || true
      sleep 1
      if kill -0 $pid 2>/dev/null; then
        echo "-- Forçando kill $pid"
        kill -9 $pid 2>/dev/null || true
      fi
    fi
    rm -f "$pidfile" || true
  done
else
  echo "Diretório de logs não encontrado: $LOG_DIR"
fi

# Tenta encerrar processos conhecidos por nome
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "ts-node-dev" 2>/dev/null || true

echo "Serviços parados. Verifique logs para confirmar." 
