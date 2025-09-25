-- =====================================================
-- CORREÇÃO: Políticas RLS para meeting_locations
-- Execute se houver problemas de permissão com locais de encontro
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "meeting_locations_select_policy" ON public.meeting_locations;
DROP POLICY IF EXISTS "meeting_locations_insert_policy" ON public.meeting_locations;
DROP POLICY IF EXISTS "meeting_locations_update_policy" ON public.meeting_locations;
DROP POLICY IF EXISTS "meeting_locations_delete_policy" ON public.meeting_locations;
DROP POLICY IF EXISTS "Anyone can view meeting locations" ON public.meeting_locations;
DROP POLICY IF EXISTS "Users can manage locations for own books" ON public.meeting_locations;

-- Habilitar RLS
ALTER TABLE public.meeting_locations ENABLE ROW LEVEL SECURITY;

-- Criar políticas corretas
CREATE POLICY "Anyone can view meeting locations" ON public.meeting_locations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert locations for own books" ON public.meeting_locations
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = meeting_locations.book_id 
            AND books.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update locations for own books" ON public.meeting_locations
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = meeting_locations.book_id 
            AND books.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete locations for own books" ON public.meeting_locations
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE books.id = meeting_locations.book_id 
            AND books.owner_id = auth.uid()
        )
    );

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'meeting_locations'
ORDER BY policyname;

SELECT 'Políticas RLS para meeting_locations corrigidas!' as status;