"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

interface UserListing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrl?: string;
  images?: string[];
  amenities: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Profile form state
  const [description, setDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // User listings state
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [showDeleteListingConfirm, setShowDeleteListingConfirm] = useState<string | null>(null);
  const [deletingListing, setDeletingListing] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      router.push('/auth');
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          // Fetch user profile from database
          const response = await fetch(`/api/user?supabaseId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setDescription(data.user.description || '');
            setProfilePicture(data.user.profilePicture || null);
          }
          
          // Fetch user listings
          await fetchUserListings(session.user.id);
        } catch (_error) {
          console.error('Error fetching profile:', _error);
        }
      } else {
        router.push('/auth');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchUserListings = async (userId: string) => {
    setLoadingListings(true);
    try {
      const response = await fetch(`/api/listings?supabaseId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserListings(data.listings || []);
      }
    } catch (_error) {
      console.error('Error fetching listings:', _error);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!user) return;
    
    setDeletingListing(listingId);
    setError('');
    
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseId: user.id })
      });

      if (response.ok) {
        setSuccess('Listing deleted successfully!');
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        setShowDeleteListingConfirm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete listing');
      }
    } catch {
      setError('Failed to delete listing');
    } finally {
      setDeletingListing(null);
    }
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePicture(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: user.id,
          description,
          profilePicture
        })
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        // Update local profile state
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    setError('');

    try {
      // Update password with Supabase
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess('Password changed successfully!');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setDeletingAccount(true);
    setError('');

    try {
      // Delete user from database first
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseId: user.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete user data');
      }
      
      // Delete Supabase user
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        throw error;
      }
      
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Navigation Bar */}
      <nav className="bg-blue-800 shadow-lg border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center pt-1 hover:opacity-80 transition-opacity"
              >
                <Image 
                  src="/SlugletLogoYellow.svg" 
                  alt="Sluglet Logo" 
                  width={80} 
                  height={40}
                  priority
                />
              </button>
            </div>

            {/* Page Title */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold text-white">
                Profile Settings
              </h1>
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-blue-200 hover:text-white transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-800 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
          
          {/* Profile Picture Section */}
          <div className="mb-6">
            <label className="block text-blue-200 mb-3 font-medium">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={100}
                    height={100}
                    className="rounded-full object-cover border-4 border-yellow-500"
                  />
                ) : (
                  <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                >
                  {profilePicture ? 'Change Picture' : 'Upload Picture'}
                </button>
                {profilePicture && (
                  <button
                    onClick={() => setProfilePicture(null)}
                    className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Display */}
          <div className="mb-6">
            <label className="block text-blue-200 mb-2 font-medium">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 border border-blue-600 rounded-lg bg-blue-700 text-blue-300 cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-blue-200 mb-2 font-medium">About Me</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Password Change Section */}
        <div className="bg-blue-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Change Password</h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-blue-200 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-200 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-blue-200 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50"
              >
                {changingPassword ? 'Changing Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        {/* User Listings Section */}
        <div className="bg-blue-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">My Listings</h2>
            <button
              onClick={() => router.push('/create-listing')}
              className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
            >
              Create New Listing
            </button>
          </div>

          {loadingListings ? (
            <div className="text-center py-8">
              <div className="text-blue-200">Loading your listings...</div>
            </div>
          ) : userListings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-blue-300 mb-4">You haven&apos;t created any listings yet.</div>
              <button
                onClick={() => router.push('/create-listing')}
                className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userListings.map((listing) => (
                <div key={listing.id} className="bg-blue-700 rounded-lg p-4 border border-blue-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
                        <span className="text-yellow-400 font-bold">${listing.price}/month</span>
                      </div>
                      <p className="text-blue-200 mb-2">📍 {listing.location}</p>
                      <p className="text-blue-300 text-sm mb-3">
                        {new Date(listing.availableFrom).toLocaleDateString()} - {new Date(listing.availableTo).toLocaleDateString()}
                      </p>
                      <p className="text-blue-200 text-sm line-clamp-2">{listing.description}</p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/listings/${listing.id}`)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition text-sm"
                        title="View listing"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/edit-listing/${listing.id}`)}
                        className="px-3 py-1 bg-yellow-500 text-blue-900 rounded hover:bg-yellow-400 transition text-sm"
                        title="Edit listing"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteListingConfirm(listing.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                        title="Delete listing"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteListingConfirm === listing.id && (
                    <div className="mt-4 p-3 bg-red-900 rounded border border-red-700">
                      <p className="text-red-200 text-sm mb-3">
                        Are you sure you want to delete &quot;{listing.title}&quot;? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          disabled={deletingListing === listing.id}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm disabled:opacity-50"
                        >
                          {deletingListing === listing.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteListingConfirm(null)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Account Section */}
        <div className="bg-red-900 rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Delete Account</h2>
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              {showDeleteConfirm ? 'Cancel' : 'Delete Account'}
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="bg-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-200 mb-4">
                <strong>Warning:</strong> This action cannot be undone. All your data, including listings, will be permanently deleted.
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-red-200 mb-2">Enter your password to confirm</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2 border border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-700 text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                >
                  {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500 text-white rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-500 text-white rounded-lg">
            {success}
          </div>
        )}
      </main>
    </div>
  );
} 