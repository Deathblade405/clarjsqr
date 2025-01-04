import React, { useEffect, useRef, useState } from 'react';

const Camera = () => {
  const [hasPermission, setHasPermission] = useState(true); // Handle camera permissions
  const videoRef = useRef(null); // Ref for the video element

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        // Define constraints for the camera
        const constraints = {
          video: {
            facingMode: 'environment', // Use the back camera
            advanced: [
              {
                focusMode: 'continuous', // Continuous autofocus (if supported)
              },
            ],
          },
        };

        console.log('Requesting camera with autofocus constraints...');
        
        // Get the media stream (camera input)
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log('Camera stream obtained:', stream);

        // Check if autofocus is applied
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        const appliedConstraints = track.getConstraints();

        console.log('Track settings:', settings);
        console.log('Applied constraints:', appliedConstraints);

        if (appliedConstraints.focusMode === 'continuous') {
          console.log('Autofocus is enabled and set to continuous.');
        } else if (settings.focusMode === 'continuous') {
          console.log('Autofocus is working in continuous mode.');
        } else {
          console.log('Autofocus is not enabled or not supported on this device.');
        }

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
  }, []); // Empty dependency array ensures this effect runs only once (on mount)

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
        style={{ border: '1px solid black' }}
      />
    </div>
  );
};

export default Camera;
