'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboardPage } from '@/components/pages/admin/AdminDashboardPage';

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setAdmin(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <AdminDashboardPage
      onNavigate={(path) => router.push(path)}
      admin={admin}
    />
  );
}
