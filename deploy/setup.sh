#!/bin/bash
# Primera instalación en el servidor Hetzner.
# Ejecutar como root: bash setup.sh
set -e

REPO_URL="https://github.com/TU_USUARIO/sj_nails_front.git"
APP_DIR="/opt/sj-nails-front"
DOMAIN="admin.sjnails.com"

echo "=== [1/6] Actualizando sistema ==="
apt-get update && apt-get upgrade -y

echo "=== [2/6] Instalando Docker ==="
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

echo "=== [3/6] Instalando Nginx y Certbot ==="
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== [4/6] Clonando repositorio ==="
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "El directorio ya existe, omitiendo clone."
fi

echo "=== [5/6] Creando archivo .env.production ==="
if [ ! -f "$APP_DIR/.env.production" ]; then
  cat > "$APP_DIR/.env.production" <<EOF
JWT_SECRET=$(openssl rand -hex 32)
JWT_COOKIE_NAME=sj_session
SESSION_MAX_AGE=86400
EOF
  echo ""
  echo ">>> IMPORTANTE: Se generó un JWT_SECRET aleatorio en $APP_DIR/.env.production"
  echo ">>> Revísalo antes de continuar: cat $APP_DIR/.env.production"
else
  echo ".env.production ya existe, omitiendo."
fi

echo "=== [6/6] Configurando Nginx ==="
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/sj-nails-front
ln -sf /etc/nginx/sites-available/sj-nails-front /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== Setup base completado ==="
echo ""
echo "Próximos pasos manuales:"
echo "  1. Apunta el DNS: admin.sjnails.com → $(curl -s ifconfig.me)"
echo "  2. Obtén el certificado SSL:"
echo "     certbot --nginx -d $DOMAIN"
echo "  3. Construye y levanta el frontend:"
echo "     cd $APP_DIR"
echo "     docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
echo ""