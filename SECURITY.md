# 🔒 Manual de Arquitetura de Segurança (ApolloCraft Security)

Este documento descreve os mecanismos de defesa ativos implementados no **ApolloCraft Security** para proteger o ecossistema Minecraft Bedrock contra ataques cibernéticos, fraudes de identidade e invasões.

---

## 1. Autenticação dos Nós Bedrock (HMAC-SHA256 & Anti-Replay)

Todas as requisições originadas do servidor Bedrock em `/api/minecraft/*` utilizam autenticação criptográfica simétrica por assinatura de mensagem:

```
Payload JSON + Timestamp + Nonce
              │
              ▼
   HMAC-SHA256(Secret)
              │
              ▼
Header: x-apollo-signature: t=1726329600,n=a8f9c1...,s=e3b0c44...
```

### Regras de Validação:
1. **Janela de Tolerância Temporal**: Rejeição imediata se `|now - timestamp| > 300 segundos` (5 minutos) para combater ataques de repetição (*replay attacks*).
2. **Registro de Nonce**: Cada requisição deve possuir um *nonce* criptográfico único de pelo menos 16 caracteres. O nonce é checado no banco; repetições são descartadas com `401 Unauthorized`.
3. **Assinatura de Conteúdo**: O hash calcula o corpo exato da requisição concatenado aos parâmetros de tempo e nonce.

---

## 2. Verificação Atômica de Códigos (Prevenção de Race Conditions)

Para impedir ataques de força bruta concorrente ou reutilização simultânea de códigos por múltiplos nós ou conexões:

- A validação ocorre através da função PostgreSQL atômica:
  ```sql
  SELECT * FROM verify_player_code_atomic(p_gamertag, p_code, p_ip_address, p_user_agent);
  ```
- O registro é bloqueado com `FOR UPDATE` durante a transação.
- Se o código estiver incorreto:
  - Incrementa o contador `attempts`.
  - Se `attempts >= max_attempts` (padrão 5), o código é imediatamente marcado como `EXPIRED` e invalidado.
- Se o código for válido:
  - O código é marcado como `USED` e timestampado.
  - O status do jogador é atualizado para `VERIFIED`.

---

## 3. Rate Limiting Persistente Baseado em Banco

Diferente de limitadores de taxa baseados em memória (que falham em ambientes serverless multi-instância como a Vercel), o ApolloCraft utiliza a tabela `rate_limits`:

- Chave composta: `identifier + action` (ex: `ip:203.0.113.19:verify_code`).
- Janelas temporais com reset automático.
- Resposta `429 Too Many Requests` com cabeçalho `Retry-After`.

---

## 4. Proteção contra Vazamento de Chaves e Anonimização de Dados Sensíveis

- `SUPABASE_SERVICE_ROLE_KEY` é estritamente de uso do servidor e nunca possui o prefixo `NEXT_PUBLIC_`.
- Endereços IP reais dos jogadores são processados com `HMAC-SHA256(ip, PEPPER_SECRET)` para correlação de contas sem necessidade de retenção de IPs em texto puro por períodos excessivos.
- Moderadores com nível `MODERATOR` visualizam endereços IP com máscara `203.0.***.***`. Somente usuários com permissão explícita `security.view_raw_ip` (papéis `ADMIN` ou `OWNER`) podem inspecionar o endereço desmascarado.

---

## 5. Matriz de Decisão Anti-VPN

| Classificação de IP | Modo BLOCK | Modo RESTRICT | Modo MONITOR |
| :--- | :--- | :--- | :--- |
| **Residencial Limpo** | Permitido | Permitido | Permitido |
| **Data Center / Hosting** | Kick com mensagem explicativa | Exige verificação e revisão | Log e elevação de risco (+40) |
| **Proxy Público / VPN** | Kick imediato | Bloqueio preventivo temporário | Log e elevação de risco (+50) |
| **Nó de Saída Tor** | Kick imediato com alerta | Kick imediato | Log crítico e notificação staff |
