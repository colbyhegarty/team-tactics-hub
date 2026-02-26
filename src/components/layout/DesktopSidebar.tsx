import { PenTool, Library, User, Dumbbell, CalendarDays } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: PenTool, label: 'Create Drill' },
  { to: '/library', icon: Library, label: 'Drill Library' },
  { to: '/sessions', icon: CalendarDays, label: 'Sessions' },
  { to: '/profile', icon: User, label: 'My Profile' },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex group/sidebar fixed left-0 top-0 h-screen w-16 hover:w-56 transition-all duration-300 overflow-hidden flex-col bg-sidebar z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
          <Dumbbell className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sidebar-foreground font-semibold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          DrillForge
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
                    isActive && 'bg-sidebar-accent text-sidebar-foreground'
                  )
                }
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 text-sm font-medium">
                  {label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer hint */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-lg bg-sidebar-accent px-3 py-2.5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <p className="text-xs text-sidebar-foreground/50 whitespace-nowrap">
            Soccer Training Tools
          </p>
        </div>
      </div>
    </aside>
  );
}
