"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function DashHeader({
  title = "Dashboard",
  defaultHex = "#00502F",
  alpha = 0.65,
}) {
  const [hex, setHex] = useState(defaultHex);

  useEffect(() => {
    const saved = localStorage.getItem("headerHex");
    if (saved) setHex(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("headerHex", hex);
  }, [hex]);

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      role="banner"
      className="!sticky inset-x-0 top-1 z-50 backdrop-blur-md rounded-md"
      style={{ position: "fixed", backgroundColor: hexToRgba(hex, alpha) }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className="flex h-[115px] items-center justify-between gap-4 border-b"
          style={{ borderColor: hex }}
        >
          <div className="flex items-center gap-6 min-w-0">
            <Image
              src="/logo-lotus.png" // <- file in public/
              alt="Logo"
              width={75}
              height={75}
            />
            <h1 className="truncate text-xl sm:text-xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow">
              {title}
            </h1>
          </div>

          <Image
            src="/med-logo.png" // <- file in public/
            alt="Leeds Uni Clocktower"
            className="hidden sm:block"
            width={70}
            height={70}
          />

          <div className="flex  items-center gap-3">
            <label className="hidden sm:block font-extrabold text-md text-white/90 text-center">
              The University of Leeds <br />
              Meditation Society
            </label>
            <input
              type="color"
              className="mr-3 h-9 w-9 cursor-pointer  rounded-md border border-white/50 bg-transparent p-1 shadow"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />

            <Image
              src="/Leeds-logo.png" // <- file in public/
              alt="Leeds Uni Clocktower"
              width={60}
              height={60}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
