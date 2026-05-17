"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineCog,
} from "react-icons/hi";

const tabs = [
  { href: "/dashboard", icon: HiOutlineHome, label: "Home" },
  { href: "/materials", icon: HiOutlineDocumentText, label: "Materials" },
  { href: "/teachers", icon: HiOutlineUserGroup, label: "Teachers" },
  { href: "/users", icon: HiOutlineUsers, label: "Users" },
  { href: "/settings", icon: HiOutlineCog, label: "Settings" },
];

export default function AdminBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition ${
                isActive
                  ? "text-[var(--primary)]"
                  : "text-gray-500"
              }`}
            >
              <Icon className="text-xl" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
