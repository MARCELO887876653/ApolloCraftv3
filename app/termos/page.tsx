'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PublicTermsPage } from '@/components/pages/PublicTermsPage';

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currentPath="/termos" onNavigate={(path) => router.push(path)} />
      <PublicTermsPage onNavigate={(path) => router.push(path)} />
      <Footer onNavigate={(path) => router.push(path)} />
    </div>
  );
}
