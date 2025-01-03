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
        // Request access to the back camera with the best available resolution
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" }, // Use the back camera
            width: { ideal: 1920 }, // Ideal resolution width
            height: { ideal: 1080 }, // Ideal resolution height
            frameRate: { ideal: 60 }, // High frame rate
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setErrorMessage(
          `Unable to access camera. ${error.message || "Please check permissions."}`
        );
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
          setQrData(code.data); // Display detected QR code data
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
      <h1>QR Code Scanner</h1>
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
          height: "auto",
          backgroundColor: "black",
        }}
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default QRScanner;
