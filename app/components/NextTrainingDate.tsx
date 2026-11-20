"use client";

import { useEffect, useState } from "react";
import { getNextTrainingDate } from "../lib/training";

export default function NextTrainingDate() {
  const [trainingDate, setTrainingDate] = useState("");

  useEffect(() => {
    const updateTrainingDate = () => {
      setTrainingDate(getNextTrainingDate(new Date()));
    };
    updateTrainingDate();
    const interval = window.setInterval(updateTrainingDate, 30_000);
    window.addEventListener("focus", updateTrainingDate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateTrainingDate);
    };
  }, []);

  return (
    <p
      className="mt-3 text-xs font-bold tracking-[.16em] text-slate-300"
      aria-live="polite"
    >
      {trainingDate || "UPCOMING SATURDAY"} • 7:30 AM WAT
    </p>
  );
}
