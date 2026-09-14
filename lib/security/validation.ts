import { z } from 'zod';

// Gamertag: Bedrock gamertags are 3-16 characters, alphanumeric with single spaces allowed
export const gamertagSchema = z
  .string()
  .min(3, 'Gamertag deve ter no mínimo 3 caracteres')
  .max(16, 'Gamertag deve ter no máximo 16 caracteres')
  .regex(/^[a-zA-Z0-9_ ]+$/, 'Gamertag contém caracteres inválidos');

// Verification code: Format APOLLO-XXXX-XXXX
export const verificationCodeSchema = z
  .string()
  .min(10, 'Código inválido')
  .max(30, 'Código inválido')
  .regex(/^APOLLO-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Formato de código inválido (ex: APOLLO-K7P4-91M2)');

// Public verification request schema
export const verifyRequestSchema = z.object({
  gamertag: gamertagSchema,
  code: verificationCodeSchema,
});

// Admin Initial Setup schema
export const setupOwnerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// Admin Login schema
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Minecraft Player Join schema
export const minecraftJoinSchema = z.object({
  gamertag: gamertagSchema,
  xuid: z.string().optional().nullable(),
  platform: z.string().max(32).default('Bedrock'),
  clientId: z.string().max(128).optional().nullable(),
  deviceModel: z.string().max(64).optional().nullable(),
  deviceOs: z.string().max(64).optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
});

// Minecraft Create Verification Code schema
export const minecraftCreateCodeSchema = z.object({
  gamertag: gamertagSchema,
  xuid: z.string().optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
});

// Minecraft Security Event schema
export const minecraftSecurityEventSchema = z.object({
  gamertag: gamertagSchema.optional().nullable(),
  eventType: z.string().min(3).max(64),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  metadata: z.record(z.any()).default({}),
});

// Admin Ban Action schema
export const banPlayerSchema = z.object({
  playerId: z.string().uuid('ID de jogador inválido'),
  type: z.enum(['TEMPORARY', 'PERMANENT']),
  reasonPublic: z.string().min(3, 'Motivo público é obrigatório').max(500),
  reasonInternal: z.string().min(3, 'Motivo interno é obrigatório').max(1000),
  durationDays: z.number().int().positive().optional().nullable(),
});

// Admin Player Status Action schema
export const updatePlayerStatusSchema = z.object({
  playerId: z.string().uuid('ID de jogador inválido'),
  status: z.enum([
    'PENDING',
    'VERIFIED',
    'RESTRICTED',
    'SUSPICIOUS',
    'MANUAL_REVIEW',
    'TEMP_BANNED',
    'BANNED',
  ]),
  notes: z.string().max(1000).optional(),
});

// Admin Create Admin User schema
export const createAdminSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome muito curto').max(100),
  roleName: z.enum(['ADMIN', 'MODERATOR', 'SUPPORT', 'ANALYST']),
  password: z.string().min(8, 'Senha provisória deve ter no mínimo 8 caracteres'),
});

// Admin Settings Update schema
export const updateSettingsSchema = z.object({
  antiVpnMode: z.enum(['OFF', 'MONITOR', 'RESTRICT', 'BLOCK']).optional(),
  cacheTtlHours: z.number().int().min(1).max(720).optional(),
  maxVerificationAttempts: z.number().int().min(1).max(20).optional(),
  codeExpirationMinutes: z.number().int().min(5).max(120).optional(),
  discordWebhookUrl: z.string().url().or(z.literal('')).optional(),
  discordEnabled: z.boolean().optional(),
});
