import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PublicHomePage } from '@/components/pages/PublicHomePage';
import { PublicVerifyPage } from '@/components/pages/PublicVerifyPage';
import { PublicTermsPage } from '@/components/pages/PublicTermsPage';
import { PublicPrivacyPage } from '@/components/pages/PublicPrivacyPage';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminLoginPage } from '@/components/pages/admin/AdminLoginPage';
import { AdminSetupPage } from '@/components/pages/admin/AdminSetupPage';
import { AdminDashboardPage } from '@/components/pages/admin/AdminDashboardPage';
import { AdminPlayersPage } from '@/components/pages/admin/AdminPlayersPage';
import { AdminPlayerDetail360 } from '@/components/pages/admin/AdminPlayerDetail360';
import { AdminBansPage } from '@/components/pages/admin/AdminBansPage';
import { AdminSecurityPage } from '@/components/pages/admin/AdminSecurityPage';
import { AdminAntiAltPage } from '@/components/pages/admin/AdminAntiAltPage';
import { AdminLogsPage } from '@/components/pages/admin/AdminLogsPage';
import { AdminStaffPage } from '@/components/pages/admin/AdminStaffPage';
import { AdminServersPage } from '@/components/pages/admin/AdminServersPage';
import { AdminSettingsPage } from '@/components/pages/admin/AdminSettingsPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('p1');
  const [adminUser, setAdminUser] = useState<any>({
    name: 'Apollo Staff',
    email: 'staff@apollocraft.online',
    role: { name: 'OWNER' },
  });

  // Keep path synced with browser URL if possible
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      if (path && path !== '') {
        setCurrentPath(path);
      }
    };
    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (window.history.pushState) {
      window.history.pushState(null, '', path);
    }
  };

  const isAdminRoute = currentPath.startsWith('/admin');
  const isAuthRoute = currentPath === '/admin/login' || currentPath === '/admin/setup';

  // Render Page Content based on Path
  const renderContent = () => {
    if (currentPath === '/') {
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar currentPath="/" onNavigate={navigate} />
          <PublicHomePage onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    if (currentPath === '/verificar') {
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar currentPath="/verificar" onNavigate={navigate} />
          <PublicVerifyPage onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    if (currentPath === '/termos') {
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar currentPath="/termos" onNavigate={navigate} />
          <PublicTermsPage onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    if (currentPath === '/privacidade') {
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar currentPath="/privacidade" onNavigate={navigate} />
          <PublicPrivacyPage onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    if (currentPath === '/admin/login') {
      return (
        <AdminLoginPage
          onNavigate={navigate}
          onLoginSuccess={(user) => {
            setAdminUser(user);
            navigate('/admin');
          }}
        />
      );
    }

    if (currentPath === '/admin/setup') {
      return <AdminSetupPage onNavigate={navigate} />;
    }

    // Admin Dashboard & Management Routes (with sidebar and header)
    return (
      <div className="flex min-h-screen bg-[#0B0F19] text-white">
        <AdminSidebar
          currentPath={currentPath}
          onNavigate={navigate}
          adminName={adminUser?.name || 'Administrador'}
          adminRole={adminUser?.role?.name || 'OWNER'}
          onLogout={() => {
            setAdminUser(null);
            navigate('/admin/login');
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <AdminHeader
            title="ApolloCraft Security"
            subtitle="Painel Administrativo & Gestão de Acessos Bedrock"
          />

          <main className="flex-1 pb-16">
            {currentPath === '/admin' && (
              <AdminDashboardPage onNavigate={navigate} admin={adminUser} />
            )}

            {currentPath === '/admin/jogadores' && (
              <AdminPlayersPage
                onNavigate={navigate}
                onSelectPlayer={(id) => {
                  setSelectedPlayerId(id);
                  navigate(`/admin/jogadores/${id}`);
                }}
              />
            )}

            {currentPath.startsWith('/admin/jogadores/') && (
              <AdminPlayerDetail360
                playerId={selectedPlayerId || currentPath.split('/')[3]}
                onNavigate={navigate}
                admin={adminUser}
              />
            )}

            {currentPath === '/admin/bans' && (
              <AdminBansPage
                onNavigate={navigate}
                onSelectPlayer={(id) => {
                  setSelectedPlayerId(id);
                  navigate(`/admin/jogadores/${id}`);
                }}
              />
            )}

            {currentPath === '/admin/seguranca' && (
              <AdminSecurityPage onNavigate={navigate} />
            )}

            {currentPath === '/admin/contas-relacionadas' && (
              <AdminAntiAltPage
                onNavigate={navigate}
                onSelectPlayer={(id) => {
                  setSelectedPlayerId(id);
                  navigate(`/admin/jogadores/${id}`);
                }}
              />
            )}

            {currentPath === '/admin/logs' && (
              <AdminLogsPage onNavigate={navigate} />
            )}

            {currentPath === '/admin/administradores' && (
              <AdminStaffPage onNavigate={navigate} admin={adminUser} />
            )}

            {currentPath === '/admin/servidores' && (
              <AdminServersPage onNavigate={navigate} />
            )}

            {currentPath === '/admin/configuracoes' && (
              <AdminSettingsPage onNavigate={navigate} />
            )}
          </main>
        </div>
      </div>
    );
  };

  return <div className="min-h-screen bg-[#0B0F19]">{renderContent()}</div>;
}
