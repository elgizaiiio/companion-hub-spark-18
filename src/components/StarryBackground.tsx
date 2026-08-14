import bgVideoMp4 from "@/assets/prize-bg.mp4.asset.json";
import bgVideoWebm from "@/assets/prize-bg.webm.asset.json";

const StarryBackground = () => (
  <div className="liquid-bg" aria-hidden="true">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    >
      <source src={bgVideoWebm.url} type="video/webm" />
      <source src={bgVideoMp4.url} type="video/mp4" />
    </video>
    <div className="liquid-bg__veil" />
  </div>
);

export default StarryBackground;
