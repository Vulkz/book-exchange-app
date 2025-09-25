/**
 * =====================================================
 * CONSTANTES DA APLICAÇÃO - BOOKEXCHANGE
 * Valores constantes utilizados em toda a aplicação
 * =====================================================
 */

// =====================================================
// CATEGORIAS DE LIVROS
// =====================================================

/**
 * Lista de categorias disponíveis para classificar livros
 * Usada nos formulários de adição/edição de livros
 */
export const BOOK_CATEGORIES = [
  'Ficção',           // Romances, novelas, contos de ficção
  'Romance',          // Literatura romântica
  'Mistério',         // Thrillers, policiais, suspense
  'Fantasia',         // Literatura fantástica, magia, criaturas míticas
  'Ficção Científica', // Sci-fi, futurismo, tecnologia
  'Biografia',        // Histórias de vida de pessoas reais
  'Autobiografia',    // Memórias escritas pela própria pessoa
  'História',         // Livros históricos, eventos passados
  'Ciência',          // Divulgação científica, pesquisa
  'Tecnologia',       // Livros sobre programação, inovação, TI
  'Autoajuda',        // Desenvolvimento pessoal, motivação
  'Negócios',         // Empreendedorismo, gestão, economia
  'Psicologia',       // Comportamento humano, mente
  'Filosofia',        // Pensamento filosófico, ética
  'Religião',         // Textos religiosos, espiritualidade
  'Poesia',           // Versos, sonetos, literatura poética
  'Teatro',           // Peças teatrais, dramaturgia
  'Infantil',         // Literatura para crianças
  'Juvenil',          // Literatura para adolescentes
  'Educação',         // Pedagogia, ensino, aprendizagem
  'Culinária',        // Receitas, gastronomia
  'Saúde',            // Medicina, bem-estar, fitness
  'Arte',             // História da arte, técnicas artísticas
  'Música',           // Teoria musical, biografias de músicos
  'Viagem',           // Guias de viagem, relatos de viajantes
  'Esportes',         // Modalidades esportivas, atletas
  'Humor',            // Comédia, sátira, livros engraçados
  'Outro'             // Categoria genérica para casos especiais
] as const

// Tipo derivado das categorias para uso no TypeScript
export type BookCategory = typeof BOOK_CATEGORIES[number]

// =====================================================
// STATUS DE SOLICITAÇÕES
// =====================================================

/**
 * Status possíveis para solicitações de troca de livros
 * Corresponde aos valores aceitos no banco de dados
 */
export const REQUEST_STATUS = {
  /** Solicitação ainda não foi respondida pelo proprietário */
  PENDING: 'pending' as const,
  /** Proprietário aceitou a solicitação de troca */
  ACCEPTED: 'accepted' as const,
  /** Proprietário recusou a solicitação de troca */
  REJECTED: 'rejected' as const,
} as const

// Tipo derivado dos status para uso no TypeScript
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS]

// =====================================================
// TIPOS DE NOTIFICAÇÃO
// =====================================================

/**
 * Tipos de notificação suportados pelo sistema
 * Cada tipo tem uma apresentação visual e comportamento específico
 */
export const NOTIFICATION_TYPES = {
  /** Nova solicitação de livro recebida */
  BOOK_REQUEST: 'book_request' as const,
  /** Solicitação de troca foi aceita */
  REQUEST_ACCEPTED: 'request_accepted' as const,
  /** Solicitação de troca foi recusada */
  REQUEST_REJECTED: 'request_rejected' as const,
  /** Nova mensagem no chat (funcionalidade futura) */
  NEW_MESSAGE: 'new_message' as const,
  /** Notificação do sistema (manutenção, novidades, etc.) */
  SYSTEM: 'system' as const,
} as const

// Tipo derivado dos tipos de notificação
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// =====================================================
// ROTAS DA APLICAÇÃO
// =====================================================

/**
 * Caminhos das páginas da aplicação
 * Centraliza as rotas para facilitar manutenção e navegação
 */
export const ROUTES = {
  /** Página inicial - explorar livros disponíveis */
  HOME: '/',
  /** Página de login */
  LOGIN: '/login',
  /** Página de registro de nova conta */
  REGISTER: '/register',
  /** Página de perfil do usuário */
  PROFILE: '/profile',
  /** Página para gerenciar meus livros */
  MY_BOOKS: '/my-books',
  /** Página de solicitações (enviadas e recebidas) */
  REQUESTS: '/requests',
} as const

// Tipo derivado das rotas
export type AppRoute = typeof ROUTES[keyof typeof ROUTES]

// =====================================================
// CONFIGURAÇÕES DE UI
// =====================================================

/**
 * Configurações visuais e de comportamento da interface
 */
export const UI_CONFIG = {
  /** Tempo de exibição dos toasts em milissegundos */
  TOAST_DURATION: 5000,
  
  /** Limite de caracteres para descrições de livros */
  BOOK_DESCRIPTION_MAX_LENGTH: 500,
  
  /** Limite de caracteres para mensagens de solicitação */
  REQUEST_MESSAGE_MAX_LENGTH: 300,
  
  /** Limite de caracteres para biografia do usuário */
  BIO_MAX_LENGTH: 200,
  
  /** Número máximo de locais de encontro por livro */
  MAX_MEETING_LOCATIONS: 5,
  
  /** Número de livros exibidos por página na listagem */
  BOOKS_PER_PAGE: 12,
  
  /** Tempo em milissegundos para debounce de busca */
  SEARCH_DEBOUNCE_MS: 300,
} as const

// =====================================================
// MENSAGENS PADRÃO
// =====================================================

/**
 * Mensagens de feedback padronizadas para o usuário
 * Mantém consistência na comunicação da aplicação
 */
export const MESSAGES = {
  /** Mensagens de sucesso */
  SUCCESS: {
    BOOK_ADDED: 'Livro adicionado com sucesso!',
    BOOK_UPDATED: 'Livro atualizado com sucesso!',
    BOOK_DELETED: 'Livro removido com sucesso!',
    REQUEST_SENT: 'Solicitação enviada com sucesso!',
    REQUEST_ACCEPTED: 'Solicitação aceita com sucesso!',
    REQUEST_REJECTED: 'Solicitação recusada com sucesso!',
    PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
    LOGIN_SUCCESS: 'Login realizado com sucesso!',
    REGISTER_SUCCESS: 'Conta criada com sucesso!',
  },
  
  /** Mensagens de erro */
  ERROR: {
    GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
    UNAUTHORIZED: 'Você precisa estar logado para realizar esta ação.',
    BOOK_NOT_FOUND: 'Livro não encontrado.',
    USER_NOT_FOUND: 'Usuário não encontrado.',
    REQUEST_NOT_FOUND: 'Solicitação não encontrada.',
    INVALID_EMAIL: 'Email inválido.',
    WEAK_PASSWORD: 'Senha deve ter pelo menos 6 caracteres.',
    EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',
    FORM_VALIDATION: 'Por favor, corrija os erros no formulário.',
  },
  
  /** Mensagens informativas */
  INFO: {
    NO_BOOKS: 'Nenhum livro encontrado.',
    NO_REQUESTS: 'Você não tem solicitações no momento.',
    NO_NOTIFICATIONS: 'Nenhuma notificação.',
    LOADING: 'Carregando...',
    CONFIRM_DELETE: 'Tem certeza que deseja remover este item?',
    LOGOUT_CONFIRM: 'Deseja sair da sua conta?',
  }
} as const

// =====================================================
// CONFIGURAÇÕES DE VALIDAÇÃO
// =====================================================

/**
 * Regras de validação para formulários
 */
export const VALIDATION_RULES = {
  /** Comprimento mínimo de senha */
  PASSWORD_MIN_LENGTH: 6,
  
  /** Comprimento mínimo para nome de usuário */
  USERNAME_MIN_LENGTH: 2,
  
  /** Comprimento máximo para nome de usuário */
  USERNAME_MAX_LENGTH: 50,
  
  /** Comprimento mínimo para título de livro */
  BOOK_TITLE_MIN_LENGTH: 1,
  
  /** Comprimento máximo para título de livro */
  BOOK_TITLE_MAX_LENGTH: 100,
  
  /** Comprimento máximo para nome de autor */
  AUTHOR_MAX_LENGTH: 100,
  
  /** Padrão regex para validação de email */
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** Padrão regex para validação de URL */
  URL_PATTERN: /^https?:\/\/.+\..+/,
} as const

// =====================================================
// CONFIGURAÇÕES DE PAGINAÇÃO
// =====================================================

/**
 * Configurações para paginação de listas
 */
export const PAGINATION = {
  /** Número padrão de itens por página */
  DEFAULT_PAGE_SIZE: 12,
  
  /** Opções de itens por página disponíveis */
  PAGE_SIZE_OPTIONS: [6, 12, 24, 48] as const,
  
  /** Número máximo de páginas exibidas na navegação */
  MAX_VISIBLE_PAGES: 5,
} as const