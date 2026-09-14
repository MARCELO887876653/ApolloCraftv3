'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminStaffPage } from '@/components/pages/admin/AdminStaffPage';

export default function StaffPage() {
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
    <AdminStaffPage
      onNavigate={(path) => router.push(path)}
      admin={admin}
    />
  );
}
