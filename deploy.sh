#!/bin/bash
# ========================================================
# Script de Despliegue para Barberix en VPS
# Ejecutar este script desde la raíz del proyecto en el VPS
# ========================================================

echo "======================================="
echo "Iniciando despliegue de Barberix..."
echo "======================================="

# Asegurarse de que estamos en el directorio correcto
DIR="/home/cristian/apps/barberix"
if [ -d "$DIR" ]; then
    cd $DIR || exit
else
    echo "❌ El directorio $DIR no existe."
    exit 1
fi

# 1. Poner en modo mantenimiento
echo ">> [1/6] Entrando en modo mantenimiento..."
cd backend
php artisan down || true
cd ..

# 2. Traer últimos cambios de Git
echo ">> [2/6] Obteniendo últimos cambios de Git..."
git fetch --all
git reset --hard origin/main
git pull origin main

# 3. Actualizar Backend
echo ">> [3/6] Actualizando dependencias de Backend y Base de Datos..."
cd backend
composer install --no-interaction --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

# 4. Actualizar Frontend
echo ">> [4/6] Actualizando Frontend (React/Vite)..."
cd frontend
npm install
npm run build
cd ..

# 5. Quitar modo mantenimiento
echo ">> [5/6] Saliendo de modo mantenimiento..."
cd backend
php artisan up
cd ..

# 6. Reiniciar servidor web (Descomentar si es necesario)
echo ">> [6/6] Reiniciando servicios de Nginx y PHP..."
sudo systemctl restart nginx
sudo systemctl restart php8.4-fpm

echo "======================================="
echo "✅ ¡Despliegue completado con éxito!"
echo "======================================="
