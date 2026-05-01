import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Certificate = ({ user, course }) => {
  
  const downloadCertificate = async () => {
    const element = document.getElementById("certificate");

    const canvas = await html2canvas(element, {
      scale: 2
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 150);
    pdf.save("certificate.pdf");
  };

  return (
    <>
      <div
        id="certificate"
        style={{
          width: "1000px",
          margin: "auto",
          padding: "40px",
          border: "10px solid #1e3a8a",
          borderRadius: "10px",
          background: "linear-gradient(to right, #f8fafc, #e2e8f0)",
          fontFamily: "serif",
          textAlign: "center",
          position: "relative"
        }}
      >
        <h1 style={{ fontSize: "42px", color: "#1e3a8a" }}>
          Certificate of Completion
        </h1>

        <p>This is proudly presented to</p>

        <h2>{user?.name}</h2>

        <p>for successfully completing</p>

        <h3>{course?.title}</h3>

        <p>Issued on: {new Date().toLocaleDateString()}</p>

        {/* Watermark */}
        <h1
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-20deg)",
            fontSize: "80px",
            color: "rgba(30, 58, 138, 0.05)"
          }}
        >
          CERTIFIED
        </h1>
      </div>

      {/* ✅ Button INSIDE component */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={downloadCertificate}>
          Download Certificate
        </button>
      </div>
    </>
  );
};

export default Certificate;