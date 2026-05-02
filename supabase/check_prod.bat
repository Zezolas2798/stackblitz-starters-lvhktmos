@echo off
set PGPASSWORD=Demolidorg1
echo Verificando Banco PROD...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h db.pofneoxtsteknvgwfniu.supabase.co -U postgres -d postgres -c "SELECT 'Clientes: ' || count(*) FROM public.clientes; SELECT 'Profiles: ' || count(*) FROM public.profiles;"
set PGPASSWORD=
