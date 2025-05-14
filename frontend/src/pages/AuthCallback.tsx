import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseAuth';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          navigate('/login');
          return;
        }

        // Check if user's email is allowed
        const response = await fetch(`${BACKEND_URL}/api/v1/check-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ email: session.user.email })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Access denied');
        }

        // If access is granted, redirect to home
        navigate('/');
      } catch (err) {
        console.error('Error checking access:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Sign out the user if they're not allowed
        await supabase.auth.signOut();
      }
    };

    checkUserAccess();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default AuthCallback; 