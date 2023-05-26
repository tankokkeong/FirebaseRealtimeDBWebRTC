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
const webcamVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo');

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
        //User joins room
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
}
else{
  route("index");
}

// 1. Setup media sources

webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
  webcamButton.disabled = true;

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  var updates = {};
  //User joins room
  updates[`calls/${callID}/${userID}`] = {joinedAt: getFormattedTime()};
  update(ref(database), updates);

  //If disconnected
  onDisconnect(ref(database, `calls/${callID}/${userID}`)).remove();

  // Listen for remote answer
  onValue(ref(database, `calls/${callID}/`), (snapshot) => {

    console.log("Snap", snapshot)
    if(snapshot.size > 1){
      snapshot.forEach((childSnap) => {
          if(childSnap.key != userID){
            // Get candidates for caller, save to db
            pc.onicecandidate = (event) => {
              const result = event.candidate.toJSON();
              
              event.candidate && set(ref(database, `calls/${callID}/${userID}/${childSnap.key}/offerCandidates/${crypto.randomUUID()}`), {
                candidate: result.candidate, 
                sdpMid: result.sdpMid, 
                sdpMLineIndex: result.sdpMLineIndex, 
                usernameFragment: result.usernameFragment
              });
              // console.log("candidate for caller", result.candidate)
            };
          }
      });
    }
    

  });

  console.log("PC", pc);
};





// // 2. Create an offer
// callButton.onclick = async () => {
//   // Reference Firestore collections for signaling
//   const callID = crypto.randomUUID()

//   callInput.value = callID;

  

//   hangupButton.disabled = false;
// };

// // 3. Answer the call with the unique ID
// answerButton.onclick = async () => {
//   const callId = callInput.value;

//   pc.onicecandidate = (event) => {
//     const result = event.candidate.toJSON();
//     event.candidate && set(ref(database, `calls/${callId}/answerCandidates/${crypto.randomUUID()}`), {
//       candidate: result.candidate, 
//       sdpMid: result.sdpMid, 
//       sdpMLineIndex: result.sdpMLineIndex, 
//       usernameFragment: result.usernameFragment
//     });
//   };

//   var callData;

//   await get(child(ref(database), `calls/${callId}`)).then((snapshot) => {
//     if (snapshot.exists()) {
//       callData = snapshot.val();
//       console.log("Call Data2: ", callData);
//     } else {
//       console.log("No data available");
//     }
//   }).catch((error) => {
//     console.error(error);
//   });
  

//   const offerDescription = callData.offer;
//   await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

//   const answerDescription = await pc.createAnswer();
//   await pc.setLocalDescription(answerDescription);

//   const answer = {
//     type: answerDescription.type,
//     sdp: answerDescription.sdp,
//   };

//   var updates = {};
//   updates[`calls/${callId}/answer`] = answer;
//   update(ref(database), updates);

//   onValue(ref(database,`calls/${callId}/offerCandidates`), (snapshot) => {
//     snapshot.forEach((change) => {
//       console.log("Change type from offer candidates:", change.val());
//       let data = change.val();
//       pc.addIceCandidate(new RTCIceCandidate(data));
//     });
//   });
// };

function getUrlParams(paramName){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  return urlParams.get(paramName);
}