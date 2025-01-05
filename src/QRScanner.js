import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const Camera = () => {
  const [hasPermission, setHasPermission] = useState(true); // Handle camera permissions
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element
  const [zoomLevel, setZoomLevel] = useState(1); // Track zoom level
  const [focusMode, setFocusMode] = useState('continuous'); // Track focus mode
  const [qrCodeData, setQrCodeData] = useState(null); // Store decoded QR code data

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        // Define constraints for the camera
        const constraints = {
          video: {
            advanced: [
              { focusMode: 'continuous' }, // Enable continuous autofocus
              { zoom: true }, // Enable zoom capability
            ],
            width: { ideal: 1920 }, // Request Full HD width
            height: { ideal: 1080 }, // Request Full HD height
          },
        };

        console.log('Requesting camera with Full HD resolution, autofocus, and zoom...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('Camera stream obtained:', stream);

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
      }
    };

    startCamera();

    // Cleanup the video stream when the component is unmounted
    return () => {
      if (stream) {
        console.log('Cleaning up camera stream...');
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop()); // Stop all video tracks
      }
    };
  }, [zoomLevel]); // Restart camera when zoom level changes

  useEffect(() => {
    const scanQRCode = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const renderFrame = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Draw the current video frame onto the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get the image data from the canvas
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Use jsQR to scan for QR codes
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code) {
              console.log('QR Code detected:', code.data);
              setQrCodeData(code.data); // Update the QR code data state
            }
          }

          // Continue scanning
          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      }
    };

    scanQRCode();
  }, []); // Run QR code scanning when the component mounts

  const handleManualFocus = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      const capabilities = track.getCapabilities();

      if (capabilities.focusDistance) {
        console.log('Manual focus supported. Setting focus distance to mid-range...');
        await track.applyConstraints({
          advanced: [{ focusMode: 'manual', focusDistance: capabilities.focusDistance.min + (capabilities.focusDistance.max - capabilities.focusDistance.min) / 2 }],
        });
        setFocusMode('manual');
        console.log('Manual focus applied.');
      } else {
        console.log('Manual focus not supported on this device.');
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
        console.log(`Zoom ${zoomIn ? 'increased' : 'decreased'} to level:`, newZoom);
      } else {
        console.log('Zoom is not supported on this device.');
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
        style={{
          border: '1px solid black',
          objectFit: 'cover', // Optimize video rendering
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          display: 'none', // Hide the canvas since it's for processing only
        }}
      />
      <div style={{ marginTop: '10px' }}>
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
