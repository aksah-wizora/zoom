import React, { useEffect, useRef, useState } from "react";
import ZoomVideo, { VideoQuality } from "@zoom/videosdk";
import "./particepents.css";

const sdkKey = "Z5HhC6a1KJoAwqMWZhdmQNIekfqKINEx9Rpg";
const sdkSecret = "vM1x3v4xCZfO8x8G8WxT4GW0qeIDF1a9Rwup";

const Particepents = () => {
  const [client, setClient] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatClient, setChatClient] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const videoContainerRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const sessionName = urlParams.get("mid") || "Default Session";
  const fname      = urlParams.get("user");

  useEffect(() => {
    const initializeZoom = async () => {
      try{
        const zoomClient = ZoomVideo.createClient();
        await zoomClient.init("en-US", "Global", { patchJsMedia: true });

        setClient(zoomClient);
        console.log("Zoom SDK Initialized");
      }
      catch (error) {
        console.error("Error initializing Zoom SDK:", error);
      }
    };

    initializeZoom();

    return () => {
      if(client){
        client.leave();
      }
    };
  }, []);

  const startCall = async () => {
    if (!client) return;
  
    try{
      await client.join(sessionName, token, fname);
  
      const stream = client.getMediaStream();
      await stream.startAudio();
      await stream.startVideo();
  
      setMediaStream(stream);
      setIsJoined(true);
      const chat = client.getChatClient();
      setChatClient(chat);

      client.on("chat-on-message", (payload) => {
        console.log(`Message: ${payload.message}, from ${payload.sender.name} to ${payload.receiver.name}`);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { message: payload.message, sender: payload.sender.name },
        ]);
      });

      // Event listeners for video and audio changes
      client.on("peer-video-state-change", renderVideo);
      client.on("peer-audio-state-change", handleAudioChange);
      client.on("user-added", updateParticipants);
      client.on("user-removed", updateParticipants);
  
      // Update participants list
      updateParticipants();
  
      // Attach host video if video is on
      const participantsList = client.getAllUser();
      const host = participantsList.find(user => user.isHost);

      if(host && host.bVideoOn){
        console.log("Host is detected and has video on. Attaching host video...");
        const hostVideo = await stream.attachVideo(host.userId, VideoQuality.Video_360P);
        
        if(hostVideo){
          videoContainerRef.current.appendChild(hostVideo);
        }
        else{
          console.error("Failed to attach host video immediately.");
        }
      }
    }
    catch(error){
      console.error("Error joining Zoom session:", error);
    }
  };
  
  useEffect(() => {
    if (chatClient) {
      const fetchChatHistory = async () => {
        try {
          const history = await chatClient.getHistory();
          setChatHistory(history);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      };
      fetchChatHistory();
    }
  }, [chatClient]);
  
  const sendMessage = async () => {
    if (message.trim() === "" || !chatClient) return;

    try{
      // Send message to all participants
      await chatClient.sendToAll(message);
      setMessage(""); // Clear message input after sending
    }
    catch(error){
      console.error("Error sending chat message:", error);
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
    if (!mediaStream || !videoContainerRef.current) return;
  
    console.log('Video state change event:', event);  // Log event details for debugging
  
    // Handle when video is stopped (detaching video)
    if(event.action === "Stop"){
      const element = await mediaStream.detachVideo(event.userId);
      console.log('Detaching video for user:', event.userId);  // Debug log
  
      if(element){
        if(Array.isArray(element)){
          element.forEach((el) => el.remove());
        }
        else{
          element.remove();
        }
      }
    }
  
    // Handle when video is started (attaching video)
    else if (event.action === "Start"){
      console.log('Attaching video for user:', event.userId);  // Debug log
  
      // Attach video for the user whose state changed
      const userVideo = await mediaStream.attachVideo(event.userId, VideoQuality.Video_360P);
      if(userVideo){
        videoContainerRef.current.appendChild(userVideo);
      }
  
      // If the host's video state changed to "Start", ensure it's attached
      const currentUser = client.getCurrentUserInfo();
      if(event.userId === currentUser.userId && currentUser.isHost && event.action === "Start"){
        console.log('Host video state change - Attaching host video');
        const hostVideo = await mediaStream.attachVideo(currentUser.userId, VideoQuality.Video_360P);
        if(hostVideo){
          videoContainerRef.current.appendChild(hostVideo);
        }
        else{
          console.error("Failed to attach host video on state change.");
        }
      }
    }
  };
  
  
  //   const hostVideo = await stream.attachVideo(currentUser.userId);


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
    setIsMuted(false);
    setParticipants([]);

    // change meeting status in db
    // fetch(`http://localhost:8000/api/v1/zoom/end-meeting/${sessionName}`)
    //   .then((resp)=>{
    //     return resp.json();
    //   })
    //   .then((respp)=>{
    //     console.log(respp.status);
    //   });

  };

  const toggleVideo = async () => {
    if (!mediaStream) return;

    if (mediaStream.isCapturingVideo()) {
      await mediaStream.stopVideo();
      renderVideo({ action: "Stop", userId: client.getCurrentUserInfo().userId });
    } else {
      await mediaStream.startVideo();
      renderVideo({ action: "Start", userId: client.getCurrentUserInfo().userId });
    }
  };

  const toggleAudio = async () => {
    if (!mediaStream) return;

    if(isMuted){
      await mediaStream.startAudio();
    }
    else{
      await mediaStream.stopAudio();
    }

    setIsMuted(!isMuted);
  };

  const toggleScreenShare = async () => {
    if (!mediaStream) return;

    try{
      if(isSharing) {
        await mediaStream.stopShareScreen();
      }
      else{
        await mediaStream.startShareScreen();
      }
      setIsSharing(!isSharing);
    }
    catch(error){
      console.error("Error toggling screen share:", error);
    }
  };

  return (
    <div>
      <div ref={videoContainerRef} className="video-player-container"></div>

      {!isJoined ? (
        <button onClick={startCall}>Join</button>
      ) : (
        <>
          <button onClick={leaveCall}>Leave</button>
          <button onClick={toggleVideo}>Toggle Video</button>
          <button onClick={toggleAudio}>{isMuted ? "Unmute" : "Mute"}</button>
          <button onClick={toggleScreenShare}>{isSharing ? "Stop Sharing" : "Share Screen"}</button>

          {/* Participants List */}
          <h3>Participants</h3>
          <ul>
            {participants.map((user) => (
              <li key={user.userId}>{user.displayName}</li>
            ))}
          </ul>
          <div className="chat-container">
            <div className="chat-box">
              {chatHistory.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.sender}:</strong> {msg.message}
                </div>
              ))}
            </div>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Particepents;
