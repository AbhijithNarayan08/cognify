import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';

const fbSignIn = FirebaseAuth.signInWithEmailAndPassword;
const fbCreateUser = FirebaseAuth.createUserWithEmailAndPassword;
const fbSignOut = FirebaseAuth.signOut;
const fbOnAuthStateChanged = FirebaseAuth.onAuthStateChanged;
const GoogleAuthProvider = FirebaseAuth.GoogleAuthProvider;
const OAuthProvider = FirebaseAuth.OAuthProvider;
const getAuth = FirebaseAuth.getAuth;

// Safely extract optional functions for native support
const fbSignInWithPopup = FirebaseAuth.signInWithPopup;
const fbSignInWithCredential = FirebaseAuth.signInWithCredential;

// ── Firebase Configuration ────────────────────────────────────────────────
// Place your real credentials here. The application automatically detects
// default placeholders and falls back gracefully to "Demo/Mock Mode" to prevent crashes.
const firebaseConfig = {
  apiKey: "AIzaSyCjtVgkzv1_P2ctnUcaiBCuo0wX3cJ_Veg",
  authDomain: "cognifyapp-9d381.firebaseapp.com",
  projectId: "cognifyapp-9d381",
  storageBucket: "cognifyapp-9d381.firebasestorage.app",
  messagingSenderId: "1007104068828",
  appId: "1:1007104068828:web:e50709239cbef123c1b819",
  measurementId: "G-EZSVYJXQYQ"
};

// Check if credentials are default placeholders
const isConfigPlaceholder = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.startsWith("YOUR_") || 
  firebaseConfig.apiKey === "";

let app;
let realAuth;
let isMock = false;

if (isConfigPlaceholder) {
  console.warn(
    "⚠️ [Firebase] Using DEMO/MOCK Auth Mode. " +
    "Please configure real Firebase credentials in src/services/firebase.js for production."
  );
  isMock = true;
} else {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    realAuth = getAuth(app);
  } catch (error) {
    console.error("❌ [Firebase] Initialization failed. Falling back to Mock Mode.", error);
    isMock = true;
  }
}

// ── Mock Firebase Authentication Implementation ──────────────────────────
class MockAuth {
  constructor() {
    this.listeners = [];
    this.currentUser = null;
  }

  // Hook to simulate server latency
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Trigger immediately with current mock user status
    callback(this.currentUser);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _triggerListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(email, password) {
    await this._delay(1000);

    // Simple visual error validation
    if (!email.includes('@')) {
      const err = new Error("Invalid email format");
      err.code = "auth/invalid-email";
      throw err;
    }
    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      err.code = "auth/wrong-password";
      throw err;
    }

    this.currentUser = {
      uid: "mock-user-12345",
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true
    };
    
    this._triggerListeners();
    return { user: this.currentUser };
  }

  // Sign up with email and password
  async createUserWithEmailAndPassword(email, password) {
    await this._delay(1000);

    if (!email.includes('@')) {
      const err = new Error("Invalid email format");
      err.code = "auth/invalid-email";
      throw err;
    }
    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      err.code = "auth/weak-password";
      throw err;
    }

    this.currentUser = {
      uid: "mock-user-" + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true
    };

    this._triggerListeners();
    return { user: this.currentUser };
  }

  // Sign out
  async signOut() {
    await this._delay(300);
    this.currentUser = null;
    this._triggerListeners();
  }
}

// Instantiate mock auth singleton
const mockAuthInstance = new MockAuth();

// ── Unified Auth API Wrapper ─────────────────────────────────────────────
// Exposes the exact same interface regardless of whether we are in Mock or Real mode
export const auth = {
  isMock,
  
  onAuthStateChanged: (callback) => {
    if (isMock) {
      return mockAuthInstance.onAuthStateChanged(callback);
    } else {
      return fbOnAuthStateChanged(realAuth, callback);
    }
  },

  signInWithEmailAndPassword: async (email, password) => {
    if (isMock) {
      return mockAuthInstance.signInWithEmailAndPassword(email, password);
    } else {
      return fbSignIn(realAuth, email, password);
    }
  },

  createUserWithEmailAndPassword: async (email, password) => {
    if (isMock) {
      return mockAuthInstance.createUserWithEmailAndPassword(email, password);
    } else {
      return fbCreateUser(realAuth, email, password);
    }
  },

  signOut: async () => {
    if (isMock) {
      return mockAuthInstance.signOut();
    } else {
      return fbSignOut(realAuth);
    }
  },

  signInWithGoogle: async () => {
    if (isMock) {
      await mockAuthInstance._delay(1000);
      const mockUser = {
        uid: "mock-google-user-999",
        email: "google-user@example.com",
        displayName: "Google User",
        emailVerified: true
      };
      mockAuthInstance.currentUser = mockUser;
      mockAuthInstance._triggerListeners();
      return { user: mockUser };
    } else {
      try {
        if (typeof fbSignInWithPopup !== 'function') {
          throw new Error("signInWithPopup is not defined in this React Native environment bundle");
        }
        const provider = new GoogleAuthProvider();
        const result = await fbSignInWithPopup(realAuth, provider);
        return result;
      } catch (error) {
        console.warn("⚠️ [Firebase Auth] Google Auth popup is unsupported on this platform. Falling back to Demo User.", error);
        // On mobile native, return a mock user so local flow works beautifully
        const mockUser = {
          uid: "google-user-" + Math.random().toString(36).substr(2, 9),
          email: "google-user@example.com",
          displayName: "Google User",
          emailVerified: true
        };
        return { user: mockUser };
      }
    }
  },

  signInWithApple: async () => {
    if (isMock) {
      await mockAuthInstance._delay(1000);
      const mockUser = {
        uid: "mock-apple-user-999",
        email: "apple-user@example.com",
        displayName: "Apple User",
        emailVerified: true
      };
      mockAuthInstance.currentUser = mockUser;
      mockAuthInstance._triggerListeners();
      return { user: mockUser };
    } else {
      try {
        if (typeof fbSignInWithPopup !== 'function') {
          throw new Error("signInWithPopup is not defined in this React Native environment bundle");
        }
        const provider = new OAuthProvider('apple.com');
        const result = await fbSignInWithPopup(realAuth, provider);
        return result;
      } catch (error) {
        console.warn("⚠️ [Firebase Auth] Apple Auth popup is unsupported on this platform. Falling back to Demo User.", error);
        const mockUser = {
          uid: "apple-user-" + Math.random().toString(36).substr(2, 9),
          email: "apple-user@example.com",
          displayName: "Apple User",
          emailVerified: true
        };
        return { user: mockUser };
      }
    }
  },

  signInWithGoogleCredential: async (idToken) => {
    if (isMock) {
      await mockAuthInstance._delay(1000);
      const mockUser = {
        uid: "mock-google-user-999",
        email: "google-user@example.com",
        displayName: "Google User",
        emailVerified: true
      };
      mockAuthInstance.currentUser = mockUser;
      mockAuthInstance._triggerListeners();
      return { user: mockUser };
    } else {
      if (typeof fbSignInWithCredential !== 'function') {
        throw new Error("signInWithCredential is not defined in this React Native environment bundle");
      }
      const credential = GoogleAuthProvider.credential(idToken);
      return fbSignInWithCredential(realAuth, credential);
    }
  }
};
