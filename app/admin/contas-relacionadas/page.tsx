'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminAntiAltPage } from '@/components/pages/admin/AdminAntiAltPage';

export default function AntiAltPage() {
  const router = useRouter();

  return (
    <AdminAntiAltPage
      onNavigate={(path) => router.push(path)}
      onSelectPlayer={(id) => router.push(`/admin/jogadores/${id}`)}
    />
  );
}
