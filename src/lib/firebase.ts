// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUHs3JXgYPiTMb_PviAu1cJVvS6r1C5ZA",
  authDomain: "sluglet-aa814.firebaseapp.com",
  projectId: "sluglet-aa814",
  storageBucket: "sluglet-aa814.appspot.com",
  messagingSenderId: "697722377424",
  appId: "1:697722377424:web:709e69fe23e8b513d0bad5",
  measurementId: "G-YWR6Z1RF6V"
};

// Initialize Firebase (avoid re-initializing in hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the auth object for use in your app
export const auth = getAuth(app);

// (Optional) Only use analytics in the browser
// import { getAnalytics, isSupported } from "firebase/analytics";
// let analytics: ReturnType<typeof getAnalytics> | undefined;
// if (typeof window !== "undefined") {
//   isSupported().then((yes) => { if (yes) analytics = getAnalytics(app); });
// }