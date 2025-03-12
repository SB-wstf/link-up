import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const backendUrl = process.env.REACT_APP_BACKEND_URL;
console.log("backendUrl", backendUrl);

var socket;

function LinkedInAutomation() {
  const [status, setStatus] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState("");

  // useEffect(() => {
  //   socket = io(backendUrl);
  //   socket.emit("setup", 1234);
  //   socket.on("connection", () => {
  //     console.log("socket connected");
  //   });
  // }, []);

  // Function to send the keyToken to the server
  function sendKeyToken(keyToken) {
    console.log("emitting keyToken", keyToken);
    socket.emit("token", keyToken);
    // try {
    //   await fetch(`${backendUrl}/token`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ keyToken }),
    //   });
    // } catch (error) {
    //   console.error("Error starting automation:", error);
    // }
  }

  useEffect(() => {
    socket = io(backendUrl);
    socket.emit("setup", 1234);
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    // socket.emit("token", 123456789);
    socket.on("status", (newStatus) => {
      setStatus((ps)=>[newStatus, ...ps]);
    });

    socket.on("screenshot", (newScreenshot) => {
      setScreenshots((prevScreenshots) => [newScreenshot, ...prevScreenshots]);
    });

    socket.on("showTokenInput", (value) => {
      setShowTokenInput(value);
    });

    return () => {
      socket.off("status");
      socket.off("screenshot");
      socket.off("connect");
      socket.off("showTokenInput");
    };
  }, []);

  const startAutomation = async () => {
    try {
      await fetch(`${backendUrl}/start-linkedin-update`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error starting automation:", error);
    }
  };

  // console.log("screenshots", screenshots);

  return (
    <div>
      <h1>LinkedIn Profile Automation</h1>
      <button onClick={startAutomation}>Start LinkedIn Automation</button>
      <p>Status: {status}</p>
      {showTokenInput && (
        <>
          <input
            type="text"
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter keyToken"
          />
          <button onClick={() => sendKeyToken(token)}>
            Click to emit Token
          </button>
        </>
      )}
      <button onClick={() => sendKeyToken("subha Biswal")}>Click to emit fixed Token</button>
      <div>
        <h2>Screenshots</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "10px",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {screenshots.map((screenshot, index) => (
            <img
              key={index}
              src={screenshot}
              alt={`Screenshot ${index + 1}`}
              style={{
                width: "300px",
                border: "1px solid #ccc",
                display: "inline-block",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LinkedInAutomation;
