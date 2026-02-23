import { db } from "./firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";

export const initializeTruvana = async (managerEmail: string, managerUid: string) => {
  try {
    // 1. Create the Manager's Profile
    await setDoc(doc(db, "users", managerUid), {
      email: managerEmail,
      role: "admin", // Admin can see all properties
      createdAt: new Date().toISOString()
    });

    // 2. Create a Sample Property assigned to a specific owner
    // Let's imagine "Owner A" is one of his clients
    await addDoc(collection(db, "properties"), {
      name: "Truvana Heights",
      location: "Kampala Central",
      ownerId: "OWNER_A_UID", // We will replace this with real IDs later
      managedBy: managerUid,
      createdAt: new Date().toISOString()
    });

    console.log("Truvana Database Initialized Successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};