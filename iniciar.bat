@echo off
echo ========================================================
echo        Iniciando Barberix (Frontend y Backend)
echo ========================================================

echo Iniciando Backend (Laravel) en una nueva ventana...
start "Barberix - Backend" cmd /k "cd backend && php artisan serve"

echo Iniciando Frontend (Vite) en una nueva ventana...
start "Barberix - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Los servicios se estan ejecutando en ventanas separadas.
echo.
echo ========================================================
echo ENLACES DE ACCESO:
echo  - Frontend (React/Vite): http://localhost:5173
echo  - Backend (Laravel):     http://127.0.0.1:8000
echo ========================================================
echo.
echo Puedes cerrar esta ventana.
pause
