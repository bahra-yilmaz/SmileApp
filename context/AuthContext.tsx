import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../services/supabaseClient';
import { GuestUserService } from '../services/GuestUserService';
import { LanguageService } from '../services/LanguageService';
import { ToothbrushService } from '../services/toothbrush';

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
    setIsLoading(true);
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;

        // Use functional update to safely get the previous user state
        setUser(prevUser => {
          const isNewSignIn = !prevUser && currentUser;
          if (isNewSignIn && currentUser) {
            console.log('✨ New user signed in! Initializing user data.');
            
            // Helper to derive username from email when not present in metadata
            const deriveUsername = (email: string | undefined | null) => {
              if (!email) return '';
              const localPart = email.split('@')[0];
              return localPart.replace(/\d+/g, '').toLowerCase();
            };

            // Prepare tasks to run in parallel on new sign in
            const tasks: Promise<any>[] = [
              GuestUserService.clearGuestData(),
              LanguageService.loadAndApplyUserLanguage(currentUser.id),
              // ToothbrushService is now initialized on-demand by useToothbrushStats
            ];

            // Ensure the user has a username metadata field
            if (!currentUser.user_metadata?.username && currentUser.email) {
              const derived = deriveUsername(currentUser.email);
              if (derived) {
                tasks.push(
                  supabase.auth.updateUser({
                    data: { username: derived },
                  })
                );
              }
            }

            Promise.all(tasks).catch(error => {
              console.error('❌ Error initializing user data / setting username:', error);
            });
          }
          return currentUser;
        });

        setSession(session);

        if (event === 'SIGNED_OUT') {
          console.log('💨 User signed out. Loading default language.');
          LanguageService.loadAndApplyUserLanguage();
        }
        
        setIsLoading(false);
      }
    );

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