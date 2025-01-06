import React, { useEffect, useState } from 'react';

const CameraApp = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Get media devices when the component mounts
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
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
            video: { deviceId: selectedDevice }
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
  }, [selectedDevice]);

  const handleDeviceChange = (event) => {
    setSelectedDevice(event.target.value);
  };

  return (
    <div>
      <h1>Camera Selector</h1>

      {devices.length > 0 ? (
        <div>
          <select value={selectedDevice} onChange={handleDeviceChange}>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </option>
            ))}
          </select>

          <video
            id="video"
            width="640"
            height="480"
            autoPlay
            muted
            ref={(videoElement) => {
              if (videoElement && stream) {
                videoElement.srcObject = stream;
              }
            }}
          ></video>
        </div>
      ) : (
        <p>No video devices found.</p>
      )}
    </div>
  );
};

export default CameraApp;
