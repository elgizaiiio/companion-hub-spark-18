import bgVideo from "@/assets/prize-bg.mp4.asset.json";

const StarryBackground = () => (
  <div className="liquid-bg" aria-hidden="true">
    <video
      src={bgVideo.url}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    />
    <div className="liquid-bg__veil" />
  </div>
);

export default StarryBackground;
