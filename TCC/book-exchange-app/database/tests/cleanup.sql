-- =====================================================
-- LIMPEZA DE DADOS DE TESTE - BookExchange
-- ⚠️ CUIDADO: Este script remove TODOS os dados das tabelas
-- Use apenas em ambiente de desenvolvimento/teste
-- =====================================================

-- Confirmação de segurança
DO $$ 
BEGIN
    RAISE NOTICE '⚠️ ATENÇÃO: Este script irá remover TODOS os dados das tabelas!';
    RAISE NOTICE 'Execute apenas em ambiente de DESENVOLVIMENTO/TESTE';
    RAISE NOTICE 'Para continuar, descomente as linhas abaixo e execute novamente';
END $$;

-- Descomente as linhas abaixo APENAS se tiver certeza que quer limpar os dados

/*
-- Desabilitar verificações de foreign key temporariamente
SET session_replication_role = replica;

-- Limpar dados na ordem correta (devido às foreign keys)
TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.meeting_locations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.books RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

-- Reabilitar verificações de foreign key
SET session_replication_role = DEFAULT;

-- Verificar se as tabelas estão vazias
SELECT 'profiles: ' || COUNT(*) as contagem FROM public.profiles
UNION ALL
SELECT 'books: ' || COUNT(*) FROM public.books  
UNION ALL
SELECT 'meeting_locations: ' || COUNT(*) FROM public.meeting_locations
UNION ALL
SELECT 'requests: ' || COUNT(*) FROM public.requests
UNION ALL
SELECT 'notifications: ' || COUNT(*) FROM public.notifications;

SELECT '🧹 Limpeza concluída! Todas as tabelas estão vazias.' as status;
*/

SELECT '⚠️ Script de limpeza preparado mas não executado.' as status;
SELECT 'Descomente o código acima se realmente quiser limpar os dados.' as instrucao;