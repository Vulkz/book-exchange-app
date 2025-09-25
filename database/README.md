# 🗄️ Database - BookExchange

Esta pasta contém todos os scripts SQL organizados para o sistema de troca de livros.

## 📁 Estrutura

```
database/
├── setup/                  # Scripts de configuração inicial
│   ├── 01_initial_setup.sql    # 🏗️ Configuração completa do banco
│   └── 02_sample_data.sql      # 📊 Dados de exemplo (opcional)
├── fixes/                  # Scripts de correção
│   ├── fix_notifications_structure.sql  # 🔧 Corrige tabela notifications
│   └── fix_meeting_locations_rls.sql   # 🔒 Corrige políticas RLS
└── tests/                  # Scripts de teste e diagnóstico
    ├── diagnostic.sql         # 🔍 Diagnóstico completo do sistema
    └── cleanup.sql           # 🧹 Limpeza de dados de teste
```

## 🚀 Como Usar

### Para um projeto novo:

1. **Configure o banco inicial:**
   ```sql
   -- Execute no SQL Editor do Supabase
   \i database/setup/01_initial_setup.sql
   ```

2. **[Opcional] Adicione dados de exemplo:**
   ```sql
   -- Apenas para desenvolvimento/teste
   \i database/setup/02_sample_data.sql
   ```

3. **Verifique se tudo funcionou:**
   ```sql
   \i database/tests/diagnostic.sql
   ```

### Para corrigir problemas:

- **Erro com notificações:** `database/fixes/fix_notifications_structure.sql`
- **Erro de permissão RLS:** `database/fixes/fix_meeting_locations_rls.sql`

### Para testar o sistema:

- **Diagnóstico completo:** `database/tests/diagnostic.sql`
- **Limpar dados de teste:** `database/tests/cleanup.sql`

## 📋 Scripts de Configuração

### 🏗️ 01_initial_setup.sql
- ✅ Cria todas as tabelas necessárias
- ✅ Configura políticas RLS (Row Level Security)
- ✅ Cria índices para performance
- ✅ Configura triggers para updated_at
- ✅ Estabelece relacionamentos entre tabelas

**Tabelas criadas:**
- `profiles` - Perfis dos usuários
- `books` - Livros disponíveis para troca  
- `meeting_locations` - Locais de encontro
- `requests` - Solicitações de troca
- `notifications` - Sistema de notificações

### 📊 02_sample_data.sql
- ✅ Insere usuários de exemplo
- ✅ Adiciona livros variados
- ✅ Cria locais de encontro
- ✅ Gera solicitações de teste
- ✅ Adiciona notificações de exemplo

**⚠️ Importante:** Substitua os IDs de usuário pelos valores reais do seu `auth.users`

## 🔧 Scripts de Correção

### fix_notifications_structure.sql
**Use quando:**
- Erro: "table 'notifications' doesn't exist"
- Erro: "column 'read' does not exist"
- Problemas com sistema de notificações

### fix_meeting_locations_rls.sql
**Use quando:**
- Erro de permissão ao salvar locais de encontro
- Problemas com RLS em meeting_locations
- "access denied" ao editar livros

## 🧪 Scripts de Teste

### diagnostic.sql
**Executa verificações completas:**
- ✅ Estrutura das tabelas
- ✅ Colunas críticas
- ✅ Políticas RLS
- ✅ Índices de performance
- ✅ Integridade referencial
- ✅ Últimas atividades

### cleanup.sql
**Para limpar dados de teste:**
- ⚠️ Remove TODOS os dados
- 🔒 Requer descomentário manual (segurança)
- 🧪 Apenas para desenvolvimento

## 🗑️ Arquivos Removidos

Os seguintes arquivos foram **consolidados** nos scripts organizados acima:

- ❌ `debug_requests_table.sql` → `diagnostic.sql`
- ❌ `fix_notifications_simple.sql` → `fix_notifications_structure.sql`
- ❌ `fix_meeting_locations_rls_v2.sql` → `fix_meeting_locations_rls.sql`
- ❌ `populate_data.sql` → `02_sample_data.sql`
- ❌ `test_system.sql` → `diagnostic.sql`
- ❌ `scripts/005_full_schema.sql` → `01_initial_setup.sql`
- ❌ E muitos outros arquivos duplicados/obsoletos

## ✅ Verificação de Sucesso

Após executar os scripts, você deve ter:

1. **5 tabelas principais** funcionando
2. **Políticas RLS** configuradas
3. **Índices** para performance
4. **Sistema de notificações** operacional
5. **0 erros** no diagnóstico

## 🆘 Solução de Problemas

### Erro: "No API key found"
- Verifique o arquivo `.env.local`
- Confirme as variáveis do Supabase

### Erro: "access denied for table"
- Execute o script de correção RLS apropriado
- Verifique se o usuário está autenticado

### Erro: "column does not exist"
- Execute `diagnostic.sql` para identificar o problema
- Use o script de correção apropriado

### Erro: "table does not exist"
- Execute `01_initial_setup.sql` novamente
- Verifique se você está no projeto/database correto

## 📞 Suporte

Se algum script não funcionar:

1. Execute `diagnostic.sql` primeiro
2. Use o script de correção apropriado
3. Execute `diagnostic.sql` novamente para confirmar
4. Se persistir, verifique as configurações do Supabase

---

**📝 Nota:** Todos os scripts são idempotentes (podem ser executados múltiplas vezes sem problemas).