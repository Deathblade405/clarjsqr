import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const QRScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrData, setQrData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Access the camera with optimal constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // Use back camera
            width: { ideal: 2560 }, // High resolution
            height: { ideal: 1440 },
            frameRate: { ideal: 60 }, // Max FPS
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setErrorMessage(`Error accessing camera: ${error.message}`);
      }
    };

    startCamera();

    // Cleanup on unmount
    return () => {
      const video = videoRef.current;
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.srcObject) {
        const tracks = currentVideo.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
        if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const detectQRCode = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrData(code.data);
        } else {
          setQrData(null); // No QR code detected
        }
      }

      requestAnimationFrame(detectQRCode); // Continue scanning
    };

    requestAnimationFrame(detectQRCode);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>QR Scanner</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {qrData ? (
        <p style={{ color: "green" }}>QR Code Data: {qrData}</p>
      ) : (
        <p>Position a QR code in front of the camera</p>
      )}
      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxHeight: "400px",
          backgroundColor: "black",
        }}
        playsInline // Mobile compatibility
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default QRScanner;
