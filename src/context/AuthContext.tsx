import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth, db } from "../firebase"; 
import { doc, getDoc, setDoc } from "firebase/firestore"; 

// Updated UserProfile to include Super Admin and Subscription logic
interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "owner"; 
  username: string;
  lastActive?: string; 
  isSuperAdmin?: boolean; // Secret flag for you
  subscriptionStatus?: "active" | "expired" | "none"; // Subscription tracker
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  registerNewUser: (email: string, pass: string, username: string, role: "admin" | "owner") => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser && db) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          
          // Update last active status every time they log in/refresh
          await setDoc(docRef, {
            lastActive: new Date().toISOString()
          }, { merge: true });

          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // We spread all data from Firestore into the currentUser state
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: data.role || "owner",
              username: data.username || "User",
              lastActive: data.lastActive,
              isSuperAdmin: data.isSuperAdmin || false, // Capture the flag
              subscriptionStatus: data.subscriptionStatus || "none" // Capture status
            });
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Firestore sync error:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    console.log("Attempting login for:", email);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error: any) {
      console.error("Firebase Error Code:", error.code);
      console.error("Firebase Error Message:", error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!db) return;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const newProfile = {
        username: user.displayName || user.email?.split('@')[0] || "User",
        role: "owner" as const,
        email: user.email || "",
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isSuperAdmin: false, // Default to false for security
        subscriptionStatus: "none"
      };
      await setDoc(docRef, newProfile);
      
      setCurrentUser({
        uid: user.uid,
        email: user.email || "",
        role: "owner",
        username: newProfile.username,
        isSuperAdmin: false,
        subscriptionStatus: "none"
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const registerNewUser = async (email: string, pass: string, username: string, role: "admin" | "owner") => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (!db) return;

    await setDoc(doc(db, "users", res.user.uid), {
      username,
      role,
      email,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isSuperAdmin: false,
      subscriptionStatus: "none"
    });
  };

  const resetUserPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      logout, 
      registerNewUser, 
      loginWithGoogle,
      resetUserPassword 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};