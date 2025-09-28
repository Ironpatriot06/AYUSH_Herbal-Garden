// app/admin/page.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth";
import AdminDashboard from "@/components/admin/admin-dashboard";
// import AdminAuth from "@/components/admin/admin-auth";

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminDashboard />
      {/* <AdminAuth /> */}
    </AuthProvider>
  );
}
