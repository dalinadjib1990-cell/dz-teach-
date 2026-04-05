import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
      console.log("Auth State Changed. User UID:", user?.uid);
      setUser(user);
      if (!user) {
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

      // Update presence and ensure basic info exists
      const names = user.displayName?.split(' ') || [];
      const defaultFirstName = names[0] || '';
      const defaultLastName = names.slice(1).join(' ') || '';
      
      console.log("Attempting to save user profile for:", user.uid);
      
      setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        // Only set these if they don't exist to avoid overwriting profile edits
        name: profile?.name || user.displayName || `${defaultFirstName} ${defaultLastName}`.trim() || 'أستاذ جديد',
        firstName: profile?.firstName || defaultFirstName,
        lastName: profile?.lastName || defaultLastName,
        photoURL: profile?.photoURL || user.photoURL,
        subject: profile?.subject || '',
        wilaya: profile?.wilaya || '',
        status: 'online',
        lastSeen: new Date().toISOString()
      }, { merge: true })
      .then(() => console.log("User presence and profile saved successfully for:", user.uid))
      .catch((err) => {
        console.error("Error saving user profile:", err);
        // If it's a permission error, it might be because the rules are not deployed or incorrect
        if (err.code === 'permission-denied') {
          console.error("Permission denied. Check Firestore rules.");
        }
      });

      // Handle disconnect
      const handleDisconnect = () => {
        setDoc(doc(db, 'users', user.uid), {
          status: 'offline',
          lastSeen: new Date().toISOString()
        }, { merge: true });
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
