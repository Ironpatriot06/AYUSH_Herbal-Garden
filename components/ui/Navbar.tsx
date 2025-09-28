"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth"; // ✅ bring in auth context

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + title -> clickable to home */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ayush Herbal Garden</h1>
              <p className="text-sm text-muted-foreground">
                Traditional Ayurvedic Medicine Reference
              </p>
            </div>
          </Link>

          {/* Right side: Nav */}
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name ?? "avatar"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}

                <span className="text-sm font-medium text-foreground">
                  {user.name ?? user.email}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="hover:bg-transparent hover:text-inherit"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={loginWithGoogle}
                className="hover:bg-transparent hover:text-inherit"
              >
                Sign In with Google
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
