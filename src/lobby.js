import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue, child, get } from "firebase/database";
import { route, setCookie, getCookie } from "../dist/script/module-helper";

const firebaseConfig = {
    apiKey: "AIzaSyChopx9y6BEpX8DAgdazkspY0UQIpgt25U",
    authDomain: "project-tutorial-81e1e.firebaseapp.com",
    databaseURL: "https://project-tutorial-81e1e-default-rtdb.firebaseio.com",
    projectId: "project-tutorial-81e1e",
    storageBucket: "project-tutorial-81e1e.appspot.com",
    messagingSenderId: "365854307866",
    appId: "1:365854307866:web:7b697e47640e1b83e883a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

const CreateRoomBtn = document.getElementById("create-room-btn");
CreateRoomBtn.addEventListener("click", (e) => {

    var userID;
    console.log("Get cookies", getCookie("userID"))
    if(getCookie("userID") != ""){
        userID = getCookie("userID");
    }
    else{
        userID = crypto.randomUUID();
        setCookie("userID", userID, 7);
    }

    const callID = crypto.randomUUID();
    set(ref(database, 'calls/' + callID), {
        createdBy: userID
    })
    .then(() =>{
        route("room", `room=${callID}`);
    });
});