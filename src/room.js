import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue, child, get, onDisconnect, remove } from "firebase/database";
import { getCookie, route, getFormattedTime } from "../dist/script/module-helper";

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

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ]
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const myVideo = document.getElementById('my-video');
const videoList = document.getElementById("video-list-display");

//IDs
const callID = getUrlParams("room");
const userID = getCookie("userID");

if(getUrlParams("room") != null){
  if(userID == ""){
    route("index");
  }

  if(callID.length != 36){
    route("index");
  }
  else{
    //Check call exists
    get(child(ref(database), `calls/${callID}`)).then((snapshot) => {
      if (!snapshot.exists()) {
        var updates = {};
        //create call if there is none
        updates[`calls/${callID}/`] = {
          createdAt: getFormattedTime(),
          offer: "",
          offerCandidates: "",
          answer: "",
          answerCandidates: ""
        };
        update(ref(database), updates);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  var updates = {};
  //User joins room
  updates[`rooms/${callID}/${userID}`] = {joinedAt: getFormattedTime()};
  update(ref(database), updates);

  //If disconnected
  onDisconnect(ref(database, `rooms/${callID}/${userID}`)).remove();

  //Generate webcam
  onValue(ref(database, `rooms/${callID}/`), (snapshot) => {
    snapshot.forEach((childSnap) => {
      if(childSnap.key != userID){
        videoList.innerHTML +=
        `<div class="video-container col" id="${childSnap.key}-video-container">
          <video autoplay playsinline id="${childSnap.key}-video"></video>
        </div>`;
      }
    });
  });
}
else{
  route("index");
}

function getUrlParams(paramName){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  return urlParams.get(paramName);
}