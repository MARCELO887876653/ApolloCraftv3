'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminLogsPage } from '@/components/pages/admin/AdminLogsPage';

export default function LogsPage() {
  const router = useRouter();
  return <AdminLogsPage onNavigate={(path) => router.push(path)} />;
}
