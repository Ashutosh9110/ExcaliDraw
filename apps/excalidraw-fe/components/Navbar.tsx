"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeProvider";
import { useAuth } from "./AuthContext";
import { LogOut, Plus, User, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-foreground">
            Excalidraw
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/canvas"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus size={16} />
                <span>New Canvas</span>
              </Link>

              <ThemeToggle />

              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {user?.email}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-md shadow-lg border border-border z-20">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Signed in
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted/50 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/signin"
                className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 