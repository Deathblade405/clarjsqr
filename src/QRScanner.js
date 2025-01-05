import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera } from 'react-camera-pro';

const CameraComponent = () => {
  const cameraRef = useRef(null); // React Camera Pro Ref
  const canvasRef = useRef(null); // Canvas Ref for QR Code processing
  const [zoomLevel, setZoomLevel] = useState(1); // Track zoom level
  const [focusMode, setFocusMode] = useState('continuous'); // Track focus mode
  const [qrCodeData, setQrCodeData] = useState(null); // Store decoded QR code data

  useEffect(() => {
    const scanQRCode = () => {
      const canvas = canvasRef.current;
      const videoElement = cameraRef.current?.video;

      if (canvas && videoElement) {
        const ctx = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const renderFrame = () => {
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            // Draw the current video frame onto the canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

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

  const handleManualFocus = () => {
    console.log('Manual focus is currently not supported by react-camera-pro.');
  };

  const handleZoom = (zoomIn) => {
    const currentCamera = cameraRef.current;
    if (currentCamera) {
      const newZoom = zoomIn
        ? Math.min(zoomLevel + 0.1, 3) // Assuming max zoom is 3x
        : Math.max(zoomLevel - 0.1, 1); // Assuming min zoom is 1x
      setZoomLevel(newZoom);
      console.log(`Zoom ${zoomIn ? 'increased' : 'decreased'} to level:`, newZoom);
    }
  };

  return (
    <div>
      <h1>Camera with QR Scanner</h1>
      <Camera
        ref={cameraRef}
        facingMode="environment" // Use the back camera
        numberOfCamerasCallback={(num) => console.log('Number of cameras detected:', num)}
        errorMessages={{
          noCameraAccessible: 'No camera accessible',
          permissionDenied: 'Permission denied',
          switchCamera: 'Cannot switch camera',
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

export default CameraComponent;
