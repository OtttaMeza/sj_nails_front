#!/bin/bash
# Primera instalación en el servidor Hetzner (sin dominio, HTTP directo).
# Ejecutar como root: bash setup.sh
set -e

REPO_URL="https://github.com/TU_USUARIO/sj_nails_front.git"
APP_DIR="/opt/sj-nails-front"
SERVER_IP="91.107.216.60"

echo "=== [1/5] Actualizando sistema ==="
apt-get update && apt-get upgrade -y

echo "=== [2/5] Instalando Docker ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

echo "=== [3/5] Instalando Nginx ==="
apt-get install -y nginx
systemctl enable nginx

echo "=== [4/5] Clonando repositorio ==="
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR" && git pull origin main
fi

echo "=== [5/5] Creando .env.production ==="
if [ ! -f "$APP_DIR/.env.production" ]; then
  cat > "$APP_DIR/.env.production" <<EOF
JWT_SECRET=$(openssl rand -hex 32)
JWT_COOKIE_NAME=sj_session
SESSION_MAX_AGE=86400
COOKIE_SECURE=false
EOF
  echo ""
  echo ">>> JWT_SECRET generado. Guárdalo:"
  cat "$APP_DIR/.env.production"
else
  echo ".env.production ya existe."
fi

echo "=== Configurando Nginx ==="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/sj-nails-front
ln -sf /etc/nginx/sites-available/sj-nails-front /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "============================================="
echo " Setup completado."
echo " Accede a: http://$SERVER_IP"
echo "============================================="
echo ""
echo "Siguiente paso — levantar el frontend:"
echo "  cd $APP_DIR"
echo "  docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
echo ""
echo "Cuando tengas dominio, agrega SSL con:"
echo "  apt-get install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d admin.sjnails.com"
echo ""
