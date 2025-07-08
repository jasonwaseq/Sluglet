"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      console.log('Starting Firebase signup...');
      // Firebase signup
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      console.log('Firebase user created:', user.uid);
      
      // Call API to store user in Prisma
      console.log('Calling API to save user in database...');
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseId: user.uid,
          email: user.email,
        }),
      });
      
      console.log('API response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API error:', errorData);
        throw new Error("Failed to save user in database");
      }
      
      const result = await res.json();
      console.log('API success:', result);
      setSuccess("Signup successful! You can now log in.");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full mb-4 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-6 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-center">{success}</p>}
    </form>
  );
} 