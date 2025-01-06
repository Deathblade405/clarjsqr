import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const Camera = () => {
  const [hasPermission, setHasPermission] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusMode, setFocusMode] = useState("continuous");
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevice = devices.find(
          (device) => device.kind === "videoinput" && device.label.includes("2,0")
        );

        const constraints = {
          video: {
            deviceId: videoDevice ? { exact: videoDevice.deviceId } : undefined,
            advanced: [{ focusMode: "continuous" }, { zoom: true }],
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        console.log("Requesting back camera (2,0)...");
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [zoomLevel]);

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

  return (
    <div>
      <h1>Camera</h1>
      {!hasPermission && <p>Permission to access the camera is denied!</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="100%"
        height="auto"
        style={{ border: "1px solid black", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => handleZoom(true)}>Zoom In</button>
        <button onClick={() => handleZoom(false)}>Zoom Out</button>
        <button onClick={handleManualFocus}>Manual Focus</button>
        <p>Current Focus Mode: {focusMode}</p>
        <p>Current Zoom Level: {zoomLevel.toFixed(1)}</p>
        {qrCodeData && <p>QR Code Data: {qrCodeData}</p>}
      </div>
    </div>
  );
};

export default Camera;
