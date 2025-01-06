import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const Camera = () => {
  const [hasPermission, setHasPermission] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusMode, setFocusMode] = useState("continuous");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [deviceId, setDeviceId] = useState(null); // Track selected deviceId for camera
  const [videoDevices, setVideoDevices] = useState([]); // Store available video devices
  const [stream, setStream] = useState(null); // Track the current video stream

  // Fetch available video devices
  useEffect(() => {
    const getDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(videoDevices);
      if (videoDevices.length > 0) {
        setDeviceId(videoDevices[0].deviceId); // Set the first device as the default
      }
    };
    getDevices();
  }, []);

  // Start the camera stream based on the selected deviceId
  useEffect(() => {
    const startCamera = async () => {
      if (!deviceId) return;

      try {
        // Stop any existing stream if it exists
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }

        const constraints = {
          video: {
            deviceId: { exact: deviceId }, // Use the selected camera's deviceId
            advanced: [{ focusMode: "continuous" }, { zoom: true }],
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        console.log("Requesting camera...");
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Set the new stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Set the stream state
        setStream(newStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup the video stream when component is unmounted or deviceId changes
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [deviceId, stream, zoomLevel]); // Run this effect when deviceId or stream changes

  // QR Code scanning logic
  useEffect(() => {
    const scanQRCode = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const ctx = canvas.getContext("2d");

        const renderFrame = () => {
          // Ensure video dimensions are available
          if (
            video.readyState === video.HAVE_ENOUGH_DATA &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the current video frame onto the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get the image data from the canvas
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Use jsQR to scan for QR codes
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code) {
              console.log("QR Code detected:", code.data);
              setQrCodeData(code.data);
            }
          }

          // Continue scanning
          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      }
    };

    // Add a 'loadedmetadata' listener to ensure the video stream is ready
    if (videoRef.current) {
      const video = videoRef.current;

      const handleLoadedMetadata = () => {
        scanQRCode();
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, []);

  // Manual focus control
  const handleManualFocus = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.focusDistance) {
        await track.applyConstraints({
          advanced: [
            {
              focusMode: "manual",
              focusDistance:
                capabilities.focusDistance.min +
                (capabilities.focusDistance.max - capabilities.focusDistance.min) / 2,
            },
          ],
        });
        setFocusMode("manual");
      }
    }
  };

  // Zoom control
  const handleZoom = async (zoomIn) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.zoom) {
        const newZoom = zoomIn
          ? Math.min(zoomLevel + 0.1, capabilities.zoom.max)
          : Math.max(zoomLevel - 0.1, capabilities.zoom.min);
        setZoomLevel(newZoom);

        await track.applyConstraints({
          advanced: [{ zoom: newZoom }],
        });
      }
    }
  };

  // Handle camera change based on selected deviceId
  const handleChangeCamera = (deviceId) => {
    setDeviceId(deviceId); // Update selected camera deviceId
  };

  return (
    <div>
      <h1>Camera Scanner</h1>
      {!hasPermission && <p>Permission to access the camera is denied!</p>}

      {/* Camera selection dropdown */}
      <div>
        <label>Select Camera:</label>
        <select onChange={(e) => handleChangeCamera(e.target.value)} value={deviceId}>
          {/* Populate the camera options dynamically */}
          {videoDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      {/* Camera video feed */}
      <div style={styles.cameraWrapper}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={styles.video}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Control buttons */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => handleZoom(true)} style={styles.button}>Zoom In</button>
        <button onClick={() => handleZoom(false)} style={styles.button}>Zoom Out</button>
        <button onClick={handleManualFocus} style={styles.button}>Manual Focus</button>
        <p>Current Focus Mode: {focusMode}</p>
        <p>Current Zoom Level: {zoomLevel.toFixed(1)}</p>
        {qrCodeData && <p>QR Code Data: {qrCodeData}</p>}
      </div>
    </div>
  );
};

const styles = {
  cameraWrapper: {
    position: "relative",
    width: "100%",
    height: "400px", // Make it square-like by controlling the height
    maxWidth: "600px",
    margin: "0 auto",
    overflow: "hidden",
    border: "5px solid #000", // Border to give it a scanner look
    backgroundColor: "#000", // Set background as black (scanner look)
    borderRadius: "10px", // Rounded corners for scanner look
  },
  video: {
    objectFit: "cover",
    width: "100%",
    height: "100%",
  },
  button: {
    padding: "8px 16px",
    margin: "5px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default Camera;
