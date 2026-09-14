'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminServersPage } from '@/components/pages/admin/AdminServersPage';

export default function ServersPage() {
  const router = useRouter();
  return <AdminServersPage onNavigate={(path) => router.push(path)} />;
}
