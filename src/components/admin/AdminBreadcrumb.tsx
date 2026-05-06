"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);
  
  if (paths[0] !== "admin") return null;
  
  const breadcrumbs = paths.map((path, index) => {
    const href = "/" + paths.slice(0, index + 1).join("/");
    const label = path.charAt(0).toUpperCase() + path.slice(1);
    return { href, label, isLast: index === paths.length - 1 };
  });
  
  return (
    <nav className="flex items-center gap-2 text-sm mb-6 pb-4 border-b border-[#2A2A2A]">
      <Link href="/admin" className="text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-1">
        <Home className="w-3 h-3" />
        Admin
      </Link>
      {breadcrumbs.slice(1).map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-[#A1A1AA]" />
          {crumb.isLast ? (
            <span className="text-[#A855F7] font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-[#A1A1AA] hover:text-white transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
