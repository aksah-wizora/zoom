import { useState, useEffect } from "react";
import uitoolkit from "@zoom/videosdk-ui-toolkit";
import "@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css";

import "./JoinMeeting.css";

function JoinMeeting() {
  let sessionContainer = null;
  const urlParams  = new URLSearchParams(window.location.search);

  const token      = urlParams.get("token");
  const sessionNam = urlParams.get("mid");
  const fname      = urlParams.get("user");

  // const sessionNam = urlParams.get("sessionName");
  const [zoomToken, setZoomToken]             = useState(token || null);
  const [sessionName, setSessionName]         = useState(sessionNam || "");
  const [sessionPasscode, setSessionPasscode] = useState("");
  const [firstName, setFirstName]             = useState(fname);
  const [lastName, setLastName]               = useState("");
  let [hostDiv, setHostDiv]                   = useState("");

  if(firstName == "Host"){
    setHostDiv = { position: 'absolute', width: '100%', height: '100%' }
  }

  useEffect(() => {
    if(zoomToken){
      startClass();
    }
  }, [zoomToken]);

  let session = null;
  const startClass = async() =>{
    const config = {
      videoSDKJWT: zoomToken,
      sessionName: sessionName,
      userName: `${firstName} ${lastName}`,
      sessionPasscode: sessionPasscode,
      features: ["chat","video"], // Only allow screen sharing (host's shared screen)
      // options: {
      //   init: {
      //     // layout: "SHARE_ONLY", // Ensures only shared screen is shown
      //   },
      //   video: {
      //     disableVideo: true, // Disable participant video
      //     hideSelfView: true, // Hide self-view
      //   },
      //   audio: {
      //     disableAudio: true, // Disable participant audio
      //   },
      //   users: {
      //     hideUserList: true, // Completely hide the participant list
      //   },
      //   chat: {
      //     disableChat: true, // Disable chat feature
      //   },
      //   share: {
      //     disableScreenShare: true, // Prevent participants from sharing their own screen
      //   },
      //   toolbar: {
      //     hideToolbar: true, // Hide the Zoom toolbar
      //   },
      // },

      options: {
        init: {
          // layout: "GALLERY_VIEW", // Set appropriate layout if needed
        },
        video: {
          disableVideo: true, // Disable participant's own video
          hideSelfView: true, // Hide self-view (important)
        },
        audio: {
          disableAudio: true, // Mute participant's audio
        },
        users: {
          hideUserList: true, // Hide the participant list
        },
        chat: {
          disableChat: true, // Disable chat feature
        },
        share: {
          disableScreenShare: true, // Prevent participants from sharing their own screen
        }
      },


      virtualBackground: {
        allowVirtualBackground: true,
        allowVirtualBackgroundUpload: true,
        virtualBackgrounds: [
          "https://images.unsplash.com/photo-1715490187538-30a365fa05bd?q=80&w=1945&auto=format&fit=crop",
        ],
      },
    };
    sessionContainer = document.getElementById("sessionContainer");
    document.getElementById("join-flow").style.display = "none";
    session = await joinSession(config);

    // setTimeout(() => {
    //   if(sessionContainer.requestFullscreen){
    //     sessionContainer.requestFullscreen(); // Standard Fullscreen
    //   }
    //   else if(sessionContainer.mozRequestFullScreen){
    //     sessionContainer.mozRequestFullScreen(); // Firefox
    //   }
    //   else if(sessionContainer.webkitRequestFullscreen){
    //     sessionContainer.webkitRequestFullscreen(); // Chrome, Safari, Opera
    //   }
    //   else if(sessionContainer.msRequestFullscreen) {
    //     sessionContainer.msRequestFullscreen(); // Internet Explorer
    //   }
    // }, 2000);
  
    // Hide all UI elements except shared screen using JavaScript & CSS
    // setTimeout(() => {
    //   const shadowHosts = document.querySelectorAll(".zm-videokit");
    //     shadowHosts.forEach(host => {
    //       if (host.shadowRoot) {
    //         const selfView = host.shadowRoot.querySelector(".self-view");
    //         if (selfView) selfView.style.display = "none";
    //       }
    //     });

    //   document.querySelectorAll(".zm-video-container, .zm-participants, .zm-toolbar, .zm-controls, .zm-gallery-view, .zm-header, .zm-self-view").forEach(el => {
    //     el.style.display = "none !important"; // Hide all UI elements
    //   });
  
    //   // Ensure only the shared screen remains visible
    //   const sharedScreen = document.querySelector(".zm-share-view");
    //   if(sharedScreen){
    //     sharedScreen.style.width    = "100vw";
    //     sharedScreen.style.height   = "100vh";
    //     sharedScreen.style.position = "absolute";
    //     sharedScreen.style.top      = "0";
    //     sharedScreen.style.left     = "0";
    //   }
    // }, 3000);

    // setTimeout(async() => {
    //   console.log("firstnma");

    //   const users = await uitoolkit.getAllUsers();
    //   console.log("All users:", users);

    //   document.querySelectorAll(".zm-video-tile").forEach((tile) => {
    //     console.log(tile);
    //     const userName2 = tile.querySelector(".zm-video-tile__name")?.innerText;
        
    //     console.log("Username ",userName2);
    //     console.log("first name  ",firstName);

    //     if (userName2 !== firstName) {  // Replace with actual host name
    //       tile.style.display = "none";  // Hide all non-host video tiles
    //     }
    //   });
  
    //   // Hide additional UI elements to clean up the view
    //   document.querySelectorAll(".zm-participants, .zm-toolbar, .zm-controls, .zm-gallery-view, .zm-header").forEach(el => {
    //     el.style.display = "none"; 
    //   });
    // }, 1000);
  // };

  setTimeout(() => {
    handleHostVideo();
  }, 5000);
  };

  const handleHostVideo = () => {
    if(!session){
      console.warn("Session is not initialized");
      return;
    }
  
    const users = session.getAllUsers();
    console.log("All users:", users);
  
    // Find the host user
    const hostUser = users.find((user) => user.isHost);
    if(!hostUser){
      console.warn("Host not found!");
      return;
    }
  
    console.log("Host detected:", hostUser);
  
    // Hide all non-host users
    users.forEach((user) => {
      if (user.userId !== hostUser.userId) {
        session.muteVideo(user.userId); // Hide non-host video
      }
    });
    // Pin host video (Zoom Video SDK does not have pinning like Web SDK)
  };


  const joinSession = (config) => {
    if(sessionContainer){
      if(firstName == "Host"){
        config.features.push("audio");
        config.features.push("share");
        config.features.push("video");
      }
      uitoolkit.joinSession(sessionContainer, config);
      uitoolkit.onSessionClosed(sessionClosed);
    }
  };

  const sessionClosed = () => {
    if(sessionContainer){
      uitoolkit.closeSession(sessionContainer);
      document.getElementById("join-flow").style.display = "block";
    }
  };

    return(
      <div className="App">
        <main>
          <div id="join-flow">
            {/* <h1>Zoom Video SDK Sample React</h1>
            <p>User interface offered by the Video SDK UI Toolkit</p>
            <button onClick={startClass}>Join Session</button> */}
          </div>
          <div id="sessionContainer" style={hostDiv}></div>
        </main>
      </div>
    );
  
}

export default JoinMeeting;
