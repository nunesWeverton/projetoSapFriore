/*import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
*/

const firebaseConfig = {
 
    apiKey: "AIzaSyB6boGZ2If59Hf26nkP_avdoL719q8hfMc",
   
    authDomain: "teste-ax-sap.firebaseapp.com",
   
    databaseURL: "https://teste-ax-sap-default-rtdb.firebaseio.com",
   
    projectId: "teste-ax-sap",
   
    storageBucket: "teste-ax-sap.appspot.com",
   
    messagingSenderId: "948945281434",
   
    appId: "1:948945281434:web:276a62fd256fcdf2679a23",
   
    measurementId: "G-PLGST4XQ2F"
   
  };

/*var firebaseConfig = {
    apiKey: "AIzaSyB6boGZ2If59Hf26nkP_avdoL719q8hfMc",
    authDomain: "teste-ax-sap.firebaseapp.com",
    projectId: "teste-ax-sap",
    storageBucket: "teste-ax-sap.appspot.com",
    messagingSenderId: "948945281434",
    appId: "1:948945281434:web:276a62fd256fcdf2679a23",
    measurementId: "G-PLGST4XQ2F"
};
*/

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // Use a aplicação existente
}

// export default firebase;

