
@echo off
echo ==========================================
echo   GENERATING MOCK SCREENSHOTS
echo ==========================================
echo.

node --loader tsx script/generate-mock-screenshots.ts

echo.
echo ==========================================
echo   GENERATION COMPLETE
echo ==========================================
pause
