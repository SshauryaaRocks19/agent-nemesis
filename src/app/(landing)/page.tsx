"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TextReveal } from "@/components/animations/text-reveal";
import ColorBends from "@/components/ColorBends";
import { Magnet } from "@/components/ui/magnet";
import { Marquee } from "@/components/ui/marquee";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const beigeSectionRef = useRef<HTMLElement>(null);
  const darkSectionRef = useRef<HTMLElement>(null);
  const gapTextRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Parallax effect on the gap text
      if (gapTextRef.current) {
        gsap.to(gapTextRef.current, {
          y: -100,
          scale: 0.95,
          opacity: 0.2,
          scrollTrigger: {
            trigger: gapTextRef.current,
            start: "top center",
            end: "bottom top",
            scrub: true,
          }
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* SECTION 1: HERO (DARK) */}
      <section className="w-full min-h-[90vh] flex flex-col justify-end px-6 md:px-12 pb-12 pt-32 relative overflow-hidden bg-background">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ColorBends
              colors={["#6366F1", "#8B5CF6", "#0B0F19"]}
              rotation={90}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={0}
              noise={0}
              parallax={0.5}
              iterations={1}
              intensity={1.5}
              bandWidth={6}
              transparent
              autoRotate={0}
              color="#8B5CF6"
            />
          </div>
        </div>
        
        {/* Content layer */}
        <div className="w-full relative z-10">
          <TextReveal>
            <h1 className="text-[12vw] md:text-[14vw] font-heading font-extrabold tracking-[-0.06em] leading-[0.8] uppercase select-none text-poppy-outline">
              AGENT<br/>NEMESIS
            </h1>
          </TextReveal>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12 md:mt-24 border-t border-border/40 pt-8 relative z-10">
          <div className="md:col-span-3">
            <TextReveal delay={0.2}>
              <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                <span>V 1.0.0</span>
                <span>Hackathon Build</span>
                <span>EST 2026</span>
              </div>
            </TextReveal>
          </div>
          
          <div className="md:col-span-5 md:col-start-5">
            <TextReveal delay={0.4}>
              <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed tracking-tight">
                A trust-auditing dashboard that reads real OpenTelemetry traces to catch loops, unverified claims, and broken promises before they burn your budget.
              </p>
            </TextReveal>
            <TextReveal delay={0.6}>
              <div className="mt-8">
                <Magnet padding={50}>
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center text-sm font-bold uppercase tracking-widest hover:text-muted-foreground transition-colors"
                  >
                    Enter Dashboard
                    <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Magnet>
              </div>
            </TextReveal>
          </div>
          
          <div className="md:col-span-2 md:col-start-11 text-right">
            <TextReveal delay={0.8}>
              <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground uppercase tracking-widest">
                <span>Built on</span>
                <span className="text-foreground">SigNoz</span>
                <span className="text-foreground">OpenTelemetry</span>
              </div>
            </TextReveal>
          </div>
        </div>
      </section>
      
      {/* SECTION 1.5: MARQUEE TICKER */}
      <section className="w-full border-y border-border/40 bg-background py-4 relative z-10">
        <Marquee pauseOnHover={true} className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span className="mx-4 text-foreground">DETECT LOOPS</span>
          <span className="mx-4">·</span>
          <span className="mx-4 text-foreground">VERIFY CLAIMS</span>
          <span className="mx-4">·</span>
          <span className="mx-4 text-foreground">AUDIT HANDOFFS</span>
          <span className="mx-4">·</span>
          <span className="mx-4 text-foreground">PREVENT HALLUCINATIONS</span>
          <span className="mx-4">·</span>
        </Marquee>
      </section>

      {/* SECTION 2: THE GAP (DARK) */}
      <section className="w-full min-h-[50vh] flex items-center justify-center py-24 overflow-hidden relative bg-background z-10">
        <h2 
          ref={gapTextRef}
          className="text-5xl md:text-[8vw] font-heading font-extrabold tracking-[-0.04em] uppercase text-center max-w-[80vw]"
        >
          WE EXPOSE<br/>THE GAP
        </h2>
      </section>

      {/* SECTION 3: FEATURES (LIGHT CONTRAST) */}
      <section 
        ref={beigeSectionRef}
        className="w-full py-32 px-6 md:px-12 z-10 relative"
        style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <TextReveal>
            <h2 className="text-sm font-mono uppercase tracking-widest mb-16 border-b border-black/10 pb-4">
              Core Capabilities
            </h2>
          </TextReveal>
          
          <div className="flex flex-col gap-32">
            
            {/* Loop Detection */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center group cursor-default">
              <div className="md:col-span-6 order-2 md:order-1">
                <TextReveal>
                  <h3 className="text-5xl md:text-7xl font-heading font-extrabold tracking-[-0.04em] uppercase mb-6 transition-transform group-hover:translate-x-4 duration-500">
                    Infinite<br/>Loops
                  </h3>
                </TextReveal>
                <TextReveal delay={0.2}>
                  <p className="text-xl font-medium leading-relaxed max-w-md opacity-80">
                    Agents get stuck calling the same tool repeatedly without making progress. We detect cyclical tool usage and flag it before your API costs explode.
                  </p>
                </TextReveal>
              </div>
              <div className="md:col-span-5 md:col-start-8 order-1 md:order-2 flex justify-center">
                <div className="text-[15rem] md:text-[20rem] font-heading leading-none tracking-tighter opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 select-none">
                  *
                </div>
              </div>
            </div>

            {/* Unverified Claims */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center group cursor-default">
              <div className="md:col-span-5 order-1 md:order-1 flex justify-center">
                <div className="text-[15rem] md:text-[20rem] font-heading leading-none tracking-tighter opacity-10 group-hover:opacity-30 group-hover:-rotate-12 transition-all duration-700 select-none">
                  !
                </div>
              </div>
              <div className="md:col-span-6 md:col-start-7 order-2 md:order-2">
                <TextReveal>
                  <h3 className="text-5xl md:text-7xl font-heading font-extrabold tracking-[-0.04em] uppercase mb-6 transition-transform group-hover:-translate-x-4 duration-500">
                    Unverified<br/>Claims
                  </h3>
                </TextReveal>
                <TextReveal delay={0.2}>
                  <p className="text-xl font-medium leading-relaxed max-w-md opacity-80">
                    An agent states something as fact without invoking a tool to check. We cross-reference final output with trace history to ensure cryptographic proof of work.
                  </p>
                </TextReveal>
              </div>
            </div>

            {/* Broken Promises */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center group cursor-default">
              <div className="md:col-span-6 order-2 md:order-1">
                <TextReveal>
                  <h3 className="text-5xl md:text-7xl font-heading font-extrabold tracking-[-0.04em] uppercase mb-6 transition-transform group-hover:translate-x-4 duration-500">
                    Broken<br/>Promises
                  </h3>
                </TextReveal>
                <TextReveal delay={0.2}>
                  <p className="text-xl font-medium leading-relaxed max-w-md opacity-80">
                    The agent claims to have executed an action but never dispatched the request. We trace intent vs execution to ensure reliability.
                  </p>
                </TextReveal>
              </div>
              <div className="md:col-span-5 md:col-start-8 order-1 md:order-2 flex justify-center">
                <div className="text-[15rem] md:text-[20rem] font-heading leading-none tracking-tighter opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 select-none">
                  /
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 4: THE JOURNEY (DARK) */}
      <section 
        ref={darkSectionRef}
        className="w-full py-32 px-6 md:px-12 bg-background text-foreground relative z-10"
      >
        <div className="max-w-[1400px] mx-auto">
          <TextReveal>
            <h2 className="text-[8vw] md:text-[10vw] font-heading font-extrabold tracking-[-0.04em] leading-[0.9] uppercase mb-24 text-center">
              PIPELINE<br/>JOURNEY
            </h2>
          </TextReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            <div className="absolute top-8 left-0 w-full h-px bg-border hidden md:block" />
            
            <div className="pt-8 group">
              <TextReveal>
                <span className="text-xs font-mono text-muted-foreground block mb-4 uppercase">Step 01</span>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 group-hover:text-trust-healthy transition-colors">Emit Traces</h3>
                <p className="text-muted-foreground">OTel GenAI conventions send deterministic spans to SigNoz continuously.</p>
              </TextReveal>
            </div>
            
            <div className="pt-8 md:border-l border-border md:pl-8 group">
              <TextReveal delay={0.1}>
                <span className="text-xs font-mono text-muted-foreground block mb-4 uppercase">Step 02</span>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 group-hover:text-trust-healthy transition-colors">Checker Worker</h3>
                <p className="text-muted-foreground">A headless Node process polls SigNoz, detecting logical gaps in the trace history.</p>
              </TextReveal>
            </div>
            
            <div className="pt-8 md:border-l border-border md:pl-8 group">
              <TextReveal delay={0.2}>
                <span className="text-xs font-mono text-trust-healthy block mb-4 uppercase">Step 03</span>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 text-trust-healthy">The Truth</h3>
                <p className="text-muted-foreground">Dashboard visualizes trust scores and flags, exposing what your agent actually did.</p>
              </TextReveal>
            </div>
          </div>
          
          <div className="mt-32 flex justify-center">
            <Magnet padding={100}>
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center w-32 h-32 rounded-full border border-border hover:bg-foreground hover:text-background transition-all duration-300 font-bold uppercase tracking-widest text-xs"
              >
                Start
              </Link>
            </Magnet>
          </div>
        </div>
      </section>
      
    </div>
  );
}
