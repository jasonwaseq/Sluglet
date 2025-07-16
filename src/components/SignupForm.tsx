"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { handleAuthError } from '@/lib/auth-utils';

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["text-red-500", "text-orange-500", "text-yellow-500", "text-blue-500", "text-green-500"];
    
    return {
      score: Math.min(score, 4),
      maxScore: 5,
      label: labels[Math.min(score - 1, 4)] || "",
      color: colors[Math.min(score - 1, 4)] || "text-gray-500"
    };
  };

  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Password is too weak. Please choose a stronger password.");
      setLoading(false);
      return;
    }

    try {
      console.log('Starting Supabase signup...');
      // Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        handleAuthError(error);
        throw error;
      }
      
      console.log('Supabase user created:', data.user?.id);
      
      // Call API to store user in Prisma (only Supabase UID and email)
      console.log('Calling API to save user in database...');
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: data.user?.id,
          email: data.user?.email,
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
      setSuccess("Signup successful! Please check your email to verify your account.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Signup failed");
      } else {
        setError("An unexpected error occurred.");
      }
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
        className="w-full mb-2 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      
      {/* Password strength indicator */}
      {password.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 w-8 rounded ${
                    level <= passwordStrength.score
                      ? passwordStrength.color.replace('text-', 'bg-')
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className={`text-sm ${passwordStrength.color}`}>
              {passwordStrength.label}
            </span>
          </div>
        </div>
      )}
      
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        className={`w-full mb-6 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          confirmPassword.length > 0
            ? passwordsMatch
              ? 'border-green-300'
              : 'border-red-300'
            : 'border-gray-300'
        }`}
        required
      />
      
      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="text-red-500 text-sm mb-4">Passwords do not match</p>
      )}
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        disabled={loading || !passwordsMatch || passwordStrength.score < 3}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-center">{success}</p>}
    </form>
  );
} 