@echo off
echo Installing dependencies...
call npm install

echo Building extensions...
call npm run build

echo Build complete. Artifacts are in the dist\ directory.
pause
