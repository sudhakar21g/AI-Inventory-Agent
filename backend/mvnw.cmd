@REM Maven Wrapper startup script for Windows
@REM Downloads and runs Maven if not already available

@echo off
setlocal

set "MAVEN_VERSION=3.9.6"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"
set "MAVEN_URL=https://dlcdn.apache.org/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"
set "ZIP_FILE=%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip"

@REM Check if Maven is available on PATH
where mvn >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    mvn %*
    goto :eof
)

@REM Download Maven if not cached
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Downloading Apache Maven %MAVEN_VERSION%...
    mkdir "%MAVEN_HOME%" 2>nul
    curl -fsSL -o "%ZIP_FILE%" "%MAVEN_URL%"
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to download Maven. Please install Maven manually.
        exit /b 1
    )
    powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%TEMP%\maven-extract' -Force"
    for /d %%D in ("%TEMP%\maven-extract\apache-maven-*") do (
        xcopy /E /I /Y "%%D\*" "%MAVEN_HOME%" >nul
    )
    rd /S /Q "%TEMP%\maven-extract" 2>nul
    del "%ZIP_FILE%" 2>nul
)

set "PATH=%MAVEN_HOME%\bin;%PATH%"
mvn %*
