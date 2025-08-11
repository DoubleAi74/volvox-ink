// app/[username]/[pageSlug]/page.js

"use client";

import AuthWrapper from "@/components/AuthWrapper";
import PageViewClient from "@/components/page/PageViewClient";

export default function PageSlugPage({ params }) {
  // Just like the other page, this now only protects the
  // main component with the AuthWrapper.
  // This guarantees that when PageViewClient renders, the user
  // from useAuth() will not be null.
  return (
    <AuthWrapper>
      <PageViewClient params={params} />
    </AuthWrapper>
  );
}
