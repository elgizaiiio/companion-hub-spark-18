import { useEffect, useRef } from "react";
const bgVideoMp4 =
  "https://pollen-batch-41236914.figma.site/_components/v2/f0ee2dae7671c170c34f12e31c4cb41418976c98/769c564298c132f7919405cd9f17c1b1231f341d.769c5642.mp4";

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
        src={bgVideoMp4}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="liquid-bg__veil" />
    </div>
  );
};

export default StarryBackground;
