@echo off
REM ============================================================
REM OpenAI API Key Update Script (Windows)
REM ============================================================
REM
REM This script updates your OpenAI API key in all necessary files
REM
REM USAGE:
REM   update-openai-key.bat sk-proj-your-actual-key-here
REM
REM ============================================================

setlocal enabledelayedexpansion

REM Colors simulation (Windows 10+)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Get the API key from command line argument
if "%~1"=="" (
    echo %RED%^❌ ERROR: No OpenAI API key provided%NC%
    echo.
    echo Usage:
    echo   update-openai-key.bat ^<your-openai-api-key^>
    echo.
    echo Example:
    echo   update-openai-key.bat sk-proj-xyz123...
    echo.
    echo Get your key from: https://platform.openai.com/api-keys
    exit /b 1
)

set "NEW_KEY=%~1"

REM Validate key format
echo %BLUE%🔑 OpenAI API Key Update Script%NC%
echo ════════════════════════════════════════════════════
echo.

REM Get current directory
set "SCRIPT_DIR=%~dp0"

REM Files to update
set "ENV_FILE=%SCRIPT_DIR%.env"
set "FITNESS_ENV_FILE=%SCRIPT_DIR%fitness\.env"
set "RENDER_CONFIG=%SCRIPT_DIR%render.yaml"

REM Counter
set "UPDATED_COUNT=0"

REM Function to update a file using PowerShell (more reliable for Windows)
REM We'll use a different approach - create a PowerShell command

echo Updating OpenAI API key...
echo.

REM Update main .env file
if not exist "%ENV_FILE%" (
    echo %YELLOW%Creating .env from template...%NC%
    if exist "%SCRIPT_DIR%env-template.txt" (
        copy "%SCRIPT_DIR%env-template.txt" "%ENV_FILE%" >nul
        echo %GREEN%✅ Created .env file from template%NC%
    ) else (
        echo %RED%❌ ERROR: env-template.txt not found%NC%
        exit /b 1
    )
)

REM Use PowerShell to update files (more cross-platform compatible)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "^
    $key = '%NEW_KEY%'; ^
    $envFile = '%ENV_FILE%'; ^
    $fitnessEnvFile = '%FITNESS_ENV_FILE%'; ^
    $renderFile = '%RENDER_CONFIG%'; ^
    $updated = 0; ^
    if (Test-Path $envFile) { ^
        $content = Get-Content $envFile; ^
        if ($content -match 'OPENAI_API_KEY') { ^
            $content = $content -replace 'OPENAI_API_KEY=.*', ('OPENAI_API_KEY=' + $key); ^
            $backup = $envFile + '.backup.' + [datetime]::Now.Ticks; ^
            Copy-Item $envFile $backup; ^
            Set-Content -Path $envFile -Value $content; ^
            Write-Host '✅ UPDATED: Main .env file' -ForegroundColor Green; ^
            Write-Host ('  Backup: ' + (Split-Path $backup -Leaf)) -ForegroundColor Blue; ^
            $updated++; ^
        } ^
    } ^
    if (Test-Path $fitnessEnvFile) { ^
        $content = Get-Content $fitnessEnvFile; ^
        if ($content -match 'OPENAI_API_KEY') { ^
            $content = $content -replace 'OPENAI_API_KEY=.*', ('OPENAI_API_KEY=' + $key); ^
            $backup = $fitnessEnvFile + '.backup.' + [datetime]::Now.Ticks; ^
            Copy-Item $fitnessEnvFile $backup; ^
            Set-Content -Path $fitnessEnvFile -Value $content; ^
            Write-Host '✅ UPDATED: Fitness backend .env file' -ForegroundColor Green; ^
            Write-Host ('  Backup: ' + (Split-Path $backup -Leaf)) -ForegroundColor Blue; ^
            $updated++; ^
        } ^
    } ^
    Write-Host ''; ^
    Write-Host ('Files updated: ' + $updated) -ForegroundColor Green; ^
    if ($updated -gt 0) { ^
        Write-Host ''; ^
        Write-Host 'Next steps:' -ForegroundColor Green; ^
        Write-Host '  1. Restart your server: npm start'; ^
        Write-Host '  2. Test the API: curl http://localhost:5000/api/health'; ^
    } ^
    "

echo.
echo ════════════════════════════════════════════════════
echo.
echo Need help?
echo   • View your keys: https://platform.openai.com/api-keys
echo   • API status: https://status.openai.com
echo.
pause
