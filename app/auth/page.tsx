// app/admin/auth/page.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth";
import AdminAuth from "@/components/admin/admin-auth";

export default function AdminAuthPage() {
  return (
    <AuthProvider>
      <AdminAuth />
    </AuthProvider>
  );
}
