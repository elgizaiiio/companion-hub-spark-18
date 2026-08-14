import { Pickaxe, TrendingUp, ClipboardList, Server, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/routes";

const navItems = [
  { to: "/", icon: Pickaxe, label: "Mine" },
  { to: "/staking", icon: TrendingUp, label: "Bonds" },
  { to: "/tasks", icon: ClipboardList, label: "Tasks" },
  { to: "/servers", icon: Server, label: "NFTs" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-2">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[32px] border border-border bg-background/85 px-2 py-2 backdrop-blur-2xl shadow-[0_12px_40px_-18px_rgba(16,46,38,0.25)]">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <Link
              key={item.to}
              to={item.to}
              onMouseEnter={() => prefetchRoute(item.to)}
              onTouchStart={() => prefetchRoute(item.to)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-2 py-2.5 transition-all duration-300",
                isActive
                  ? "action-black shadow-[0_6px_20px_-8px_hsl(var(--action)/0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110"
                )}
                strokeWidth={1.75}
              />
              <span
                className={cn(
                  "text-[10px] tracking-tight",
                  isActive ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
