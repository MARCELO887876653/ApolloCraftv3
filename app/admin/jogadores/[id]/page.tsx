'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminPlayerDetail360 } from '@/components/pages/admin/AdminPlayerDetail360';

export default function PlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;
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
    <AdminPlayerDetail360
      playerId={playerId}
      onNavigate={(path) => router.push(path)}
      admin={admin}
    />
  );
}
