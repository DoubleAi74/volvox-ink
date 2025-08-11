// app/[username]/page.js

"use client";

import AuthWrapper from "@/components/AuthWrapper";
import UserDashboardClient from "@/components/dashboard/UserDashboardClient";

export default function UserDashboardPage({ params }) {
  // This page now only does one thing:
  // It protects the dashboard component with the AuthWrapper.
  // The AuthWrapper will handle showing a loading screen and
  // ensuring the user is logged in before rendering the dashboard.
  return (
    <AuthWrapper>
      <UserDashboardClient params={params} />
    </AuthWrapper>
  );
}
