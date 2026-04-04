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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Set online status
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'online',
          lastSeen: new Date().toISOString()
        }).catch(() => {}); // Ignore if doc doesn't exist yet
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        setProfile(doc.data() || null);
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
