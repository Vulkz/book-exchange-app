-- =====================================================
-- TESTE E DIAGNÓSTICO - BookExchange
-- Execute para verificar se o sistema está funcionando corretamente
-- =====================================================

SELECT '🔍 INICIANDO DIAGNÓSTICO DO SISTEMA BOOKEXCHANGE' as status;

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================
SELECT '📋 Verificando estrutura das tabelas...' as step;

-- Verificar se todas as tabelas necessárias existem
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN '✅'
        ELSE '❌'
    END || ' profiles' as table_status
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'books') THEN '✅'
        ELSE '❌'
    END || ' books'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_locations') THEN '✅'
        ELSE '❌'
    END || ' meeting_locations'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requests') THEN '✅'
        ELSE '❌'
    END || ' requests'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN '✅'
        ELSE '❌'
    END || ' notifications';

-- =====================================================
-- 2. VERIFICAR COLUNAS CRÍTICAS
-- =====================================================
SELECT '🔧 Verificando colunas críticas...' as step;

-- Verificar coluna read na tabela notifications
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'read'
        ) THEN '✅ notifications.read existe'
        ELSE '❌ notifications.read AUSENTE'
    END as column_check
UNION ALL
-- Verificar coluna data na tabela notifications
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'data'
        ) THEN '✅ notifications.data existe'
        ELSE '⚠️ notifications.data ausente (opcional)'
    END;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT '🔒 Verificando políticas RLS...' as step;

-- Contar políticas por tabela
SELECT 
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('profiles', 'books', 'meeting_locations', 'requests', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 4. VERIFICAR ÍNDICES
-- =====================================================
SELECT '📊 Verificando índices...' as step;

SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('profiles', 'books', 'meeting_locations', 'requests', 'notifications')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. CONTAR DADOS EXISTENTES
-- =====================================================
SELECT '📈 Verificando dados existentes...' as step;

SELECT 
    'profiles' as tabela,
    COUNT(*) as total_registros
FROM public.profiles
UNION ALL
SELECT 
    'books',
    COUNT(*)
FROM public.books
UNION ALL
SELECT 
    'meeting_locations',
    COUNT(*)
FROM public.meeting_locations
UNION ALL
SELECT 
    'requests',
    COUNT(*)
FROM public.requests
UNION ALL
SELECT 
    'notifications',
    COUNT(*)
FROM public.notifications;

-- =====================================================
-- 6. VERIFICAR ÚLTIMAS ATIVIDADES
-- =====================================================
SELECT '🕐 Verificando últimas atividades...' as step;

-- Últimos 5 livros adicionados
SELECT '📚 Últimos livros:' as info;
SELECT 
    title,
    author,
    category,
    created_at
FROM public.books 
ORDER BY created_at DESC 
LIMIT 5;

-- Últimas 5 solicitações
SELECT '📝 Últimas solicitações:' as info;
SELECT 
    r.status,
    r.message,
    r.created_at,
    b.title as livro
FROM public.requests r
LEFT JOIN public.books b ON r.book_id = b.id
ORDER BY r.created_at DESC 
LIMIT 5;

-- Últimas 5 notificações
SELECT '🔔 Últimas notificações:' as info;
SELECT 
    type,
    title,
    read,
    created_at
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 7. TESTE DE FUNCIONALIDADES CRÍTICAS
-- =====================================================
SELECT '🧪 Testando funcionalidades críticas...' as step;

-- Verificar se é possível fazer join entre as tabelas principais
SELECT '🔗 Teste de relacionamentos:' as test;
SELECT 
    COUNT(*) as books_with_owners,
    'books com profiles' as relationship
FROM public.books b
INNER JOIN public.profiles p ON b.owner_id = p.id
UNION ALL
SELECT 
    COUNT(*),
    'meeting_locations com books'
FROM public.meeting_locations ml
INNER JOIN public.books b ON ml.book_id = b.id
UNION ALL
SELECT 
    COUNT(*),
    'requests com todas as referências'
FROM public.requests r
INNER JOIN public.profiles p1 ON r.requester_id = p1.id
INNER JOIN public.profiles p2 ON r.owner_id = p2.id
INNER JOIN public.books b ON r.book_id = b.id;

-- =====================================================
-- 8. VERIFICAR INTEGRIDADE REFERENCIAL
-- =====================================================
SELECT '🔗 Verificando integridade referencial...' as step;

-- Verificar se há livros sem dono
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos os livros têm proprietários válidos'
        ELSE '❌ ' || COUNT(*) || ' livros com proprietários inválidos'
    END as integrity_check
FROM public.books b
LEFT JOIN public.profiles p ON b.owner_id = p.id
WHERE p.id IS NULL;

-- Verificar se há solicitações com referências inválidas
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas as solicitações têm referências válidas'
        ELSE '❌ ' || COUNT(*) || ' solicitações com referências inválidas'
    END as integrity_check
FROM public.requests r
LEFT JOIN public.profiles p1 ON r.requester_id = p1.id
LEFT JOIN public.profiles p2 ON r.owner_id = p2.id
LEFT JOIN public.books b ON r.book_id = b.id
WHERE p1.id IS NULL OR p2.id IS NULL OR b.id IS NULL;

-- =====================================================
-- RESULTADO FINAL
-- =====================================================
SELECT '🎉 DIAGNÓSTICO CONCLUÍDO!' as status;
SELECT '📊 Verifique os resultados acima para identificar possíveis problemas.' as info;