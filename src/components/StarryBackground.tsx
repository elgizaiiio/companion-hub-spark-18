import { useEffect, useRef } from "react";
import bgVideoMp4 from "@/assets/prize-bg.mp4.asset.json";
import bgVideoWebm from "@/assets/prize-bg.webm.asset.json";

const StarryBackground = () => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const play = () => void v.play().catch(() => undefined);
    play();
    document.addEventListener("touchstart", play, { once: true });
    document.addEventListener("click", play, { once: true });
    return () => {
      document.removeEventListener("touchstart", play);
      document.removeEventListener("click", play);
    };
  }, []);

  return (
    <div className="liquid-bg" aria-hidden="true">
      <video
        ref={ref}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src={bgVideoWebm.url} type="video/webm" />
        <source src={bgVideoMp4.url} type="video/mp4" />
      </video>
      <div className="liquid-bg__veil" />
    </div>
  );
};

export default StarryBackground;
