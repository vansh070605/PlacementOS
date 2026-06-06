import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

// ── Firebase Configuration ────────────────────────────────────────────────────
// Loaded from Vite environment variables (VITE_*)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Determine if Firebase is configured
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('PlacementOS: Firebase successfully initialized.');
  } catch (error) {
    console.error('PlacementOS: Failed to initialize Firebase:', error);
  }
} else {
  console.log('PlacementOS: No Firebase config detected. Running in LocalStorage Fallback mode.');
}

// ── Mock Fallback Database (LocalStorage) ────────────────────────────────────
const DEFAULT_PROFILE = {
  fullName: 'Vansh Agrawal',
  title: 'Candidate Profile',
  email: 'vansh.agrawal@example.com',
  phone: '+91 98765 43210',
  location: 'Mumbai, India',
  github: 'https://github.com/vansh070605',
  linkedin: 'https://linkedin.com/in/vansh-agrawal',
  website: 'https://vanshagrawal.dev',
  leetcode: 'va2583',
  bio: 'Computer Science student and software engineering enthusiast. Experienced in React, JavaScript, Python, and building intelligent agents.',
  skills: ['React', 'JavaScript', 'Python', 'FastAPI', 'CSS', 'ChromaDB', 'SQL', 'Git'],
  avatarUrl: ''
};

const getLocalUsers = () => {
  const users = localStorage.getItem('pos_fallback_users');
  return users ? JSON.parse(users) : {};
};

const saveLocalUsers = (users) => {
  localStorage.setItem('pos_fallback_users', JSON.stringify(users));
};

const getLocalProfile = (uid) => {
  const profile = localStorage.getItem(`pos_profile_${uid}`);
  if (profile) return JSON.parse(profile);
  // Default fallback for Vansh
  if (uid === 'vansh_default') return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, email: '' }; // blank template
};

const saveLocalProfile = (uid, profile) => {
  localStorage.setItem(`pos_profile_${uid}`, JSON.stringify(profile));
};

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  async login(email, password) {
    if (auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } else {
      // Mock Login
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getLocalUsers();
          const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (!user || user.password !== password) {
            reject(new Error('Invalid email or password.'));
          } else {
            const sessionUser = { uid: user.uid, email: user.email, displayName: user.fullName };
            localStorage.setItem('pos_fallback_current_user', JSON.stringify(sessionUser));
            resolve(sessionUser);
          }
        }, 500);
      });
    }
  },

  async signup(email, password, fullName) {
    if (auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create profile in Firestore
      await dbService.updateUserProfile(userCredential.user.uid, {
        fullName,
        email,
        title: 'Candidate Profile',
        skills: []
      });
      return userCredential.user;
    } else {
      // Mock Signup
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const users = getLocalUsers();
          if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())) {
            reject(new Error('Email already in use.'));
            return;
          }

          const uid = 'usr_' + Math.random().toString(36).substr(2, 9);
          const newUser = { uid, email, password, fullName };
          users[uid] = newUser;
          saveLocalUsers(users);

          // Save default profile data for this user
          const profile = {
            ...DEFAULT_PROFILE,
            fullName,
            email,
            title: 'Candidate Profile',
            skills: []
          };
          saveLocalProfile(uid, profile);

          const sessionUser = { uid, email, displayName: fullName };
          localStorage.setItem('pos_fallback_current_user', JSON.stringify(sessionUser));
          resolve(sessionUser);
        }, 500);
      });
    }
  },

  async logout() {
    if (auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem('pos_fallback_current_user');
    }
  },

  onAuthStateChange(callback) {
    if (auth) {
      return onAuthStateChanged(auth, callback);
    } else {
      // Mock Auth State Listener
      const checkUser = () => {
        const saved = localStorage.getItem('pos_fallback_current_user');
        if (saved) {
          return JSON.parse(saved);
        }
        // If first load and no user is logged in, we initialize with a default user
        const firstLoad = !localStorage.getItem('pos_has_loaded_before');
        if (firstLoad) {
          localStorage.setItem('pos_has_loaded_before', 'true');
          const defaultSession = { uid: 'vansh_default', email: 'vansh.agrawal@example.com', displayName: 'Vansh Agrawal' };
          localStorage.setItem('pos_fallback_current_user', JSON.stringify(defaultSession));
          return defaultSession;
        }
        return null;
      };

      // Initial callback call
      const user = checkUser();
      callback(user);

      // Simple interval based simulation of auth state changes (checking storage changes)
      const interval = setInterval(() => {
        const currentUser = localStorage.getItem('pos_fallback_current_user');
        const parsed = currentUser ? JSON.parse(currentUser) : null;
        if (JSON.stringify(parsed?.uid) !== JSON.stringify(user?.uid)) {
          callback(parsed);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }
};

// ── Database Service ──────────────────────────────────────────────────────────
export const dbService = {
  async getUserProfile(uid) {
    if (db) {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Fallback profile if none exists in firestore
        return DEFAULT_PROFILE;
      }
    } else {
      // Mock Firestore Get
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getLocalProfile(uid));
        }, 300);
      });
    }
  },

  async updateUserProfile(uid, data) {
    if (db) {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, data, { merge: true });
    } else {
      // Mock Firestore Update
      return new Promise((resolve) => {
        setTimeout(() => {
          const currentProfile = getLocalProfile(uid);
          const updatedProfile = { ...currentProfile, ...data };
          saveLocalProfile(uid, updatedProfile);
          resolve(updatedProfile);
        }, 300);
      });
    }
  },

  async getUserData(uid) {
    if (db) {
      const docRef = doc(db, 'userData', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } else {
      // Mock Firestore Get User Workspace
      return new Promise((resolve) => {
        setTimeout(() => {
          const saved = localStorage.getItem(`pos_userdata_${uid}`);
          resolve(saved ? JSON.parse(saved) : null);
        }, 300);
      });
    }
  },

  async saveUserData(uid, data) {
    if (db) {
      const docRef = doc(db, 'userData', uid);
      await setDoc(docRef, data, { merge: true });
    } else {
      // Mock Firestore Save User Workspace
      return new Promise((resolve) => {
        setTimeout(() => {
          localStorage.setItem(`pos_userdata_${uid}`, JSON.stringify(data));
          resolve(data);
        }, 300);
      });
    }
  }
};
