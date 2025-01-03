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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Back camera
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("Camera initialization error:", error);
        setErrorMessage(`Camera error: ${error.name} - ${error.message}`);
      }
    };

    startCamera();

    // Cleanup function
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
          setQrData(code.data);
        } else {
          setQrData(null);
        }
      }

      requestAnimationFrame(detectQRCode);
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
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default QRScanner;
