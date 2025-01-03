import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const QRCodeScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    let stream;
    const getBestRearCamera = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      const rearCameras = videoDevices.filter(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
      );
      return rearCameras.length ? rearCameras[0] : videoDevices[0];
    };

    const startCamera = async () => {
      try {
        const bestCamera = await getBestRearCamera();
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: bestCamera.deviceId,
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setErrorMessage("Error accessing camera. Please check permissions or device compatibility.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [torchEnabled]);

  const scanQRCode = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        setQrCodeData(code.data); // QR Code content
        console.log("QR Code found:", code.data);
      } else {
        console.log("Scanning...");
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(scanQRCode, 500); // Scan every 500ms
    return () => clearInterval(interval);
  }, []);

  const toggleTorch = async () => {
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }],
      });
      setTorchEnabled((prev) => !prev);
    } else {
      setErrorMessage("Torch is not supported on this device.");
    }
  };

  const zoomIn = () => {
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.zoom) {
      const newZoom = Math.min(zoomLevel + 1, capabilities.zoom.max);
      track.applyConstraints({ advanced: [{ zoom: newZoom }] });
      setZoomLevel(newZoom);
    } else {
      setErrorMessage("Zoom is not supported on this device.");
    }
  };

  const zoomOut = () => {
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.zoom) {
      const newZoom = Math.max(zoomLevel - 1, capabilities.zoom.min);
      track.applyConstraints({ advanced: [{ zoom: newZoom }] });
      setZoomLevel(newZoom);
    } else {
      setErrorMessage("Zoom is not supported on this device.");
    }
  };

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <video ref={videoRef} style={{ width: "100%" }} />
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      {qrCodeData ? (
        <p>QR Code Data: {qrCodeData}</p>
      ) : errorMessage ? (
        <p style={{ color: "red" }}>{errorMessage}</p>
      ) : (
        <p>Point your camera at a QR code</p>
      )}
      <div style={{ marginTop: "10px" }}>
        <button onClick={toggleTorch}>
          {torchEnabled ? "Turn Torch Off" : "Turn Torch On"}
        </button>
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={zoomOut}>Zoom Out</button>
      </div>
    </div>
  );
};

export default QRCodeScanner;
