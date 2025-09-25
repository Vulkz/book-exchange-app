-- =====================================================
-- CORREÇÃO: Estrutura da tabela notifications
-- Execute se houver problemas com a tabela de notificações
-- =====================================================

-- Verificar se a tabela notifications existe e criar se necessário
DO $$ 
BEGIN
    -- Criar tabela se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT,
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            data JSONB
        );
        RAISE NOTICE 'Tabela notifications criada';
    END IF;
    
    -- Verificar e adicionar coluna read se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'read') THEN
        ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna read adicionada à tabela notifications';
    END IF;

    -- Verificar e adicionar coluna data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'data') THEN
        ALTER TABLE public.notifications ADD COLUMN data JSONB;
        RAISE NOTICE 'Coluna data adicionada à tabela notifications';
    END IF;

    -- Verificar se user_id referencia corretamente
    IF NOT EXISTS (SELECT 1 FROM information_schema.referential_constraints 
                   WHERE constraint_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND referenced_table_name = 'profiles') THEN
        -- Alterar referência para profiles se necessário
        ALTER TABLE public.notifications 
        DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Referência user_id corrigida para profiles';
    END IF;
END $$;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Criar políticas RLS corretas
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Verificação final
SELECT 
    'notifications' as table_name,
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') as table_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read') as read_column_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data') as data_column_exists;

SELECT 'Estrutura da tabela notifications corrigida com sucesso!' as status;