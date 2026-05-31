import { useAuthStore } from '@/stores/auth.store';
import { ThemeSwitcher } from './theme-switcher';

const navItems = [
  { label: 'Dashboard', icon: '📊' },
  { label: 'Catalog', icon: '📦' },
  { label: 'Operations', icon: '🔄' },
  { label: 'Inventory', icon: '📋' },
  { label: 'Reports', icon: '📈' },
  { label: 'Analytics', icon: '🔬' },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">WMS</h2>
        <p className="text-xs text-muted-foreground">Warehouse Management</p>
      </div>

      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.label)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
              activePage === item.label
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t space-y-3">
        <ThemeSwitcher />
        <div>
          <p className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
