"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Play,
  ScrollText,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/trigger", label: "Trigger", icon: Play },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-56 border-r bg-muted/40 p-4 gap-1 shrink-0">
      <div className="font-semibold text-lg px-3 py-4 mb-2">
        Ondo Reports
      </div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
