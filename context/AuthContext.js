"use client";

import { useContext, createContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase"; // 1. Import db
import { doc, getDoc, setDoc } from "firebase/firestore"; // 2. Import firestore functions
import { getUserByUsername } from "@/lib/data";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch their user document from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Combine auth data and firestore data
          setUser({
            uid: user.uid,
            email: user.email,
            ...userDocSnap.data(), // This will add the 'username' field
          });
        } else {
          // This case can happen if user exists in Auth but not in Firestore DB.
          // For robustness, you could log them out or create the doc here.
          console.error("User document not found in Firestore!");
          setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, username) => {
    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters long.");
    }
    const formattedUsername = username.toLowerCase();

    // Check if username is already taken
    const userDoc = await getUserByUsername(formattedUsername);
    if (userDoc) {
      throw new Error("Username is already taken.");
    }

    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create the user document in the 'users' collection in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      username: formattedUsername,
    });

    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setUser(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
