"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import ProfileMessage from './ProfileMessage';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  createdAt: string;
  images: string[];
}

export default function ProfilePage() {
  const [description, setDescription] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteListingConfirm, setShowDeleteListingConfirm] = useState<string | null>(null);
  const [deletingListing, setDeletingListing] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          // Fetch user profile from database
          const response = await fetch(`/api/user?supabaseId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setDescription(data.user.description || '');
            setProfilePicture(data.user.profilePicture || null);
          }
          
          // Fetch user listings
          await fetchUserListings(user.id);
        } catch (_error) {
          console.error('Error fetching profile:', _error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfile();
    } else {
      router.push('/auth');
    }
  }, [user, router]);

  const fetchUserListings = async (userId: string) => {
    setLoadingListings(true);
    try {
      console.log('Fetching listings for user:', userId);
      const response = await fetch(`/api/listings?supabaseId=${userId}`);
      console.log('Listings API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Listings API response data:', data);
        setUserListings(data.listings || []);
      } else {
        console.error('Failed to fetch listings:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
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
        <div className="bg-blue-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Profile Information</h2>
          </div>
          
          {/* Profile Picture Section */}
          <div className="mb-8">
            <label className="block text-blue-200 mb-4 font-semibold text-lg">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                {profilePicture ? (
                  <div className="relative">
                    <Image
                      src={profilePicture}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-4 border-yellow-500 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-30 h-30 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {profilePicture ? 'Change Picture' : 'Upload Picture'}
                  </div>
                </button>
                {profilePicture && (
                  <button
                    onClick={() => setProfilePicture(null)}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Picture
                    </div>
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>

          {/* Email Display */}
          <div className="mb-8">
            <label className="block text-blue-200 mb-3 font-semibold text-lg">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 border border-blue-600 rounded-lg bg-blue-700 text-blue-300 cursor-not-allowed shadow-inner"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            <p className="text-blue-300 text-sm mt-2">Your email address cannot be changed</p>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-blue-200 mb-3 font-semibold text-lg">About Me</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-700 text-white placeholder-blue-300 shadow-inner resize-none"
              placeholder="Tell us about yourself, your interests, or what you're looking for in housing..."
            />
            <p className="text-blue-300 text-sm mt-2">This information will be visible to other users</p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save Profile'}
              </div>
            </button>
            {saving && (
              <div className="flex items-center gap-2 text-blue-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span>Updating profile...</span>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-blue-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Change Password</h2>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-blue-200">Update your account password for enhanced security</p>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </div>
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-6 bg-blue-700 rounded-lg p-6">
              <div>
                <label className="block text-blue-200 mb-3 font-semibold">Current Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white shadow-inner"
                    placeholder="Enter your current password"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-blue-200 mb-3 font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white shadow-inner"
                    placeholder="Enter your new password"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-blue-300 text-sm mt-2">Password must be at least 6 characters long</p>
              </div>
              <div>
                <label className="block text-blue-200 mb-3 font-semibold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white shadow-inner"
                    placeholder="Confirm your new password"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {changingPassword ? 'Changing Password...' : 'Update Password'}
                  </div>
                </button>
                {changingPassword && (
                  <div className="flex items-center gap-2 text-blue-200">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                    <span>Updating password...</span>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* User Listings Section */}
        <div className="bg-blue-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">My Listings</h2>
          </div>
          
          <div className="flex justify-between items-center mb-8">
            <p className="text-blue-200">Manage your housing listings and create new ones</p>
            <button
              onClick={() => router.push('/create-listing')}
              className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Listing
              </div>
            </button>
          </div>

          {loadingListings ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <div className="text-blue-200 text-lg">Loading your listings...</div>
            </div>
          ) : userListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Listings Yet</h3>
              <p className="text-blue-300 mb-6 max-w-md mx-auto">You haven&apos;t created any housing listings yet. Start by creating your first listing to help students find housing.</p>
              <button
                onClick={() => router.push('/create-listing')}
                className="px-8 py-4 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Listing
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userListings.map((listing) => (
                <div key={listing.id} className="bg-blue-700 rounded-lg p-6 border border-blue-600 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-white">{listing.title}</h3>
                        <span className="text-yellow-400 font-bold text-lg">${listing.price}/month</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-blue-200">{listing.location}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-blue-300 text-sm">
                          Created {new Date(listing.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-blue-200 text-sm line-clamp-2">{listing.description}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => router.push(`/listings/${listing.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        title="View listing"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </div>
                      </button>
                      <button
                        onClick={() => router.push(`/edit-listing/${listing.id}`)}
                        className="px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        title="Edit listing"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </div>
                      </button>
                      <button
                        onClick={() => setShowDeleteListingConfirm(listing.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        title="Delete listing"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteListingConfirm === listing.id && (
                    <div className="mt-6 p-6 bg-red-900 rounded-lg border border-red-700 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-white">Confirm Deletion</h4>
                      </div>
                      <p className="text-red-200 mb-4">
                        Are you sure you want to delete &quot;{listing.title}&quot;? This action cannot be undone and will permanently remove the listing.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          disabled={deletingListing === listing.id}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {deletingListing === listing.id ? 'Deleting...' : 'Yes, Delete'}
                          </div>
                        </button>
                        <button
                          onClick={() => setShowDeleteListingConfirm(null)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
        <div className="bg-red-900 rounded-lg shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Delete Account</h2>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-red-200">Permanently delete your account and all associated data</p>
            <button
              onClick={() => setShowDeleteAccountConfirm(!showDeleteAccountConfirm)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {showDeleteAccountConfirm ? 'Cancel' : 'Delete Account'}
              </div>
            </button>
          </div>

          {showDeleteAccountConfirm && (
            <div className="bg-red-800 rounded-lg p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white">Confirm Account Deletion</h4>
              </div>
              <div className="bg-red-700 rounded-lg p-4 mb-6">
                <p className="text-red-200 mb-2">
                  <strong>⚠️ Warning:</strong> This action cannot be undone.
                </p>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• All your listings will be permanently deleted</li>
                  <li>• Your profile information will be removed</li>
                  <li>• Your account data will be completely erased</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-red-200 mb-3 font-semibold">Enter your password to confirm</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-4 py-3 border border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-700 text-white shadow-inner"
                      placeholder="Enter your password"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={deletingAccount}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
                    </div>
                  </button>
                  {deletingAccount && (
                    <div className="flex items-center gap-2 text-red-200">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      <span>Deleting account...</span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (<ProfileMessage error={error}/>
        )}
        {success && (
          <div className="mt-6 p-6 bg-green-500 text-white rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-semibold">{success}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 