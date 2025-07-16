import { AuthError } from '@supabase/supabase-js';

export const handleAuthError = (error: AuthError | Error) => {
  console.error('Authentication error:', error);
  
  // Handle specific Supabase auth errors
  if (error instanceof AuthError) {
    switch (error.message) {
      case 'Invalid Refresh Token: Refresh Token Not Found':
      case 'Invalid refresh token':
      case 'Refresh token not found':
        // Clear session and redirect to auth
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          window.location.href = '/auth';
        }
        break;
      case 'JWT expired':
        // Token expired, redirect to auth
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        break;
      default:
        // For other auth errors, just log them
        console.error('Auth error:', error.message);
    }
  } else {
    // For non-auth errors, just log them
    console.error('Error:', error.message);
  }
};

export const clearAuthSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
  }
};

export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError || 
         (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && 
          (error.message.includes('Invalid Refresh Token') || 
           error.message.includes('JWT expired') ||
           error.message.includes('Refresh token'))) as boolean;
}; 