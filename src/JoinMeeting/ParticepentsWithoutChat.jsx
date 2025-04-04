import React, { useEffect, useRef, useState } from "react";
import ZoomVideo, { VideoQuality } from "@zoom/videosdk";
import "./particepents.css";

const sdkKey = "Z5HhC6a1KJoAwqMWZhdmQNIekfqKINEx9Rpg";
const sdkSecret = "vM1x3v4xCZfO8x8G8WxT4GW0qeIDF1a9Rwup";

const Particepents = () => {
  const [client, setClient] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [participants, setParticipants] = useState([]);

  const videoContainerRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const sessionName = urlParams.get("mid") || "Default Session";
  const fname      = urlParams.get("user");

  useEffect(() => {
    const initializeZoom = async () => {
      try {
        const zoomClient = ZoomVideo.createClient();
        await zoomClient.init("en-US", "Global", { patchJsMedia: true });

        setClient(zoomClient);
        console.log("Zoom SDK Initialized");
      } catch (error) {
        console.error("Error initializing Zoom SDK:", error);
      }
    };

    initializeZoom();

    return () => {
      if (client) {
        client.leave();
      }
    };
  }, []);

  const startCall = async () => {
    console.log("start call student");
    if (!client) return;

    try {
      console.log("Joining session...");
      await client.join(sessionName, token, fname);

      const stream = client.getMediaStream();
      await stream.startAudio();
      await stream.startVideo();

      setMediaStream(stream);
      setIsJoined(true);

      // Automatically mute participants
      const currentUser = client.getCurrentUserInfo();
      if (!currentUser.isHost) {
        await stream.stopAudio(); // Automatically mute participants
        await stream.stopVideo(); // Prevent participant from starting video
        console.log("Participant audio and video have been disabled.");
      }

      // Event listeners for video and audio changes
      client.on("peer-video-state-change", renderVideo);
      client.on("peer-audio-state-change", handleAudioChange);
      client.on("user-added", updateParticipants);
      client.on("user-removed", updateParticipants);

      // Update participants list
      updateParticipants();

      // Attach only the host's video if available
      const participantsList = client.getAllUser();
      const host = participantsList.find(user => user.isHost);
      if (host && host.bVideoOn) {
        console.log("Host is detected and has video on. Attaching host video...");
        const hostVideo = await stream.attachVideo(host.userId, VideoQuality.Video_360P);
        if (hostVideo) {
          videoContainerRef.current.appendChild(hostVideo);
        } else {
          console.error("Failed to attach host video immediately.");
        }
      }

    } catch (error) {
      console.error("Error joining Zoom session:", error);
    }
  };

  const updateParticipants = () => {
    if (!client) return;
    const allUsers = client.getAllUser();
    console.log('Updated Participants:', allUsers);  // Log the updated participants to check if the host is included
    setParticipants(allUsers);
  };

  const handleAudioChange = (event) => {
    console.log("Audio state changed:", event);
  };

  const renderVideo = async (event) => {
    console.log('event', event);
    if (!mediaStream || !videoContainerRef.current) return;

    console.log('Video state change event:', event);  // Log event details for debugging

    // Handle when video is stopped (detaching video)
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      console.log('Detaching video for user:', event.userId);  // Debug log

      if (element) {
        if (Array.isArray(element)) {
          element.forEach((el) => el.remove());
        } else {
          element.remove();
        }
      }
    }

    // Handle when video is started (attaching video)
    else if (event.action === "Start") {
      console.log('Attaching video for user:', event.userId);  // Debug log

      // Attach video for the host only
      const currentUser = client.getCurrentUserInfo();
      if (event.userId === currentUser.userId && currentUser.isHost) {
        const hostVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
        if (hostVideo) {
          videoContainerRef.current.appendChild(hostVideo);
        } else {
          console.error("Failed to attach host video on state change.");
        }
      }
    }
  };

  const leaveCall = async () => {
    if (!client || !mediaStream) return;

    client.getAllUser().forEach(async (user) => {
      const element = await mediaStream.detachVideo(user.userId);
      Array.isArray(element) ? element.forEach((el) => el.remove()) : element.remove();
    });

    client.off("peer-video-state-change", renderVideo);
    client.off("peer-audio-state-change", handleAudioChange);
    client.off("user-added", updateParticipants);
    client.off("user-removed", updateParticipants);

    await client.leave();

    setIsJoined(false);
    setIsSharing(false);
    setParticipants([]);
  };

//   const toggleScreenShare = async () => {
//     if (!mediaStream) return;

//     try {
//       if (isSharing) {
//         await mediaStream.stopShareScreen();
//       } else {
//         await mediaStream.startShareScreen();
//       }
//       setIsSharing(!isSharing);
//     } catch (error) {
//       console.error("Error toggling screen share:", error);
//     }
//   };

  console.log('participants', participants);

  return (
    <div>
      <div ref={videoContainerRef} className="video-player-container"></div>

      {!isJoined ? (
        <button onClick={startCall}>Join</button>
      ) : (
        <>
          <button onClick={leaveCall}>Leave</button>
          {/* <button onClick={toggleScreenShare}>{isSharing ? "Stop Sharing" : "Share Screen"}</button> */}

          {/* Participants List */}
          {/* <h3>Participants</h3>
          <ul>
            {participants.map((user) => (
              <li key={user.userId}>{user.displayName}</li>
            ))}
          </ul> */}
        </>
      )}
    </div>
  );
};

export default Particepents;
