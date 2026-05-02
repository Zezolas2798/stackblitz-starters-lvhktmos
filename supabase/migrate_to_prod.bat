@echo off
set PGPASSWORD=demolidorg1

echo [1/3] Iniciando Dump Completo do banco DEV (v17)...
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --version
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h db.ircjgepumexoqslljtql.supabase.co -U postgres -p 5432 -d postgres --no-owner --no-privileges -f supabase/full_backup.sql

if %ERRORLEVEL% NEQ 0 (
    echo [TENTATIVA 2] Falhou com minuscula. Tentando com Demolidorg1...
    set PGPASSWORD=Demolidorg1
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h db.ircjgepumexoqslljtql.supabase.co -U postgres -p 5432 -d postgres --no-owner --no-privileges -f supabase/full_backup.sql
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao gerar dump do banco DEV. Verifique a senha ou conexao.
    exit /b %ERRORLEVEL%
)

echo [2/3] Dump concluido com sucesso. Preparando banco PROD...

echo [3/3] Restaurando backup no banco PROD (v17)...
set PGPASSWORD=Demolidorg1
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h db.pofneoxtsteknvgwfniu.supabase.co -U postgres -p 5432 -d postgres -f supabase/full_backup.sql

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao restaurar backup no banco PROD.
    exit /b %ERRORLEVEL%
)

echo [SUCESSO] Migracao concluida! Banco PROD e agora um espelho do DEV.
set PGPASSWORD=
