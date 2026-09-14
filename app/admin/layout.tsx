'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If on login or setup, don't wrap with dashboard sidebar
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/setup';

  useEffect(() => {
    if (!isAuthPage) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname, isAuthPage]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/admin/login');
        return;
      }
      setAdmin(data.user);
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/admin/login');
  };

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#0B0F19] text-white">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-white selection:bg-purple-500 selection:text-white">
      <AdminSidebar
        currentPath={pathname}
        onNavigate={(path) => router.push(path)}
        adminName={admin?.name || 'Administrador'}
        adminRole={admin?.role?.name || 'ADMIN'}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader
          title="ApolloCraft Security"
          subtitle="Painel Administrativo & Gestão de Acessos Bedrock"
        />
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
