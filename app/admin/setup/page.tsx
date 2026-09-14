'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminSetupPage } from '@/components/pages/admin/AdminSetupPage';

export default function SetupPage() {
  const router = useRouter();
  return <AdminSetupPage onNavigate={(path) => router.push(path)} />;
}
