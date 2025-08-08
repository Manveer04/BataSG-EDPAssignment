import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (scanning) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } }) // Use rear camera
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", true);
            videoRef.current.play();
          }

          codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result, err) => {
              if (result) {
                console.log("Scanned Barcode:", result.text);
                onScan(result.text);
                setScanning(false);
                codeReader.reset();
                stream.getTracks().forEach(track => track.stop()); // Stop camera
              }
              if (err) console.error(err);
            }
          );
        })
        .catch((err) => console.error("Error accessing camera:", err));
    }

    return () => {
      codeReader.reset();
    };
  }, [scanning, onScan]);

  return (
    <div>
      <button onClick={() => setScanning(!scanning)}>
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>
      {scanning && <video ref={videoRef} style={{ width: "100%" }} />}
    </div>
  );
};

export default BarcodeScanner;
