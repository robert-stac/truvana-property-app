import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// CHANGE THIS LINE: Remove "/lite"
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Ensure the next line matches your Firebase Console exactly (no spaces!)
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "truvana-holdings", 
  storageBucket: "truvana-holdings-property-app.firebasestorage.app",
  messagingSenderId: "549237684790",
  appId: "1:549237684790:web:77b14ad3b7bfd6916df697",
  measurementId: "G-DB07FG1451"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics helper (prevents errors in environments where analytics isn't supported)
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});