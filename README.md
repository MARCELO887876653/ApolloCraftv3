# 🛡️ ApolloCraft Security

> Sistema de segurança empresarial, verificação de contas Bedrock, prevenção ativa contra VPN/Proxy/Tor, detecção de contas alternativas (Anti-Alt) e painel administrativo para o servidor **ApolloCraft Minecraft Bedrock** (`play.apollocraft.online:19132`).

---

## 🏛️ Arquitetura do Sistema

```
     ┌────────────────────────────────────────────────────────┐
     │           Minecraft Bedrock Server (Nó BDS)            │
     │      (Packet Interceptor / Event Lifecycle Engine)     │
     └──────────────────────────┬─────────────────────────────┘
                                │ HMAC-SHA256 Signed HTTP
                                │ Replay-Protected (Timestamp + Nonce)
                                ▼
     ┌────────────────────────────────────────────────────────┐
     │             ApolloCraft Security API Layer             │
     │                 (Next.js App Router)                   │
     │             Hospedado no Vercel Serverless             │
     └──────────────────────────┬─────────────────────────────┘
                                │ Service-Role Client
                                │ Strict RLS & Atomic RPCs
                                ▼
     ┌────────────────────────────────────────────────────────┐
     │                  Supabase PostgreSQL                   │
     │          (27 Tabelas Relacionais + Migrations)         │
     │      - Controle de Jogadores, Sessões e Identidades    │
     │      - Cache de Reputação de IP e GeoIP/ASN            │
     │      - Heurística de Contas Secundárias (Anti-Alt)     │
     │      - Logs Imutáveis de Auditoria (Append-Only)       │
     └────────────────────────────────────────────────────────┘
```

---

## 🚀 Funcionalidades Principais

### 1. Verificação Segura de Jogadores
- Geração in-game de códigos no formato amigável `APOLLO-XXXX-XXXX`.
- Validação atômica via PostgreSQL RPC (`verify_player_code_atomic`) para eliminar concorrência e condições de corrida (*race conditions*).
- Expiração configurável (padrão 15 min), limite rígido de tentativas incorretas (máx 5) e auto-invalidação.

### 2. Prevenção Ativa contra VPN, Proxy & Tor
- Classificação de IPs por provedor ASN, tipo de rede (*Data Center*, *Residential*, *Mobile*, *Tor Exit Node*).
- Cache interno de reputação de IP configurável (padrão 30 dias) para reduzir chamadas a APIs de inteligência externas.
- Modos de operação: `BLOCK` (bloqueio imediato), `RESTRICT` (verificação obrigatória com quarentena), `MONITOR` (apenas logs) ou `OFF`.

### 3. Detecção de Contas Alternativas (Anti-Alt & Ban Evasion)
- Correlação multidimensional usando hashes HMAC de IP, identificadores de dispositivo (*Client ID*, *Platform*, *Device Model*).
- Cálculo heurístico de pontuação de confiança (*confidence score* 0 a 100%).
- Alerta em tempo real quando uma nova conta tenta entrar com credenciais de rede/hardware ligadas a um usuário com banimento ativo.

### 4. Gestão Disciplinar & Punições
- Punições permanentes e temporárias com expiração automática.
- Separação estrita de **Motivo Público** (exibido na tela de kick do jogador) e **Motivo Interno** (evidências restritas à moderação).
- Revogação auditada com justificativa obrigatória.

### 5. Painel de Controle Administrativo (RBAC)
- 3 papéis hierárquicos: `OWNER`, `ADMIN` e `MODERATOR`.
- **Visão 360 do Jogador**: perfil completo com dispositivos, conexões de IP (com mascaramento conforme permissão), sessões de verificação, vínculos de alts e histórico disciplinar.
- **Configuração Inicial do Primeiro Owner**: endpoint `/api/setup` e tela `/admin/setup` que aceitam criação apenas quando o banco está zerado, desabilitando-se automaticamente após o primeiro registro.

---

## 📦 Estrutura do Repositório

```
├── app/
│   ├── api/
│   │   ├── admin/             # Endpoints administrativos protegidos por RBAC
│   │   ├── auth/              # Autenticação (login, logout, me)
│   │   ├── cron/              # Rotinas agendadas (expiração e limpeza)
│   │   ├── minecraft/         # Endpoints de integração Bedrock com HMAC
│   │   ├── setup/             # Bootstrap inicial do primeiro OWNER
│   │   └── verificar/         # Endpoint público de verificação atômica
│   ├── admin/                 # Páginas do Painel Administrativo
│   ├── verificar/             # Página pública de verificação
│   ├── termos/                # Termos de Serviço
│   └── privacidade/           # Política de Privacidade
├── components/                # Componentes visuais e páginas
├── lib/
│   ├── auth/                  # Sessões e resolução de permissões
│   ├── permissions/           # RBAC e catálogo de permissões
│   ├── security/              # Validação Zod, HMAC, IP hashing e rate limit
│   ├── supabase/              # Clientes Supabase (Anon e Service Role)
│   └── types/                 # Tipos TypeScript do banco de dados
└── supabase/
    └── migrations/            # Scripts SQL (001 a 004) prontos para execução
```

---

## 🛠️ Como Instalar e Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Executar o servidor de desenvolvimento
npm run dev
```

Consulte [DEPLOYMENT.md](./DEPLOYMENT.md) para o guia completo de implantação no **GitHub**, **Vercel** e **Supabase**.
