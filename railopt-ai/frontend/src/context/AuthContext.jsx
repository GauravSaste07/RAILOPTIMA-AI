import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user's profile from database
  const fetchProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('id, role, department_id, departments(id, name)')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch note (may be new user or profile pending trigger):', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        if (mounted) setProfile(userProfile);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        if (mounted) setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Real Supabase Login (email & password only)
  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    let userProfile = null;
    if (data?.user) {
      setUser(data.user);
      userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);
    }

    return { data, user: data?.user, profile: userProfile };
  };

  // Real Supabase Signup with department selection
  const signup = async ({ email, password, departmentId, departmentName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          department_id: departmentId,
          department: departmentName,
          role: 'user', // Default role is always user
        },
      },
    });

    if (error) {
      console.error('[Supabase SignUp Error]:', error);
      return { error };
    }

    let activeUser = data?.user;

    // If session was not automatically established (e.g. email confirmation setting), sign in immediately
    if (!data?.session) {
      const loginAttempt = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginAttempt.data?.user) {
        activeUser = loginAttempt.data.user;
      }
    }

    let userProfile = null;
    if (activeUser) {
      setUser(activeUser);
      userProfile = await fetchProfile(activeUser.id);
      setProfile(userProfile);
    }

    return { data, user: activeUser, profile: userProfile };
  };

  // Real Supabase Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || user?.user_metadata?.role || 'user';
  const department = profile?.departments?.name || user?.user_metadata?.department || 'Operations';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        department,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
