#!/usr/bin/env bash
# =============================================================================
#  setup-kong.sh — Configuração inicial do Kong API Gateway
# =============================================================================
#  Este script automatiza a criação do Service, Route e Plugin ip-restriction
#  no Kong via Admin API (http://localhost:8001).
#
#  USO:
#    chmod +x setup-kong.sh
#    ./setup-kong.sh
#
#  PRÉ-REQUISITOS:
#    - Docker Compose rodando: docker compose up -d
#    - Kong saudável: docker compose ps kong (status: healthy)
# =============================================================================

set -euo pipefail

KONG_ADMIN="http://localhost:8001"
MAX_RETRIES=30
RETRY_INTERVAL=5

# ----- Cores para output -----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Kong API Gateway — Setup Inicial${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# =============================================================================
#  1. Aguardar Kong Admin API ficar disponível
# =============================================================================
echo -e "${YELLOW}[1/4] Aguardando Kong Admin API em ${KONG_ADMIN}...${NC}"

RETRIES=0
until curl -s -o /dev/null -w "%{http_code}" "${KONG_ADMIN}/status" | grep -q "200"; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo -e "${RED}ERRO: Kong Admin API não respondeu após ${MAX_RETRIES} tentativas.${NC}"
    echo "Verifique se o container está rodando: docker compose ps kong"
    exit 1
  fi
  echo "  Tentativa ${RETRIES}/${MAX_RETRIES} — aguardando ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo -e "${GREEN}  ✔ Kong Admin API está respondendo!${NC}"
echo ""

# =============================================================================
#  2. Criar o Service apontando para o backend NestJS
# =============================================================================
echo -e "${YELLOW}[2/4] Criando Service 'biblioteca-backend'...${NC}"

curl -s -X POST "${KONG_ADMIN}/services" \
  --data "name=biblioteca-backend" \
  --data "url=http://backend:3000" \
  | python3 -m json.tool 2>/dev/null || true

echo ""
echo -e "${GREEN}  ✔ Service 'biblioteca-backend' criado → http://backend:3000${NC}"
echo ""

# =============================================================================
#  3. Criar a Route /api vinculada ao Service
# =============================================================================
echo -e "${YELLOW}[3/4] Criando Route '/api' vinculada ao Service...${NC}"

curl -s -X POST "${KONG_ADMIN}/services/biblioteca-backend/routes" \
  --data "name=biblioteca-api" \
  --data "paths[]=/api" \
  --data "strip_path=true" \
  | python3 -m json.tool 2>/dev/null || true

echo ""
echo -e "${GREEN}  ✔ Route '/api' criada (strip_path=true)${NC}"
echo -e "    Exemplo: GET http://localhost:8000/api/livros → GET http://backend:3000/livros"
echo ""

# =============================================================================
#  4. Habilitar o plugin ip-restriction na Route
# =============================================================================
echo -e "${YELLOW}[4/4] Habilitando plugin 'ip-restriction' na Route...${NC}"
echo -e "       Bloqueando faixa de IP: 194.56.0.0/16 (servidor suíço fictício)"

curl -s -X POST "${KONG_ADMIN}/routes/biblioteca-api/plugins" \
  --data "name=ip-restriction" \
  --data "config.deny=194.56.0.0/16" \
  --data "config.status=403" \
  --data "config.message=Acesso bloqueado: IP restrito (ip-restriction)" \
  | python3 -m json.tool 2>/dev/null || true

echo ""
echo -e "${GREEN}  ✔ Plugin 'ip-restriction' habilitado!${NC}"
echo -e "    IPs bloqueados: 194.56.0.0/16"
echo ""

# =============================================================================
#  RESULTADO
# =============================================================================
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}  ✔ Setup concluído com sucesso!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  Serviços disponíveis:"
echo -e "  ─────────────────────────────────────────"
echo -e "  Kong Proxy:       ${CYAN}http://localhost:8000${NC}"
echo -e "  Kong Admin API:   ${CYAN}http://localhost:8001${NC}"
echo -e "  Kong Manager GUI: ${CYAN}http://localhost:8002${NC}"
echo -e "  Konga:            ${CYAN}http://localhost:1337${NC}"
echo -e "  Backend (direto): ${CYAN}http://localhost:3000${NC}"
echo ""

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Como Testar o Bloqueio por IP${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "  ${GREEN}1) Requisição normal (deve retornar 200):${NC}"
echo -e "     curl -i http://localhost:8000/api/livros"
echo ""
echo -e "  ${RED}2) Simulando IP bloqueado (deve retornar 403):${NC}"
echo -e '     curl -i -H "X-Forwarded-For: 194.56.10.10" http://localhost:8000/api/livros'
echo ""
echo -e "  ${YELLOW}3) No Postman:${NC}"
echo -e "     - URL: GET http://localhost:8000/api/livros"
echo -e '     - Adicione o Header: X-Forwarded-For → 194.56.10.10'
echo -e "     - Envie a requisição → Resposta esperada: 403 Forbidden"
echo ""
echo -e "  ${YELLOW}Nota:${NC} O header X-Forwarded-For funciona porque o Kong está"
echo -e "  configurado com KONG_TRUSTED_IPS=0.0.0.0/0 e"
echo -e "  KONG_REAL_IP_HEADER=X-Forwarded-For no docker-compose.yml."
echo ""
