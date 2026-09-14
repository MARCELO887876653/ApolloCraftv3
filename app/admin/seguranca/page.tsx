'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminSecurityPage } from '@/components/pages/admin/AdminSecurityPage';

export default function SecurityPage() {
  const router = useRouter();
  return <AdminSecurityPage onNavigate={(path) => router.push(path)} />;
}
