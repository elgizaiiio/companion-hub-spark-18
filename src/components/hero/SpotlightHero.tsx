import { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
};

const SpotlightHero = ({ title, children }: Props) => (
  <section className="hero-dark relative min-h-[100dvh] w-full overflow-hidden flex flex-col">
    {/* Static soft mint/pink wash — no animation */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 20% 0%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 90% 12%, hsl(var(--accent) / 0.12), transparent 70%)",
      }}
    />

    <h1 className="hero-title pointer-events-none relative z-20 pt-safe px-6 mb-4 text-center text-[3.25rem] leading-[0.95] sm:text-[4.5rem]">
      {title}
    </h1>

    <div className="relative z-40 mt-auto">{children}</div>
  </section>
);

export default SpotlightHero;
