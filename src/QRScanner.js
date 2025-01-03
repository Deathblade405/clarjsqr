import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera
            width: { ideal: 2560 }, // Request 1440p width
            height: { ideal: 1440 }, // Request 1440p height
            frameRate: { ideal: 60 }, // Request 60 FPS
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const detectQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setQrData(code.data); // Update state with QR code data
      } else {
        setQrData(null); // No QR code detected
      }

      requestAnimationFrame(detectQRCode); // Continue scanning
    };

    detectQRCode();
  }, []);

  return (
    <div>
      <h1>QR Scanner</h1>
      {qrData ? (
        <p>QR Code Data: {qrData}</p>
      ) : (
        <p>Position a QR code in front of the camera</p>
      )}
      <video ref={videoRef} style={{ width: "100%", display: "block" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default QRScanner;
