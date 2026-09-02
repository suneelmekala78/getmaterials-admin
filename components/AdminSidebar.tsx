"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineLogout,
  HiOutlinePuzzle,
  HiOutlineSpeakerphone,
  HiOutlineStar,
  HiOutlineMail,
  HiOutlineChatAlt2,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineBell,
} from "react-icons/hi";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: HiOutlineHome },
  { name: "Materials", href: "/materials", icon: HiOutlineDocumentText },
  { name: "Subjects", href: "/subjects", icon: HiOutlineBookOpen },
  { name: "Chapters", href: "/chapters", icon: HiOutlineCollection },
  { name: "Colleges", href: "/colleges", icon: HiOutlineAcademicCap },
  { name: "College Assigns", href: "/college-assignments", icon: HiOutlineClipboardList },
  { name: "Quizzes", href: "/quizzes", icon: HiOutlinePuzzle },
  { name: "Polls", href: "/polls", icon: HiOutlineSpeakerphone },
  { name: "Notifications", href: "/notifications", icon: HiOutlineBell },
  { name: "Reviews", href: "/reviews", icon: HiOutlineStar },
  { name: "Teachers", href: "/teachers", icon: HiOutlineUserGroup },
  { name: "Users", href: "/users", icon: HiOutlineUsers },
  { name: "Feedback", href: "/feedback", icon: HiOutlineChatAlt2 },
  { name: "Contacts", href: "/contacts", icon: HiOutlineMail },
  { name: "Referrals", href: "/referrals", icon: HiOutlineTrendingUp },
  { name: "Settings", href: "/settings", icon: HiOutlineCog },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <aside className="w-64 h-screen bg-white border-r border-black/10 hidden md:flex flex-col sticky top-0 overflow-y-auto">
      <div className="p-6 font-extrabold text-[1.2rem] text-[var(--primary)]">
        Get<span className="text-black">Materials</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                active
                  ? "bg-[var(--primary)] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="text-lg" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-sm text-red-600 hover:bg-red-50 transition w-full"
        >
          <HiOutlineLogout className="text-lg" />
          Logout
        </button>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Logout"
        message="Are you sure you want to log out of the admin panel?"
        confirmLabel="Logout"
        variant="warning"
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        onCancel={() => setShowLogout(false)}
      />
    </aside>
  );
};

export default AdminSidebar;
