import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Projects', path: '/projects', icon: 'architecture' },
    { name: 'Measurement', path: '/measurement', icon: 'straighten' },
    { name: 'BOQ', path: '/boq', icon: 'request_quote' },
    { name: 'IS 456 AI', path: '/assistant', icon: 'smart_toy' },
    { name: 'Rates', path: '/rates', icon: 'analytics' },
    { name: 'Materials', path: '/materials', icon: 'inventory_2' },
    { name: 'Labour', path: '/labour', icon: 'engineering' },
    { name: 'Reports', path: '/reports', icon: 'description' },
    { name: 'Alerts', path: '/alerts', icon: 'notifications' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  const mobileNavItems = [
    { name: 'Dash', path: '/dashboard', icon: 'dashboard' },
    { name: 'Projects', path: '/projects', icon: 'architecture' },
    { name: 'Measure', path: '/measurement', icon: 'straighten' },
    { name: 'BOQ', path: '/boq', icon: 'request_quote' },
    { name: 'More', path: '/settings', icon: 'menu' }, // Simplified fallback
  ];

  return (
    <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex w-full">
      {/* Navigation Drawer (Web) */}
      <aside className="hidden md:flex flex-col h-full w-[260px] lg:w-80 rounded-r-xl bg-surface-container shadow-md fixed inset-y-0 left-0 z-[60] py-stack-lg overflow-y-auto hide-scrollbar">
        <div className="px-margin-mobile mb-stack-lg flex flex-col items-start border-b border-outline-variant pb-stack-md shrink-0">
          <div className="w-16 h-16 rounded-full bg-surface-variant overflow-hidden mb-stack-sm flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-[32px] text-primary">engineering</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary">Lead Engineer</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Project ID: CE-2024-01</p>
          <p className="font-label-caps text-label-caps text-outline mt-1">Site Location: Sector 7</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2 mb-8">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 mx-2 px-4 py-3 rounded-full transition-all active:scale-[0.98]",
                  isActive
                    ? "bg-secondary-fixed text-on-secondary-fixed-variant font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                )}
              >
                <span className={cn("material-symbols-outlined", isActive && "fill")}>{item.icon}</span>
                <span className="font-table-data text-table-data">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="px-4 mt-auto">
          <button onClick={() => navigate('/login')} className="w-full h-touch-target-min flex items-center justify-center gap-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors font-table-data text-table-data">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:ml-[260px] lg:ml-80 min-h-screen relative pb-[80px] md:pb-0 overflow-x-hidden">
        {/* TopAppBar */}
        <header className="w-full top-0 sticky border-b border-outline-variant bg-surface z-50">
          <div className="flex items-center justify-between px-margin-mobile h-touch-target-min w-full max-w-7xl mx-auto">
            <button className="md:hidden flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors active:opacity-80 rounded-full h-10 w-10">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden md:block w-10"></div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">Civil Estimation Pro</h1>
            <button onClick={() => navigate('/login')} className="flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors active:opacity-80 rounded-full h-10 w-10">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-stack-lg py-stack-lg flex flex-col gap-stack-lg relative">
          <Outlet />
        </main>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-touch-target-min pb-[env(safe-area-inset-bottom,0px)] bg-surface border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-[56px] px-2 active:scale-95 transition-transform duration-200 w-[72px]",
                isActive ? "text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-low rounded-lg"
              )}
            >
              <div className={cn("px-4 py-1 rounded-full flex items-center justify-center transition-all", isActive ? "bg-secondary-container" : "")}>
                <span className={cn("material-symbols-outlined text-[24px]", isActive && "fill")}>{item.icon}</span>
              </div>
              <span className={cn("font-label-caps text-[10px] mt-1 tracking-wide", isActive ? "font-bold text-on-surface" : "font-medium")}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
