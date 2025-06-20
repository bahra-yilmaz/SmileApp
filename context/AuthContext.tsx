import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../services/supabaseClient';
import { GuestUserService } from '../services/GuestUserService';
import { LanguageService } from '../services/LanguageService';

// Define the shape of the context's value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Start with loading true
    setIsLoading(true);

    // Get the initial session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };
    
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const previousUser = user;
        setSession(session);
        setUser(session?.user ?? null);
        if (isLoading) setIsLoading(false); // Stop loading once we have a definite state
        
        // Handle user sign in
        if (event === 'SIGNED_IN' && session?.user && !previousUser) {
          console.log('🔄 User signed in, loading preferences...');
          try {
            // Clear guest data
            await GuestUserService.clearGuestData();
            console.log('✅ Guest data cache cleared for authenticated user');
            
            // Load user's language preference
            await LanguageService.loadAndApplyUserLanguage(session.user.id);
            console.log('✅ User language preference loaded');
          } catch (error) {
            console.error('❌ Error loading user preferences:', error);
          }
        }

        // Handle user sign out
        if (event === 'SIGNED_OUT') {
          console.log('🔄 User signed out, loading default language...');
          try {
            // Load default language (device or fallback)
            await LanguageService.loadAndApplyUserLanguage();
            console.log('✅ Default language loaded');
          } catch (error) {
            console.error('❌ Error loading default language:', error);
          }
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};