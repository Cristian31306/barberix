@echo off
color 0A
echo ========================================================
echo         INICIANDO ACTUALIZACION EN EL VPS
echo ========================================================
echo.
echo Se conectara al servidor (167.86.72.200) y ejecutara el script de despliegue.
echo NOTA: Si no tienes configurada una llave SSH, te pedira tu contraseña (Cristian_5732988$)
echo.

ssh cristian@167.86.72.200 "cd /home/cristian/apps/barberix && bash deploy.sh"

echo.
echo ========================================================
echo         PROCESO FINALIZADO
echo ========================================================
pause
