import React, { useEffect, useRef, useState } from 'react';

const ThermalCamera = () => {
  const [hasPermission, setHasPermission] = useState(true); // Handle camera permissions
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        // Define constraints for the camera
        const constraints = {
          video: {
            width: { ideal: 1280 }, // Request HD resolution
            height: { ideal: 720 },
            facingMode: 'environment', // Use the back camera
          },
        };

        console.log('Requesting camera for thermal simulation...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Camera stream obtained.');
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
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const applyThermalEffect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const ctx = canvas.getContext('2d');

        const renderFrame = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Draw the video frame to the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get the image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply thermal effect
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Calculate intensity
              const intensity = (r + g + b) / 3;

              // Map intensity to thermal colors
              if (intensity < 64) {
                // Cold (blue)
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 255;
              } else if (intensity < 128) {
                // Cool (cyan)
                data[i] = 0;
                data[i + 1] = 255;
                data[i + 2] = 255;
              } else if (intensity < 192) {
                // Warm (yellow)
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 0;
              } else {
                // Hot (red)
                data[i] = 255;
                data[i + 1] = 0;
                data[i + 2] = 0;
              }
            }

            // Update canvas with the thermal effect
            ctx.putImageData(imageData, 0, 0);
          }

          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      }
    };

    applyThermalEffect();
  }, []);

  return (
    <div>
      <h1>Thermal Camera (Simulated)</h1>
      {!hasPermission && <p>Permission to access the camera is denied!</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }} // Hide the video element
      />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{ width: '100%', height: 'auto', border: '1px solid black' }}
      />
    </div>
  );
};

export default ThermalCamera;
