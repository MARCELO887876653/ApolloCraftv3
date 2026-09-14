import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApolloCraft Security | Sistema de Proteção Bedrock',
  description:
    'Sistema de segurança, verificação de jogadores, anti-VPN, anti-alt e painel administrativo para servidor Minecraft Bedrock.',
  openGraph: {
    title: 'ApolloCraft Security | Sistema de Proteção Bedrock',
    description:
      'Sistema de segurança, verificação de jogadores, anti-VPN, anti-alt e painel administrativo para servidor Minecraft Bedrock.',
    url: 'https://apollocraft.online',
    siteName: 'ApolloCraft Security',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0B0F19] text-white min-h-screen antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
