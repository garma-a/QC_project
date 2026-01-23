'use client';
import { Button } from "@/components/ui/button"
import { useState } from "react";

export default function Home() {
  const [count, setcount] = useState(0);
  return (<>
    {count}
    < Button onClick={() => setcount(count + 1)} > Click me</Button >
  </>
  );
}
