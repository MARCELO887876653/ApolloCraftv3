'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminPlayersPage } from '@/components/pages/admin/AdminPlayersPage';

export default function PlayersPage() {
  const router = useRouter();

  return (
    <AdminPlayersPage
      onNavigate={(path) => router.push(path)}
      onSelectPlayer={(id) => router.push(`/admin/jogadores/${id}`)}
    />
  );
}
