-- =====================================================
-- BOOKEXCHANGE - DADOS DE EXEMPLO
-- Execute este script APÓS o initial_setup.sql para popular com dados de teste
-- =====================================================

-- ⚠️ ATENÇÃO: Este script é apenas para desenvolvimento/teste
-- NÃO execute em produção

-- =====================================================
-- INSERIR USUÁRIOS DE EXEMPLO
-- =====================================================
-- Nota: Os perfis serão criados automaticamente quando os usuários se registrarem
-- Este script apenas cria dados fictícios para teste

-- Inserir perfis de exemplo (substitua pelos IDs reais dos usuários do seu auth.users)
INSERT INTO public.profiles (id, email, display_name, bio) VALUES
    ('00000000-0000-0000-0000-000000000001', 'alice@exemplo.com', 'Alice Silva', 'Amo ler ficção científica e fantasia. Sempre em busca de novos mundos literários!'),
    ('00000000-0000-0000-0000-000000000002', 'bob@exemplo.com', 'Bob Santos', 'Leitor voraz de biografias e livros de história. Vamos trocar conhecimento!'),
    ('00000000-0000-0000-0000-000000000003', 'carol@exemplo.com', 'Carol Lima', 'Apaixonada por romances e literatura brasileira. Adoro descobrir novos autores!')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERIR LIVROS DE EXEMPLO
-- =====================================================
INSERT INTO public.books (title, author, description, category, image_url, owner_id) VALUES
    (
        '1984',
        'George Orwell',
        'Um clássico da literatura distópica que retrata uma sociedade totalitária onde a liberdade individual é suprimida.',
        'Ficção',
        'https://m.media-amazon.com/images/I/71rpa1-kyvL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'O Senhor dos Anéis: A Sociedade do Anel',
        'J.R.R. Tolkien',
        'O primeiro volume da épica trilogia que narra a jornada de Frodo para destruir o Um Anel.',
        'Fantasia',
        'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        'Steve Jobs',
        'Walter Isaacson',
        'A biografia definitiva do cofundador da Apple, baseada em mais de quarenta entrevistas com Jobs.',
        'Biografia',
        'https://m.media-amazon.com/images/I/81VStYnDGrL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000002'
    ),
    (
        'Uma Breve História do Tempo',
        'Stephen Hawking',
        'Uma introdução acessível aos conceitos fundamentais da física moderna e cosmologia.',
        'Ciência',
        'https://m.media-amazon.com/images/I/A1Q-Fkd9UFL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000002'
    ),
    (
        'Dom Casmurro',
        'Machado de Assis',
        'Um dos maiores clássicos da literatura brasileira, narrando a história de Bentinho e Capitu.',
        'Romance',
        'https://m.media-amazon.com/images/I/61fxXjT3zfL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000003'
    ),
    (
        'O Cortiço',
        'Aluísio Azevedo',
        'Romance naturalista que retrata a vida em um cortiço no Rio de Janeiro do século XIX.',
        'Romance',
        'https://m.media-amazon.com/images/I/71B2rZ1HPUL._AC_UF1000,1000_QL80_.jpg',
        '00000000-0000-0000-0000-000000000003'
    );

-- =====================================================
-- INSERIR LOCAIS DE ENCONTRO
-- =====================================================
INSERT INTO public.meeting_locations (book_id, location)
SELECT 
    b.id,
    loc.location
FROM public.books b
CROSS JOIN (
    VALUES 
        ('Shopping Center - Praça de Alimentação'),
        ('Biblioteca Municipal'),
        ('Estação de Metrô Central'),
        ('Universidade - Campus Principal'),
        ('Parque da Cidade - Entrada Principal')
) AS loc(location)
WHERE b.owner_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);

-- Adicionar locais específicos para alguns livros
INSERT INTO public.meeting_locations (book_id, location)
SELECT b.id, 'Livraria Cultura - Conjunto Nacional'
FROM public.books b
WHERE b.title IN ('1984', 'Dom Casmurro');

INSERT INTO public.meeting_locations (book_id, location)
SELECT b.id, 'Café com Livros - Rua Augusta'
FROM public.books b
WHERE b.title IN ('O Senhor dos Anéis: A Sociedade do Anel', 'O Cortiço');

-- =====================================================
-- INSERIR ALGUMAS SOLICITAÇÕES DE EXEMPLO
-- =====================================================
INSERT INTO public.requests (requester_id, owner_id, book_id, message, status, created_at) 
SELECT 
    '00000000-0000-0000-0000-000000000002' as requester_id,
    b.owner_id,
    b.id as book_id,
    'Olá! Estou muito interessado neste livro. Podemos combinar uma troca?' as message,
    'pending' as status,
    NOW() - INTERVAL '2 days' as created_at
FROM public.books b 
WHERE b.title = '1984';

INSERT INTO public.requests (requester_id, owner_id, book_id, message, status, created_at)
SELECT 
    '00000000-0000-0000-0000-000000000003' as requester_id,
    b.owner_id,
    b.id as book_id,
    'Esse livro está na minha lista de leitura há muito tempo! Você aceita trocar?' as message,
    'accepted' as status,
    NOW() - INTERVAL '1 day' as created_at
FROM public.books b 
WHERE b.title = 'Steve Jobs';

-- =====================================================
-- INSERIR NOTIFICAÇÕES DE EXEMPLO
-- =====================================================
INSERT INTO public.notifications (user_id, type, title, message, read, created_at) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'book_request',
        'Nova solicitação de troca',
        'Bob Santos solicitou o livro "1984". Confira os detalhes na página de solicitações.',
        false,
        NOW() - INTERVAL '2 days'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'request_accepted',
        'Solicitação aceita!',
        'Carol Lima aceitou sua solicitação para o livro "Steve Jobs". Entre em contato para combinar a troca.',
        false,
        NOW() - INTERVAL '1 day'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'book_request',
        'Novo interesse no seu livro',
        'Alguém demonstrou interesse no seu livro "Dom Casmurro".',
        true,
        NOW() - INTERVAL '3 hours'
    );

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================
SELECT 'Dados de exemplo inseridos com sucesso!' as status;

SELECT 'Resumo dos dados:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_books FROM public.books;
SELECT COUNT(*) as total_locations FROM public.meeting_locations;
SELECT COUNT(*) as total_requests FROM public.requests;
SELECT COUNT(*) as total_notifications FROM public.notifications;

-- =====================================================
-- AVISO IMPORTANTE
-- =====================================================
SELECT '⚠️ LEMBRE-SE: Substitua os IDs dos usuários pelos IDs reais do seu auth.users!' as aviso;