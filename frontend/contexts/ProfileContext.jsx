import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/firebase';

const ProfileContext = createContext();

export function ProfileProvider({ children, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadProfile(user.uid);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async (uid) => {
    setLoading(true);
    try {
      const data = await dbService.getUserProfile(uid);
      // Auto-populate email from auth user object if missing/empty in profile
      if ((!data.email || data.email.trim() === '') && user?.email) {
        data.email = user.email;
        dbService.updateUserProfile(uid, { email: user.email }).catch(err => 
          console.error('Failed to auto-save profile email:', err)
        );
      }
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await loadProfile(user.uid);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
