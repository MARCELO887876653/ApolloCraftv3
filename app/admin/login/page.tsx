'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoginPage } from '@/components/pages/admin/AdminLoginPage';

export default function LoginPage() {
  const router = useRouter();

  return (
    <AdminLoginPage
      onNavigate={(path) => router.push(path)}
      onLoginSuccess={() => router.push('/admin')}
    />
  );
}
