"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  Play,
  ScrollText,
} from "lucide-react";

const links = [
  { href: "/", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/reports", labelKey: "reports" as const, icon: FileText },
  { href: "/trigger", labelKey: "trigger" as const, icon: Play },
  { href: "/logs", labelKey: "logs" as const, icon: ScrollText },
];

export function Nav() {
  const pathname = usePathname();
  const t = useT();
  const { lang, toggle } = useLanguage();

  return (
    <nav className="flex flex-col w-56 border-r bg-muted/40 p-4 gap-1 shrink-0">
      <div className="font-semibold text-lg px-3 py-4 mb-2">
        {t("ondoReports")}
      </div>
      {links.map(({ href, labelKey, icon: Icon }) => {
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
            {t(labelKey)}
          </Link>
        );
      })}
      <div className="mt-auto">
        <button
          onClick={toggle}
          className="w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {lang === "zh" ? "EN" : "中文"}
        </button>
      </div>
    </nav>
  );
}
