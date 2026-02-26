# =============================================================================
#  setup-kong.ps1 - Configuracao inicial do Kong API Gateway (PowerShell)
# =============================================================================
#  USO:
#    .\setup-kong.ps1
#
#  PRE-REQUISITOS:
#    - Docker Compose rodando: docker compose up -d
#    - Kong saudavel: docker compose ps
# =============================================================================

$KONG_ADMIN     = "http://localhost:8001"
$MAX_RETRIES    = 30
$RETRY_INTERVAL = 5

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Kong API Gateway - Setup Inicial"          -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
#  1. Aguardar Kong Admin API ficar disponivel
# =============================================================================
Write-Host "[1/4] Aguardando Kong Admin API em $KONG_ADMIN ..." -ForegroundColor Yellow

$retries = 0
$ready   = $false
do {
    $status = curl.exe -s -o NUL -w "%{http_code}" "$KONG_ADMIN/status"
    if ($status -eq "200") {
        $ready = $true
    } else {
        $retries++
        if ($retries -ge $MAX_RETRIES) {
            Write-Host "ERRO: Kong Admin API nao respondeu apos $MAX_RETRIES tentativas." -ForegroundColor Red
            Write-Host "Verifique: docker compose ps"
            exit 1
        }
        Write-Host "  Tentativa $retries/$MAX_RETRIES - aguardando ${RETRY_INTERVAL}s..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $RETRY_INTERVAL
    }
} while (-not $ready)

Write-Host "  OK Kong Admin API esta respondendo!" -ForegroundColor Green
Write-Host ""

# =============================================================================
#  2. Criar o Service apontando para o backend NestJS
# =============================================================================
Write-Host "[2/4] Criando Service 'biblioteca-backend'..." -ForegroundColor Yellow

$svcJson = curl.exe -s -X POST "$KONG_ADMIN/services" `
    --data "name=biblioteca-backend" `
    --data "url=http://backend:3000"

$svc = $svcJson | ConvertFrom-Json
if ($svc.message) {
    Write-Host "  AVISO: $($svc.message)" -ForegroundColor DarkYellow
} else {
    Write-Host "  OK Service criado. ID: $($svc.id)" -ForegroundColor Green
}
Write-Host ""

# =============================================================================
#  3. Criar a Route /api vinculada ao Service
# =============================================================================
Write-Host "[3/4] Criando Route '/api' vinculada ao Service..." -ForegroundColor Yellow

$routeJson = curl.exe -s -X POST "$KONG_ADMIN/services/biblioteca-backend/routes" `
    --data "name=biblioteca-api" `
    --data "paths[]=/api" `
    --data "strip_path=true"

$route = $routeJson | ConvertFrom-Json
if ($route.message) {
    Write-Host "  AVISO: $($route.message)" -ForegroundColor DarkYellow
} else {
    Write-Host "  OK Route '/api' criada. ID: $($route.id)" -ForegroundColor Green
    Write-Host "     strip_path=true: /api/livros -> /livros no backend" -ForegroundColor DarkGray
}
Write-Host ""

# =============================================================================
#  4. Habilitar o plugin ip-restriction na Route
# =============================================================================
Write-Host "[4/4] Habilitando plugin 'ip-restriction' na Route..." -ForegroundColor Yellow
Write-Host "       Bloqueando: 194.56.0.0/16 (servidor suico ficticio)" -ForegroundColor DarkGray

$pluginJson = curl.exe -s -X POST "$KONG_ADMIN/routes/biblioteca-api/plugins" `
    --data "name=ip-restriction" `
    --data "config.deny=194.56.0.0/16" `
    --data "config.status=403" `
    --data "config.message=Acesso bloqueado: IP restrito (ip-restriction)"

$plugin = $pluginJson | ConvertFrom-Json
if ($plugin.message) {
    Write-Host "  AVISO: $($plugin.message)" -ForegroundColor DarkYellow
} else {
    Write-Host "  OK Plugin 'ip-restriction' habilitado. ID: $($plugin.id)" -ForegroundColor Green
}
Write-Host ""

# =============================================================================
#  RESULTADO
# =============================================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup concluido com sucesso!"              -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Servicos disponiveis:"                     -ForegroundColor White
Write-Host "  Kong Proxy:       http://localhost:8000"   -ForegroundColor Cyan
Write-Host "  Kong Admin API:   http://localhost:8001"   -ForegroundColor Cyan
Write-Host "  Kong Manager GUI: http://localhost:8002"   -ForegroundColor Cyan
Write-Host "  Konga:            http://localhost:1337"   -ForegroundColor Cyan
Write-Host "  Backend (direto): http://localhost:3000"   -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Como Testar o Bloqueio por IP"             -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1) Requisicao normal (deve retornar 200):"                                           -ForegroundColor Green
Write-Host '     curl.exe -i http://localhost:8000/api/livros'                                     -ForegroundColor White
Write-Host ""
Write-Host "  2) Simulando IP bloqueado (deve retornar 403):"                                      -ForegroundColor Red
Write-Host '     curl.exe -i -H "X-Forwarded-For: 194.56.10.10" http://localhost:8000/api/livros'  -ForegroundColor White
Write-Host ""
Write-Host "  3) No Postman:"                                                                       -ForegroundColor Yellow
Write-Host "     - URL: GET http://localhost:8000/api/livros"                                       -ForegroundColor White
Write-Host "     - Header: X-Forwarded-For = 194.56.10.10"                                         -ForegroundColor White
Write-Host "     - Resposta esperada: 403 Forbidden"                                                -ForegroundColor White
Write-Host ""
Write-Host "  NOTA: X-Forwarded-For funciona porque o Kong usa"       -ForegroundColor DarkGray
Write-Host "  KONG_TRUSTED_IPS=0.0.0.0/0 + KONG_REAL_IP_HEADER=X-Forwarded-For." -ForegroundColor DarkGray
Write-Host ""