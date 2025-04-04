import { useState, useEffect } from "react";
import uitoolkit from "@zoom/videosdk-ui-toolkit";
import "@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css";

import "./JoinMeeting.css";

function JoinMeetingHost() {
  let sessionContainerHost = null;
  const urlParams = new URLSearchParams(window.location.search);

  const token      = urlParams.get("token");
  const sessionNam = urlParams.get("mid");
  const fname      = urlParams.get("user");
  console.log("name ",fname);

  // const sessionNam = urlParams.get("sessionName");
  const [zoomToken, setZoomToken] = useState(token || null);
  const [sessionName, setSessionName] = useState(sessionNam || "");
  const [sessionPasscode, setSessionPasscode] = useState("");
  const [firstName, setFirstName] = useState(fname);
  const [lastName, setLastName] = useState("singh");

  useEffect(() => {
    if (zoomToken) {
      startClass();
    }
  }, [zoomToken]);
  const startClass = () => {

    const config = {
      videoSDKJWT: zoomToken,
      sessionName: sessionName,
      userName: `${firstName} ${lastName}`,
      sessionPasscode: sessionPasscode,
      features: ["share","audio","video"], // Only allow screen sharing (host's shared screen)
      options: {
        init: {
         // layout: "SHARE_ONLY", // Ensures only shared screen is shown
        },
        video: {
          disableVideo: false, // Disable participant video
          hideSelfView: true, // Hide self-view
        },
        audio: {
          disableAudio: false, // Disable participant audio
        },
        users: {
          hideUserList: false, // Completely hide the participant list
        },
        chat: {
          disableChat: false, // Disable chat feature
        },
        share: {
          disableScreenShare: false, // Prevent participants from sharing their own screen
        },
        toolbar: {
          hideToolbar: true, // Hide the Zoom toolbar
        },
      },
      virtualBackground: {
        allowVirtualBackground: true,
        allowVirtualBackgroundUpload: true,
        virtualBackgrounds: [
          "https://images.unsplash.com/photo-1715490187538-30a365fa05bd?q=80&w=1945&auto=format&fit=crop",
        ],
      },
    };
    sessionContainerHost = document.getElementById("sessionContainerHost");
    document.getElementById("join-flow-host").style.display = "none";
    joinSession(config);
    setTimeout(() => {
      if (sessionContainerHost.requestFullscreen) {
        sessionContainerHost.requestFullscreen(); // Standard Fullscreen
      } else if (sessionContainerHost.mozRequestFullScreen) {
        sessionContainerHost.mozRequestFullScreen(); // Firefox
      } else if (sessionContainerHost.webkitRequestFullscreen) {
        sessionContainerHost.webkitRequestFullscreen(); // Chrome, Safari, Opera
      } else if (sessionContainerHost.msRequestFullscreen) {
        sessionContainerHost.msRequestFullscreen(); // Internet Explorer
      }
    }, 2000);
  
    // Hide all UI elements except shared screen using JavaScript & CSS
    setTimeout(() => {
      document.querySelectorAll(".zm-video-container, .zm-participants, .zm-toolbar, .zm-controls, .zm-gallery-view, .zm-header").forEach(el => {
        el.style.display = "none"; // Hide all UI elements
      });
  
      // Ensure only the shared screen remains visible
      const sharedScreen = document.querySelector(".zm-share-view");
      if (sharedScreen) {
        sharedScreen.style.width = "100vw";
        sharedScreen.style.height = "100vh";
        sharedScreen.style.position = "absolute";
        sharedScreen.style.top = "0";
        sharedScreen.style.left = "0";
      }
    }, 3000);
  };

  const joinSession = (config) => {
    if (sessionContainerHost) {
      uitoolkit.joinSession(sessionContainerHost, config);
      uitoolkit.onSessionClosed(sessionClosed);
    }
  };

  const sessionClosed = () => {
    if (sessionContainerHost) {
      uitoolkit.closeSession(sessionContainerHost);
      document.getElementById("join-flow-host").style.display = "block";
    }
  };

  return (
    <div className="App">
      <main>
        <div id="join-flow-host">
          <h1>Zoom Video SDK Sample React</h1>
          <p>User interface offered by the Video SDK UI Toolkit</p>
          <button onClick={startClass}>Join Session Host</button>
        </div>
        <div id="sessionContainerHost"></div>
      </main>
    </div>
  );
}

export default JoinMeetingHost;
