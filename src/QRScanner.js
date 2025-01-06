import React, { useEffect, useState } from 'react';
import './QRScanner.css';

const CameraApp = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [stream, setStream] = useState(null);
  const [zoom, setZoom] = useState(1); // For zoom control

  useEffect(() => {
    // Get media devices when the component mounts
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[1].deviceId); // Change to use second camera by index
        }
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    // If there's a selected device, get the stream for that device
    if (selectedDevice) {
      const getStream = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              deviceId: selectedDevice,
              zoom: zoom // Include zoom setting in constraints
            }
          });
          setStream(mediaStream);
        } catch (err) {
          console.error("Error accessing the camera", err);
        }
      };

      getStream();
    }

    // Cleanup function to stop the stream when the component unmounts or device changes
    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [selectedDevice, zoom]);

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  const handleZoomChange = (event) => {
    setZoom(event.target.value);
  };

  return (
    <div className="camera-container">
      <h1>Camera Selector</h1>

      {devices.length > 0 ? (
        <div className="camera-selector">
          <select value={selectedDevice} onChange={handleDeviceChange}>
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index}`}
              </option>
            ))}
          </select>

          <div className="video-container">
            <video
              id="video"
              width="100%"
              height="100%"
              autoPlay
              muted
              ref={(videoElement) => {
                if (videoElement && stream) {
                  videoElement.srcObject = stream;
                }
              }}
            ></video>
          </div>

          <div className="zoom-control">
            <label>Zoom: {zoom}</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={handleZoomChange}
            />
          </div>
        </div>
      ) : (
        <p>No video devices found.</p>
      )}
    </div>
  );
};

export default CameraApp;
