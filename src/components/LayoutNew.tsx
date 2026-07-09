import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useDarkMode } from "./DarkModeProvider";
import { showToast } from "./ToastProvider";
import { CommandPalette } from "./CommandPalette";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { projectPathOrLegacy, scopedPageFromLegacyPath } from "@/features/project/projectRoutes";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface NavItem {
  label: string;
  path: string;
  icon: string;
  shortcut?: string;
}

/* ------------------------------------------------------------------ */
/*  Navigation Configuration                                          */
/* ------------------------------------------------------------------ */
const primaryNav: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard", shortcut: "Ctrl+1" },
  { label: "Projects", path: "/projects", icon: "architecture", shortcut: "Ctrl+2" },
  { label: "Measurement", path: "/measurement", icon: "straighten", shortcut: "Ctrl+3" },
  { label: "BOQ", path: "/boq", icon: "request_quote", shortcut: "Ctrl+4" },
  { label: "Rates", path: "/rates", icon: "analytics", shortcut: "Ctrl+5" },
  { label: "Materials", path: "/materials", icon: "inventory_2", shortcut: "Ctrl+6" },
  { label: "Labour", path: "/labour", icon: "engineering", shortcut: "Ctrl+7" },
  { label: "Reports", path: "/reports", icon: "description", shortcut: "Ctrl+8" },
];

const secondaryNav: NavItem[] = [
  { label: "Alerts", path: "/alerts", icon: "notifications" },
  { label: "Settings", path: "/settings", icon: "settings", shortcut: "Ctrl+9" },
];

/* ------------------------------------------------------------------ */
/*  Sidebar Item Component                                            */
/* ------------------------------------------------------------------ */
function SidebarItem({
  item,
  isActive,
  collapsed,
  to,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  to: string;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg transition-all select-none group relative",
        isActive
          ? "bg-accent-primary-glow text-text-primary font-semibold"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
      )}
      title={collapsed ? item.label : undefined}
    >
      <span
        className={cn(
          "material-symbols-outlined text-[20px] transition-colors",
          isActive ? "text-accent-primary fill" : "text-text-muted group-hover:text-text-secondary"
        )}
      >
        {item.icon}
      </span>
      <span
        className={cn(
          "flex-1 font-table text-table truncate",
          collapsed && "lg:hidden"
        )}
      >
        {item.label}
      </span>
      {item.shortcut && (
        <span
          className={cn(
            "font-mono text-mono text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity",
            collapsed && "lg:hidden"
          )}
        >
          {item.shortcut.split("Ctrl+")[1]}
        </span>
      )}
    </NavLink>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Layout                                                       */
/* ------------------------------------------------------------------ */
export default function Layout({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { resolved, toggle } = useDarkMode();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navPath = (item: NavItem) => {
    const scoped = scopedPageFromLegacyPath(item.path);
    return scoped ? projectPathOrLegacy(activeProjectId, scoped) : item.path;
  };

  const isNavActive = (item: NavItem) => {
    const to = navPath(item);
    return pathname === to || pathname.startsWith(to + "/") || pathname === item.path;
  };

  /* Collapse sidebar on tablet; use drawer on mobile */
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setCollapsed(true);
        setMobileNavOpen(false);
      }
    };
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  /* Close mobile drawer on navigation */
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  /* Prevent body scroll when mobile drawer is open */
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileNavOpen]);

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        const num = Number(e.key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const all = [...primaryNav, ...secondaryNav];
          const item = all[num - 1];
          if (item) {
            e.preventDefault();
            navigate(navPath(item));
          }
        }
        if (e.key.toLowerCase() === "d" && e.shiftKey) {
          e.preventDefault();
          toggle();
          showToast(`Switched to ${resolved === "dark" ? "light" : "dark"} mode`, "info");
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, toggle, resolved, activeProjectId]);

  const sidebarWidth = collapsed ? "lg:w-[72px]" : "lg:w-[256px]";
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <CommandPalette />

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-default bg-bg-surface transition-transform duration-300 pt-safe",
          "w-[min(280px,85vw)] -translate-x-full lg:translate-x-0",
          mobileNavOpen && "translate-x-0",
          sidebarWidth
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-3 h-14 border-b border-border-default", collapsed ? "lg:justify-center px-4 lg:px-2" : "px-4")}>
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">architecture</span>
          </div>
          <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
            <h1 className="font-h3 text-h3 truncate">Civil Est Pro</h1>
          </div>
          <button
            type="button"
            onClick={closeMobileNav}
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search trigger */}
        <div className={cn("mt-2", collapsed ? "lg:px-2 px-3" : "px-3")}>
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg border border-border-default bg-bg-input text-text-muted hover:border-border-focus transition-colors min-h-[44px]",
              collapsed ? "lg:justify-center lg:h-9 lg:px-0 h-10 px-3" : "h-10 px-3"
            )}
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className={cn("flex-1 text-left font-body text-body", collapsed && "lg:hidden")}>Search</span>
            <kbd className={cn("font-mono text-mono text-[10px] text-text-muted", collapsed && "lg:hidden")}>Ctrl K</kbd>
          </button>
        </div>

        {/* Primary Nav */}
        <nav className={cn("flex-1 flex flex-col gap-1 mt-4 overflow-y-auto hide-scrollbar touch-scroll-y", collapsed ? "lg:px-2 px-3" : "px-3")}>
          {primaryNav.map((item) => (
            <div key={item.path}>
              <SidebarItem
                item={item}
                to={navPath(item)}
                isActive={isNavActive(item)}
                collapsed={collapsed}
                onNavigate={closeMobileNav}
              />
            </div>
          ))}

          <div className={cn("my-2 border-t border-border-default", collapsed ? "lg:mx-2 mx-3" : "mx-3")} />

          {secondaryNav.map((item) => (
            <div key={item.path}>
              <SidebarItem
                item={item}
                to={item.path}
                isActive={pathname === item.path}
                collapsed={collapsed}
                onNavigate={closeMobileNav}
              />
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className={cn("border-t border-border-default py-2 pb-safe", collapsed ? "lg:px-2 px-3" : "px-3")}>
          <button
            onClick={toggle}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors",
              collapsed && "lg:justify-center lg:px-0"
            )}
            title={collapsed ? "Toggle theme" : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">
              {resolved === "dark" ? "dark_mode" : "light_mode"}
            </span>
            <span className={cn("font-table text-table", collapsed && "lg:hidden")}>
              {resolved === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "hidden lg:flex w-full items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors mt-1",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
            {!collapsed && <span className="font-table text-table">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300",
          collapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-border-default bg-bg-primary/80 backdrop-blur-md pt-safe">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Open navigation"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <span className="font-body text-body text-text-muted truncate">
              {(pathname === "/dashboard" || pathname.startsWith("/projects/") && pathname.endsWith("/dashboard")) && "Executive Overview"}
              {pathname === "/projects" && "Projects"}
              {(pathname === "/measurement" || pathname.includes("/measurement")) && "Measurement Book"}
              {(pathname === "/boq" || pathname.includes("/boq")) && "Bill of Quantities"}
              {(pathname === "/rates" || pathname.includes("/rates")) && "Rate Analysis"}
              {(pathname === "/materials" || pathname.includes("/materials")) && "Material Library"}
              {(pathname === "/labour" || pathname.includes("/labour")) && "Labour Management"}
              {(pathname === "/reports" || pathname.includes("/reports")) && "Reports Center"}
              {pathname === "/settings" && "Settings"}
              {pathname === "/alerts" && "Alerts"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/alerts")}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-danger rounded-full" />
            </button>
            <div className="h-8 w-px bg-border-default" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-table text-table">
                CE
              </div>
              <div className="hidden md:block">
                <p className="font-table text-table text-text-primary">Civil Engineer</p>
                <p className="font-label text-label text-text-muted">Estimator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden pb-safe min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
