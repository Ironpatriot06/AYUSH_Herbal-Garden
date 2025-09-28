// components/admin/ProtectedAdmin.tsx
"use client";

import React from "react";
import { useProfile } from "@/hooks/useProfile";

export default function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useProfile();

  if (loading) return null; // or return a spinner

  if (!isAdmin) {
    return null; // hide admin-only children for non-admins
  }

  return <>{children}</>;
}
