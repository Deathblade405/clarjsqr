import React, { useEffect, useState } from 'react';

const CameraApp = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [stream, setStream] = useState(null);
  const [zoom, setZoom] = useState(1); // For zoom control

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        // Directly select the camera at index 2,2 if possible (3rd camera in the list)
        if (videoDevices.length > 2) {
          setSelectedDevice(videoDevices[2].deviceId); // Use the camera at index 2
        }
      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      const getStream = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: selectedDevice,
              facingMode: 'environment', // Focuses on back camera (helpful for QR code scanners)
              zoom: zoom // Pass zoom settings if needed
            }
          });
          setStream(mediaStream);
        } catch (err) {
          console.error("Error accessing the camera", err);
        }
      };

      getStream();
    }

    // Cleanup stream on unmount or device change
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
      <h1>Camera Selector (QR Code Scanner)</h1>

      {devices.length > 0 ? (
        <div className="camera-selector">
          <label htmlFor="device-select">Select Camera: </label>
          <select id="device-select" value={selectedDevice} onChange={handleDeviceChange}>
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
