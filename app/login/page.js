"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [username, setUsername] = useState(""); // Add state for username
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { user, loading, signup, login } = useAuth(); // Get user and loading
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user && user.username) {
      router.push(`/${user.username}`);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSigningUp) {
        // After signup, the onAuthStateChanged listener will trigger
        // the redirect automatically when the user state is set.
        await signup(email, password, username);
      } else {
        await login(email, password);
      }
      // No need to manually push after login, the listener handles it.
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  // While loading, show a blank page or a spinner
  if (loading || (!loading && user)) {
    return (
      <div className="min-h-screen bg-neumorphic-bg flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-neumorphic-bg shadow-neumorphic-inset animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neumorphic-bg flex items-center justify-center">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-neumorphic-bg shadow-neumorphic">
        <h1 className="text-3xl font-bold text-center text-neumorphic mb-8">
          {isSigningUp ? "Create Account" : "Welcome Back"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add this block for the username input when signing up */}
          {isSigningUp && (
            <div>
              <label className="block text-sm font-medium text-neumorphic mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text/70 focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neumorphic mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neumorphic mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neumorphic-bg shadow-neumorphic-inset text-neumorphic-text placeholder-neumorphic-text focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full py-3 mt-4 rounded-xl btn-neumorphic shadow-neumorphic text-neumorphic-text font-medium hover:shadow-neumorphic-soft active:shadow-neumorphic-pressed"
            >
              {isSigningUp ? "Sign Up" : "Log In"}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSigningUp(!isSigningUp)}
            className="text-sm text-neumorphic-text hover:underline"
          >
            {isSigningUp
              ? "Already have an account? Log In "
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
      <div className=" text-center gap-2 fixed bottom-8 right-8 bg-[#601010] rounded-lg text-white p-3">
        <p className="text-sm">Email me if you want a custom page:</p>
        <b>adam74aldridge@gmail.com</b>
      </div>
    </div>
  );
}
