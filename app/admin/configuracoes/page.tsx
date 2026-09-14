'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminSettingsPage } from '@/components/pages/admin/AdminSettingsPage';

export default function SettingsPage() {
  const router = useRouter();
  return <AdminSettingsPage onNavigate={(path) => router.push(path)} />;
}
