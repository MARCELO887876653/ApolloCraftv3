'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminBansPage } from '@/components/pages/admin/AdminBansPage';

export default function BansPage() {
  const router = useRouter();

  return (
    <AdminBansPage
      onNavigate={(path) => router.push(path)}
      onSelectPlayer={(id) => router.push(`/admin/jogadores/${id}`)}
    />
  );
}
