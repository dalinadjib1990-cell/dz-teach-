import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Fire and forget online status update
        updateDoc(doc(db, 'users', user.uid), {
          status: 'online',
          lastSeen: new Date().toISOString()
        }).catch(() => {}); 
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Set a timeout as a fallback to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 seconds fallback

      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        clearTimeout(timeoutId);
        setProfile(doc.data() || null);
        setLoading(false);
      }, (error) => {
        console.error("Profile Snapshot Error:", error);
        clearTimeout(timeoutId);
        setLoading(false);
      });

      // Handle disconnect
      const handleDisconnect = () => {
        updateDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      };

      window.addEventListener('beforeunload', handleDisconnect);

      return () => {
        unsubscribeProfile();
        window.removeEventListener('beforeunload', handleDisconnect);
        handleDisconnect();
      };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
