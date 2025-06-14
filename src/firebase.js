import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqwQQAQBxwb3xtMUlGDaYVyNCTVuLxGkM",
  authDomain: "chatroom-79a82.firebaseapp.com",
  projectId: "chatroom-79a82",
  storageBucket: "chatroom-79a82.appspot.com",
  messagingSenderId: "1037945412565",
  appId: "1:1037945412565:web:01a645793cdfbc4a443b5c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};
