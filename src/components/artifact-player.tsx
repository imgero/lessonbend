"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { artifactEventSchema } from "@/lib/contracts";
import { makeHalfArtifact } from "@/lib/half-artifact";

export function ArtifactPlayer() {
  const token = useMemo(() => crypto.randomUUID(), []);
  const [events, setEvents] = useState<string[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const port = useRef<MessagePort | null>(null);
  const source = useMemo(() => makeHalfArtifact(), []);

  useEffect(() => {
    return () => port.current?.close();
  }, []);

  const initialize = useCallback(() => {
    port.current?.close();
    const channel = new MessageChannel();
    channel.port1.addEventListener("message", (event) => {
      const parsed = artifactEventSchema.safeParse(event.data);
      if (!parsed.success || parsed.data.token !== token) return;
      setEvents((current) => [...current, parsed.data.type.replace("lessonbend.", "")]);
    });
    channel.port1.start();
    port.current = channel.port1;
    frame.current?.contentWindow?.postMessage({ type: "lessonbend.init", token }, "*", [channel.port2]);
  }, [token]);

  return <section className="player"><div className="player-bar"><span>Sandboxed artifact</span><span>{events.length ? events.join(" · ") : "waiting for artifact"}</span></div><iframe ref={frame} onLoad={initialize} title="Equivalent fractions: one half" sandbox="allow-scripts" srcDoc={source} /></section>;
}
