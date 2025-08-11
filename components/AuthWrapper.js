// "use client";

// import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import Header from "./Header";

// export default function AuthWrapper({ children }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !user) {
//       router.push("/login");
//     }
//   }, [user, loading, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-neumorphic-bg flex items-center justify-center">
//         <div className="w-16 h-16 rounded-full bg-neumorphic-bg shadow-neumorphic-inset animate-pulse"></div>
//       </div>
//     );
//   }

//   if (user) {
//     return (
//       <>
//         <Header />
//         {children}
//       </>
//     );
//   }

//   return null; // or a fallback component if you prefer
// }
