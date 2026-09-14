'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PublicPrivacyPage } from '@/components/pages/PublicPrivacyPage';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentPath="/privacidade" onNavigate={(path) => router.push(path)} />
      <PublicPrivacyPage onNavigate={(path) => router.push(path)} />
      <Footer onNavigate={(path) => router.push(path)} />
    </div>
  );
}
