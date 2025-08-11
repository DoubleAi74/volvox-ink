"use client";

import Link from "next/link";
import { Home, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  if (!user) return null; // Don't render header if no user

  return (
    <header className="bg-slate-700 border-b border-neumorphic-shadow-dark/50 shadow-neumorphic-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={user.username ? `/${user.username}` : "/"}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-neumorphic-bg shadow-neumorphic flex items-center justify-center">
              <Home className="w-5 h-5 text-neumorphic-text" />
            </div>
            <h1 className="text-xl font-bold text-neumorphic">Dashboard</h1>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neumorphic-bg shadow-neumorphic-inset">
              <UserIcon className="w-4 h-4 text-neumorphic-text" />
              <span className="text-sm text-neumorphic">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg btn-neumorphic shadow-neumorphic hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
              title="Log Out"
            >
              <LogOut className="w-4 h-4 text-neumorphic-text" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
