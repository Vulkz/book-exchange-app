# 📚 BookExchange - Sistema de Troca de Livros

Sistema moderno e completo para troca de livros entre usuários, desenvolvido com Next.js 14 e Supabase.

## ✨ Funcionalidades

### 📖 **Gerenciamento de Livros**
- ✅ Adicionar livros com informações completas
- ✅ Editar detalhes dos seus livros
- ✅ Upload de imagens de capa
- ✅ Categorização por gêneros
- ✅ Múltiplos locais de encontro por livro

### 🔄 **Sistema de Solicitações**
- ✅ Solicitar troca de livros de outros usuários
- ✅ Gerenciar solicitações recebidas (aceitar/recusar)
- ✅ Visualizar histórico de solicitações enviadas
- ✅ Status em tempo real das solicitações

### 🔔 **Notificações Inteligentes**
- ✅ Notificações em tempo real
- ✅ Contador de mensagens não lidas
- ✅ Ações diretas das notificações
- ✅ Histórico completo de atividades

### 👤 **Perfil de Usuário**
- ✅ Edição de informações pessoais
- ✅ Avatar personalizado
- ✅ Biografia e interesses
- ✅ Histórico de trocas

### 🔒 **Segurança e Autenticação**
- ✅ Autenticação segura com Supabase Auth
- ✅ Row Level Security (RLS) configurado
- ✅ Proteção de rotas automática
- ✅ Validação de dados robusta

## 🛠️ Tecnologias

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Deployment:** Vercel Ready

## 📁 Estrutura do Projeto

```
book-exchange-app/
├── app/                     # App Router (Next.js 14)
│   ├── (authenticated)/    # Rotas protegidas
│   │   ├── my-books/      # Gerenciar meus livros
│   │   ├── requests/      # Solicitações enviadas/recebidas
│   │   └── profile/       # Perfil do usuário
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   └── layout.tsx         # Layout principal
├── components/
│   ├── ui/               # Componentes base reutilizáveis
│   ├── layout/           # Componentes de layout
│   ├── forms/            # Formulários específicos
│   └── features/         # Componentes por funcionalidade
├── hooks/                # Custom hooks organizados
├── lib/                  # Configurações e utilitários
├── types/                # Definições TypeScript
├── utils/                # Funções utilitárias
└── database/             # Scripts SQL organizados
    ├── setup/           # Configuração inicial
    ├── fixes/           # Scripts de correção
    └── tests/           # Diagnóstico e testes
```

## 🚀 Instalação

### 1. **Clone o projeto**
```bash
git clone <repository-url>
cd book-exchange-app
```

### 2. **Instale as dependências**
```bash
npm install
# ou
pnpm install
# ou  
yarn install
```

### 3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. **Configure o banco de dados**
Execute no SQL Editor do Supabase:
```sql
-- 1. Configuração inicial (obrigatório)
\i database/setup/01_initial_setup.sql

-- 2. Dados de exemplo (opcional - apenas para desenvolvimento)
\i database/setup/02_sample_data.sql

-- 3. Verificar se tudo funcionou
\i database/tests/diagnostic.sql
```

### 5. **Execute o projeto**
```bash
npm run dev
# ou
pnpm dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🗄️ Banco de Dados

### Configuração Rápida
```sql
-- Execute no Supabase SQL Editor
\i database/setup/01_initial_setup.sql
```

### Scripts Disponíveis
- **`setup/01_initial_setup.sql`** - Configuração completa do banco
- **`setup/02_sample_data.sql`** - Dados de exemplo para teste
- **`tests/diagnostic.sql`** - Diagnóstico completo do sistema
- **`fixes/`** - Scripts de correção para problemas específicos

Veja a [documentação completa do banco](database/README.md) para mais detalhes.

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev        # Servidor de desenvolvimento

# Build
npm run build      # Build para produção
npm run start      # Servidor de produção

# Linting
npm run lint       # Verificar código
```

## 🎯 Como Usar

### Para Usuários:
1. **Cadastre-se** na plataforma
2. **Adicione seus livros** com fotos e descrições
3. **Explore** a biblioteca de outros usuários
4. **Solicite trocas** dos livros que interessam
5. **Gerencie** suas solicitações recebidas
6. **Combine** locais de encontro para a troca

### Para Desenvolvedores:
1. **Clone** o repositório
2. **Configure** o Supabase
3. **Execute** os scripts de banco
4. **Desenvolva** novas funcionalidades
5. **Teste** com dados de exemplo

## 🔧 Solução de Problemas

### Erro: "No API key found"
```bash
# Verifique se o .env.local existe e tem as variáveis corretas
cat .env.local
```

### Erro: "table does not exist"
```sql
-- Execute a configuração inicial
\i database/setup/01_initial_setup.sql
```

### Erro de permissão (RLS)
```sql
-- Execute o diagnóstico primeiro
\i database/tests/diagnostic.sql

-- Depois use o script de correção apropriado
\i database/fixes/fix_meeting_locations_rls.sql
```

### Sistema não funciona
```sql
-- Diagnóstico completo
\i database/tests/diagnostic.sql
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
- Compatible com Netlify, Railway, etc.
- Configure as variáveis de ambiente
- Execute `npm run build`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adicionar nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎉 Funcionalidades Futuras

- [ ] Chat entre usuários
- [ ] Sistema de avaliações
- [ ] Lista de desejos
- [ ] Recomendações por IA
- [ ] App mobile (React Native)
- [ ] Sistema de pontuação/gamificação

## 📞 Suporte

- 📧 **Email:** seu-email@exemplo.com
- 🐛 **Issues:** [GitHub Issues](link-para-issues)
- 📖 **Documentação:** [Wiki do Projeto](link-para-wiki)

---

**Desenvolvido com ❤️ usando Next.js e Supabase**