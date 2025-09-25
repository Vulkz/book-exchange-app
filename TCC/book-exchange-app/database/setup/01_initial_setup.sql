-- =====================================================
-- BOOKEXCHANGE - CONFIGURAÇÃO INICIAL DO BANCO DE DADOS
-- Execute este script apenas uma vez ao configurar o projeto
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: profiles
-- Gerencia informações dos usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =====================================================
-- TABELA: books
-- Gerencia os livros disponíveis para troca
-- =====================================================
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Políticas para books
CREATE POLICY "Anyone can view books" ON public.books
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- =====================================================
-- TABELA: meeting_locations
-- Locais de encontro para cada livro
-- =====================================================
CREATE TABLE IF NOT EXISTS public.meeting_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para meeting_locations
ALTER TABLE public.meeting_locations ENABLE ROW LEVEL SECURITY;

-- Políticas para meeting_locations
CREATE POLICY "Anyone can view meeting locations" ON public.meeting_locations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage locations for own books" ON public.meeting_locations
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = meeting_locations.book_id 
            AND books.owner_id = auth.uid()
        )
    );

-- =====================================================
-- TABELA: requests
-- Solicitações de troca de livros
-- =====================================================
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Políticas para requests
CREATE POLICY "Users can view their requests" ON public.requests
    FOR SELECT TO authenticated USING (
        auth.uid() = requester_id OR auth.uid() = owner_id
    );

CREATE POLICY "Users can create requests" ON public.requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Book owners can update requests" ON public.requests
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- =====================================================
-- TABELA: notifications
-- Sistema de notificações
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON public.books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_locations_book_id ON public.meeting_locations(book_id);

CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON public.requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON public.requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_book_id ON public.requests(book_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que têm updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONFIGURAÇÃO CONCLUÍDA
-- =====================================================
SELECT 'BookExchange - Banco de dados configurado com sucesso!' as status;