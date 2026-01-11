import { Search, Library, User, Dumbbell } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Search, label: 'Find Drill' },
  { to: '/library', icon: Library, label: 'Drill Library' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">DrillForge</h1>
          <p className="text-xs text-muted-foreground">Soccer Training Tools</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="rounded-lg bg-secondary/50 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Find the perfect drill for your training sessions.
          </p>
        </div>
      </div>
    </aside>
  );
}
