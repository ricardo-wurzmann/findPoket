"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn, getInitials } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const playerNav: { icon: string; label: string; href: string; badge?: boolean }[] = [
  { icon: "◈", label: "Feed", href: "/feed" },
  { icon: "◷", label: "Agenda", href: "/calendar" },
  { icon: "◉", label: "Casas", href: "/venues" },
  { icon: "◧", label: "Dealer", href: "/dealer" },
  { icon: "◎", label: "Perfil", href: "/profile" },
  { icon: "⊕", label: "Anunciar", href: "/announce" },
];

const organizerNav: { icon: string; label: string; href: string; badge?: boolean }[] = [
  { icon: "◈", label: "Dashboard", href: "/dashboard" },
  { icon: "◷", label: "Eventos", href: "/events" },
  { icon: "◉", label: "Inscrições", href: "/requests", badge: true },
  { icon: "◧", label: "Dealer", href: "/dealer" },
];

interface SidebarProps {
  userName?: string;
  userHandle?: string;
  userRole?: "PLAYER" | "ORGANIZER";
  pendingCount?: number;
}

export function Sidebar({
  userName = "Jogador",
  userHandle,
  userRole = "PLAYER",
  pendingCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const navItems = userRole === "ORGANIZER" ? organizerNav : playerNav;

  const handleSignOut = async () => {
    await signOut({});
  };

  const homeHref = userRole === "ORGANIZER" ? "/dashboard" : "/feed";

  const sidebarContent = (
    <aside className="w-[220px] h-full bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-sidebar-border flex items-center justify-between">
        <Link href={homeHref} onClick={() => setIsOpen(false)}>
          <span className="font-cormorant italic text-2xl font-light text-white tracking-wide">
            FindPoker
          </span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-sidebar-muted hover:text-white transition-colors text-lg leading-none"
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <span className="tag text-sidebar-muted">
          {userRole === "ORGANIZER" ? "Organizador" : "Jogador"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 group relative",
                isActive
                  ? "bg-sidebar-hover text-white"
                  : "text-sidebar-muted hover:text-white hover:bg-sidebar-hover"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-sm" />
              )}
              <span className="text-base w-5 text-center leading-none">{item.icon}</span>
              <span className="text-[12px] font-medium flex-1">{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="bg-amber text-white tag px-1.5 py-0.5 rounded-sm leading-none">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Block */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-sm bg-[#2A2926] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white truncate">{userName}</div>
            {userHandle && (
              <div className="tag text-sidebar-muted">@{userHandle}</div>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left tag text-sidebar-muted hover:text-white transition-colors duration-150 py-1"
        >
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Hamburger button — mobile only (lg:hidden keeps it off desktop) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-11 h-11 bg-sidebar border border-sidebar-border rounded-sm flex flex-col items-center justify-center gap-1.5"
        aria-label="Abrir menu"
      >
        <span className="font-cormorant italic text-white text-sm leading-none select-none">♠</span>
        <div className="flex flex-col gap-1">
          <span className="block w-4 h-px bg-white" />
          <span className="block w-3 h-px bg-white" />
        </div>
      </button>

      {/* Sidebar — unified: always visible on desktop, overlay on mobile */}
      <div
        className={cn(
          "h-screen shrink-0 flex-col",
          // Desktop: always visible as part of flex layout
          "lg:flex lg:sticky lg:top-0",
          // Mobile: hidden by default, slide in as fixed overlay when open
          isOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden lg:flex"
        )}
        style={isOpen ? { animation: "slideInLeft 0.2s ease forwards" } : undefined}
      >
        {sidebarContent}
      </div>

      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
