import { useEffect, useState } from "react";
import uitoolkit  from "@zoom/videosdk-ui-toolkit";

const JoinMeeting = ({  }) => {
    const [session, setSession] = useState(null);

    const urlParams  = new URLSearchParams(window.location.search);

    const token      = urlParams.get("token");
    const fname      = urlParams.get("user");
    const sessionNam = urlParams.get("mid");
    
    let sessionContainer = null;

    //   const [sessionContainer, setSessionContainer] = useState(null);
    const [zoomToken, setZoomToken]             = useState(token || null);
    const [sessionName, setSessionName]         = useState(sessionNam || "");
    const [sessionPasscode, setSessionPasscode] = useState("");

    const firstName = fname;

    const hstyle = firstName == "Host" 
        ? { position: 'absolute', width: '100%', height: '100%' }
        : {  };

    const lastName = "";
    // const isHost = stateUser?.userData?.isHost; // Check if user is the host
    const [isHost, setIsHost] = useState(fname == "Host" ? true : false); // Check if user is the host
    useEffect(() => {
        // setSessionContainer(document.getElementById("sessionContainer"));
    }, []);

    useEffect(() => {
        if (zoomToken) {
            startClass();
        }
    }, [zoomToken]);

    const startClass = async () => {
        sessionContainer = document.getElementById("sessionContainer");
        if(!sessionContainer){
            console.error("Session container not found!");
            return;
        }

        const config = {
            videoSDKJWT: zoomToken,
            sessionName: sessionName,
            userName: `${firstName} ${lastName}`,
            sessionPasscode: sessionPasscode,
            features: ["share", "audio", "video"],
            options:{
                video:{
                    disableVideo: false, // Allow video
                },
                audio:{
                    disableAudio: false, // Allow audio
                },
            },
        };

        try{
            console.log("Attempting to join session...");
            // const newSession = await uitoolkit.joinSession(sessionContainer, config);
            console.log("here");
            const newSession = uitoolkit.joinSession(sessionContainer, config);
        
            if(!newSession){
                throw new Error("Session initialization returned null");
            }
            setSession(newSession);

            // Check if the current user is the host
            const user = newSession.getMySelf();
            setIsHost(user?.isHost || false);

            // Wait for session to load
            setTimeout(() => {
                updateView(newSession);
            }, 3000);
        
        }
        catch(error){
            console.error("Failed to initialize session here:", error);
        }
    };

    const updateView = (session) => {
        if (!session) return;

        if(isHost){
            console.log("User is host: Showing all participants.");
        }
        else{
            console.log("User is NOT host: Showing only the host.");
            const users = session.getAllUsers();
            const hostUser = users.find((user) => user.isHost);
        
            if(hostUser){
                session.setFeaturedUser(hostUser.userId);
            }
            else{
                console.error("No host found in the session.");
            }
        }
    };

    return (
        <div className="App">
            <main>
                <div id="sessionContainer" style={{paddingBottom: '35px'}}></div>
            </main>
        </div>
    );
};

// export default JoinMeeting;