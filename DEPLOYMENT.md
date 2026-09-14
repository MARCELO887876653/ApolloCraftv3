# 🚀 Guia de Implantação e Deploy

Este documento detalha o procedimento para levar o **ApolloCraft Security** do repositório para o ambiente de produção na **Vercel**, conectando ao **Supabase** e vinculando ao domínio oficial `https://apollocraft.online`.

---

## 1. Configuração do Banco de Dados no Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase.
3. Execute as migrações na ordem estrita:
   - `supabase/migrations/001_initial_schema.sql` (Estrutura de tabelas e índices)
   - `supabase/migrations/002_row_level_security.sql` (Políticas de segurança RLS)
   - `supabase/migrations/003_functions_and_rpc.sql` (Funções atômicas e manutenção)
   - `supabase/migrations/004_seed_data.sql` (Carga inicial de permissões e regras padrão)
4. Acesse **Settings -> API** e anote:
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role secret key` (`SUPABASE_SERVICE_ROLE_KEY`) ⚠️ *Nunca exponha esta chave publicamente!*

---

## 2. Publicação no GitHub

```bash
git init
git add .
git commit -m "feat: ApolloCraft Security complete fullstack implementation"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/apollocraft-security.git
git push -u origin main
```

---

## 3. Implantação na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com) e clique em **Add New -> Project**.
2. Importe o repositório `apollocraft-security` do GitHub.
3. Em **Environment Variables**, adicione todas as variáveis obrigatórias:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada de serviço | `eyJhbGciOi...` (Segredo) |
| `MINECRAFT_API_SECRET` | Chave mestra HMAC-SHA256 para nós BDS | Chave aleatória de 64 caracteres |
| `NEXTAUTH_SECRET` | Chave de assinatura de sessão de admin | String aleatória de 32+ caracteres |
| `CRON_SECRET` | Token de autorização para endpoints cron | Token secreto para rotinas Vercel Cron |
| `NEXT_PUBLIC_APP_URL` | URL pública de produção | `https://apollocraft.online` |

4. Clique em **Deploy**.

---

## 4. Configuração de Domínio Personalizado

1. No projeto na Vercel, vá em **Settings -> Domains**.
2. Adicione `apollocraft.online` e `www.apollocraft.online`.
3. Configure os apontamentos DNS no seu registrador:
   - **Tipo A**: `@` -> `76.76.21.21` (IP Anycast da Vercel)
   - **Tipo CNAME**: `www` -> `cname.vercel-dns.com`

---

## 5. Primeiro Acesso Administrativo (Bootstrap OWNER)

1. Assim que o deploy for concluído, abra `https://apollocraft.online/admin/setup`.
2. Como o banco está inicializado sem nenhum proprietário, o formulário de registro mestre estará disponível.
3. Cadastre seu nome, e-mail e senha mestra.
4. Após o envio, a conta receberá a função mestre `OWNER` e o endpoint `/api/setup` será **automaticamente bloqueado** para futuras requisições.
