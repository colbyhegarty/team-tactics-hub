import { ReactNode, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';

const RENDER_API_URL = 'https://soccer-drill-api.onrender.com';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Warm up Render backend to prevent cold start delays
  useEffect(() => {
    fetch(`${RENDER_API_URL}/health`).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="pb-20 md:pb-0 md:pl-16">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
