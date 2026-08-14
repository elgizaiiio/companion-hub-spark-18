import { ReactNode, useEffect, useRef, useState } from "react";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260710_114906_ad7cee37-9e56-434f-99bc-92d5bdc4f9fe.mp4";
const FRONT_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260710_115050_a1ba47d0-aedf-413c-9dea-14509599d3dd.mp4";

const RADIUS = 260;

type Props = {
  title: string;
  children?: ReactNode;
};

const SpotlightHero = ({ title, children }: Props) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ x: -9999, y: -9999 });
  const smooth = useRef({ x: -9999, y: -9999 });
  const [maskUrl, setMaskUrl] = useState<string>("");
  const [grid, setGrid] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const move = (clientX: number, clientY: number) => {
      const rect = section.getBoundingClientRect();
      target.current = { x: clientX - rect.left, y: clientY - rect.top };
    };
    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };

    section.addEventListener("mousemove", onMouse);
    section.addEventListener("touchmove", onTouch, { passive: true });

    let raf = 0;
    const gridPos = { x: 0, y: 0 };

    const loop = () => {
      smooth.current.x += (target.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (target.current.y - smooth.current.y) * 0.1;

      const rect = section.getBoundingClientRect();
      const gx = ((target.current.x - rect.width / 2) / rect.width) * 16;
      const gy = ((target.current.y - rect.height / 2) / rect.height) * 16;
      gridPos.x += (gx - gridPos.x) * 0.06;
      gridPos.y += (gy - gridPos.y) * 0.06;
      setGrid({ x: gridPos.x, y: gridPos.y });

      const canvas = canvasRef.current;
      if (canvas) {
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          const g = ctx.createRadialGradient(
            smooth.current.x,
            smooth.current.y,
            0,
            smooth.current.x,
            smooth.current.y,
            RADIUS,
          );
          g.addColorStop(0, "rgba(255,255,255,1)");
          g.addColorStop(0.4, "rgba(255,255,255,1)");
          g.addColorStop(0.6, "rgba(255,255,255,0.75)");
          g.addColorStop(0.75, "rgba(255,255,255,0.4)");
          g.addColorStop(0.88, "rgba(255,255,255,0.12)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
          setMaskUrl(canvas.toDataURL());
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("mousemove", onMouse);
      section.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-dark relative min-h-screen w-full overflow-hidden">
      {/* Layer 1 — grid */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{ transform: `translate3d(${grid.x}px, ${grid.y}px, 0)` }}
        aria-hidden="true"
      >
        <svg className="h-full w-full">
          <defs>
            <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Layer 2 — background video */}
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="ze-bg absolute inset-0 z-10 h-full w-full object-cover"
        style={{ objectPosition: "center 48%" }}
      />

      {/* Layer 3 — hero title */}
      <h1 className="hero-title ze-reveal ze-d3 pointer-events-none absolute left-0 right-0 top-28 z-20 text-center text-[4.5rem] leading-[0.92] sm:top-36 sm:text-[6rem]">
        {title}
      </h1>

      {/* Layer 4 — warm fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-[54%]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.35) 46%, rgba(10,10,10,0.88) 78%, #0a0a0a 100%)",
        }}
      />


      {/* Layer 5 — spotlight reveal */}
      <canvas ref={canvasRef} className="hidden" />
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : undefined,
          maskImage: maskUrl ? `url(${maskUrl})` : undefined,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
        aria-hidden="true"
      >
        <video
          src={FRONT_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ clipPath: "inset(40% 0 0 0)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-40">{children}</div>
    </section>
  );
};

export default SpotlightHero;
