
'use client';

import { GoogleAuthProvider } from "firebase/auth";
import { initializeFirebase } from "@/firebase";

const { auth, db } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
