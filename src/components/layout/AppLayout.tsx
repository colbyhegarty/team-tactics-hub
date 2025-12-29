import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
