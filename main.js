import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyChopx9y6BEpX8DAgdazkspY0UQIpgt25U",
  authDomain: "project-tutorial-81e1e.firebaseapp.com",
  databaseURL: "https://project-tutorial-81e1e-default-rtdb.firebaseio.com",
  projectId: "project-tutorial-81e1e",
  storageBucket: "project-tutorial-81e1e.appspot.com",
  messagingSenderId: "365854307866",
  appId: "1:365854307866:web:7b697e47640e1b83e883a3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();
const database = firebase.database();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');

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

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
};

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callID = crypto.randomUUID()

  callInput.value = callID;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    const result = event.candidate.toJSON();
    
    event.candidate && database.ref(`calls/${callID}/offerCandidates/${crypto.randomUUID()}`).set({
      candidate: result.candidate, 
      sdpMid: result.sdpMid, 
      sdpMLineIndex: result.sdpMLineIndex, 
      usernameFragment: result.usernameFragment
    });
    // console.log("candidate for caller", result.candidate)
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  var updates = {};
  updates[`calls/${callID}/offer`] = offer;
  database.ref().update(updates);

  // Listen for remote answer
  database.ref(`calls/${callID}`).on('value', (snapshot) => {
    const data = snapshot.val();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  database.ref(`calls/${callID}/answerCandidates`).on('value', (snapshot) => {
    snapshot.forEach((change) => {
      console.log("Change type from answer candidates:", change.val());
      const candidate = new RTCIceCandidate(change.val());
      pc.addIceCandidate(candidate);
      
    });
  });

  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;

  pc.onicecandidate = (event) => {
    const result = event.candidate.toJSON();
    event.candidate && database.ref(`calls/${callId}/answerCandidates/${crypto.randomUUID()}`).set({
      candidate: result.candidate, 
      sdpMid: result.sdpMid, 
      sdpMLineIndex: result.sdpMLineIndex, 
      usernameFragment: result.usernameFragment
    });
  };

  var callData;

  await database.ref().child("calls").child(callId).get().then((snapshot) => {
    if (snapshot.exists()) {
      callData = snapshot.val();
      console.log("Call Data2: ", callData);
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });
  

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  var updates = {};
  updates[`calls/${callId}/answer`] = answer;
  database.ref().update(updates);

  database.ref(`calls/${callId}/offerCandidates`).on('value', (snapshot) => {
    snapshot.forEach((change) => {
      console.log("Change type from offer candidates:", change.val());
      let data = change.val();
      pc.addIceCandidate(new RTCIceCandidate(data));
    });
  });
};
