"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { HiOutlineBell, HiOutlineMenu, HiOutlineX, HiOutlineLogout } from "react-icons/hi";
import {
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlinePuzzle,
  HiOutlineSpeakerphone,
  HiOutlineStar,
  HiOutlineAcademicCap,
  HiOutlineCash,
  HiOutlineChatAlt2,
  HiOutlineMail,
} from "react-icons/hi";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const mobileMenuLinks = [
  { name: "Subjects", href: "/subjects", icon: HiOutlineBookOpen },
  { name: "Chapters", href: "/chapters", icon: HiOutlineCollection },
  { name: "Quizzes", href: "/quizzes", icon: HiOutlinePuzzle },
  { name: "Polls", href: "/polls", icon: HiOutlineSpeakerphone },
  { name: "Reviews", href: "/reviews", icon: HiOutlineStar },
  { name: "Colleges", href: "/colleges", icon: HiOutlineAcademicCap },
  { name: "Donations", href: "/donations", icon: HiOutlineCash },
  { name: "Feedback", href: "/feedback", icon: HiOutlineChatAlt2 },
  { name: "Contacts", href: "/contacts", icon: HiOutlineMail },
];

const AdminTopbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <header className="h-14 px-6 flex items-center justify-between bg-white border-b border-black/10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-black rounded-lg"
          >
            {menuOpen ? <HiOutlineX className="text-xl" /> : <HiOutlineMenu className="text-xl" />}
          </button>
          <h1 className="font-bold text-lg">Admin Panel</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-xl text-gray-600 hover:text-black">
            <HiOutlineBell />
          </button>
          <a href={process.env.NEXT_PUBLIC_SITE_URL || "https://getmaterials.in"} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--primary)] hidden sm:block">
            View Site
          </a>
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
            A
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-3 gap-1">
              {mobileMenuLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
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
              <button
                onClick={() => { setMenuOpen(false); setShowLogout(true); }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-semibold text-sm text-red-600 hover:bg-red-50 transition w-full"
              >
                <HiOutlineLogout className="text-lg" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showLogout}
        title="Logout"
        message="Are you sure you want to log out of the admin panel?"
        confirmLabel="Logout"
        variant="warning"
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
};

export default AdminTopbar;
  );
};

export default AdminTopbar;
