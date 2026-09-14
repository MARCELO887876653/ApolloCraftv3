# 🎮 Guia de Integração para Minecraft Bedrock (ApolloCraft)

Este documento fornece a especificação técnica e exemplos de código prontos para conectar o servidor **Minecraft Bedrock Dedicated Server (BDS)** ou proxies (como Cloudburst/PocketMine/Geyser) com a API do **ApolloCraft Security**.

---

## 1. Ciclo de Vida do Jogador (Player Lifecycle)

```
[Jogador Conecta no Bedrock]
            │
            ▼
[POST /api/minecraft/join]
  - Envia: gamertag, xuid, ip, client_id, platform, device_model
            │
            ├─► Retorna ALLOWED: Jogador entra no mundo
            ├─► Retorna KICK_VPN: Servidor desconecta com aviso de desligar VPN
            ├─► Retorna KICK_BANNED: Servidor desconecta com motivo do ban
            └─► Retorna REQUIRE_VERIFICATION: Servidor exibe modal/código
```

---

## 2. Assinador de Requisições HMAC-SHA256 (Exemplo em TypeScript / JavaScript)

O cliente que roda no servidor Bedrock deve assinar todas as requisições HTTP antes de enviá-las para `https://apollocraft.online/api/minecraft/*`:

```typescript
import crypto from 'crypto';

interface SignedRequestOptions {
  url: string;
  body: Record<string, any>;
  apiSecret: string;
  serverIdentifier: string;
}

export async function sendToApolloSecurity({
  url,
  body,
  apiSecret,
  serverIdentifier,
}: SignedRequestOptions) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payloadString = JSON.stringify(body);

  // String canônica: timestamp:nonce:payload
  const canonicalString = `${timestamp}:${nonce}:${payloadString}`;

  // Gerar assinatura HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonicalString)
    .digest('hex');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-apollo-server-id': serverIdentifier,
      'x-apollo-signature': `t=${timestamp},n=${nonce},s=${signature}`,
    },
    body: payloadString,
  });

  return await response.json();
}
```

---

## 3. Endpoints da API Minecraft

### 3.1 `POST /api/minecraft/join`
Executado quando um jogador tenta entrar no servidor.

**Payload:**
```json
{
  "gamertag": "SteveBedrock",
  "xuid": "2535412345678901",
  "ip": "203.0.113.42",
  "clientId": "-8472910492817293",
  "platform": "ANDROID",
  "deviceModel": "Samsung Galaxy S23",
  "deviceOs": "Android 14"
}
```

**Exemplo de Resposta (Verificação Necessária):**
```json
{
  "action": "REQUIRE_VERIFICATION",
  "verificationCode": "APOLLO-9X2M-4K8P",
  "expiresAt": "2026-09-14T23:45:00Z",
  "instructions": "Acesse https://apollocraft.online/verificar e insira o código acima."
}
```

**Exemplo de Resposta (Banido):**
```json
{
  "action": "KICK_BANNED",
  "reason": "Você está banido por uso de trapaças.",
  "banId": "b192c4..."
}
```

---

### 3.2 `POST /api/minecraft/leave`
Executado quando um jogador desconecta do servidor.

**Payload:**
```json
{
  "gamertag": "SteveBedrock",
  "xuid": "2535412345678901",
  "sessionDurationSeconds": 1840
}
```

---

### 3.3 `POST /api/minecraft/heartbeat`
Executado a cada 60 segundos pelo servidor Bedrock para indicar disponibilidade do nó.

**Payload:**
```json
{
  "serverIdentifier": "apollo-bedrock-01",
  "onlinePlayers": 42,
  "tps": 20.0,
  "memoryUsageMb": 1420
}
```

---

## 4. Mensagens de Kick Padronizadas

Para manter uma experiência profissional com a identidade visual do ApolloCraft:

- **Kick por VPN**:
  > `§c§lAPOLLOCRAFT SECURITY§r\n\n§fDetectamos que sua conexão utiliza §eProxy, VPN ou Data Center§f.\n§7Por motivos de segurança contra ataques, desative a VPN e reconecte.`

- **Kick por Ban**:
  > `§c§lVOCÊ FOI BANIDO DO APOLLOCRAFT§r\n\n§7Motivo: §f{reason}\n§7ID da Punição: §e{banId}\n\n§bPara apelações, acesse https://discord.gg/apollocraft`

- **Aviso de Verificação**:
  > `§6§lVERIFICAÇÃO OBRIGATÓRIA§r\n\n§fSeu código de acesso: §a§l{code}§r\n§7Acesse §bhttps://apollocraft.online/verificar §7para liberar seu acesso.`
