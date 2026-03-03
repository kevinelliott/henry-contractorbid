"use client";

import { useState } from "react";
import { BidBuilder } from "@/components/BidBuilder";
import { Landing } from "@/components/Landing";

export default function Home() {
  const [started, setStarted] = useState(false);
  if (started) return <BidBuilder />;
  return <Landing onStart={() => setStarted(true)} />;
}
