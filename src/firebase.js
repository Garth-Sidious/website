import { initializeApp } from 'firebase/app'
import { getFirestore, collection } from 'firebase/firestore'
// ... other firebase imports

const firebaseConfig = {
    apiKey: "AIzaSyCqBGYnSOEVELBFNpxa3w3LpnhUeXgHHik",
    authDomain: "garsidechess.firebaseapp.com",
    projectId: "garsidechess",
    storageBucket: "garsidechess.appspot.com",
    messagingSenderId: "280737592367",
    appId: "1:280737592367:web:7937c666db0d8e643602da",
    measurementId: "G-DP51GC6TZM"
};

export const firebaseApp = initializeApp(firebaseConfig)

// used for the firestore refs
export const db = getFirestore(firebaseApp)

// here we can export reusable database references
export const highscoresRef = collection(db, 'highscores')