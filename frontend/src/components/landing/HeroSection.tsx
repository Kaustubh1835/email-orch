'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fill container
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];

    const particleCount = 100;
    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const forceStrength = 2;
    const damping = 0.92;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
      });
    }

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDistance = 200;

        if (distance < forceDistance) {
          const force = (forceDistance - distance) / forceDistance;
          const ax = (dx / distance) * force * forceStrength;
          const ay = (dy / distance) * force * forceStrength;

          particle.vx += ax;
          particle.vy += ay;
        }

        particle.vx *= damping;
        particle.vy *= damping;

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.fillStyle = `rgba(34, 211, 238, ${0.7})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      particles.forEach((particle, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.4;
            ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* Canvas Background with Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Text Content Overlay - Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div className="text-center px-8 max-w-4xl mx-auto">
          {/* Main Heading - No Blur */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6"
          >
            <span className="text-cyan-400">AI-Powered</span>
            <br />
            <span className="text-zinc-100">Email Orchestration</span>
          </motion.h1>

          {/* Glass Effect Container - Only for Text */}
          <div className="rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 px-8 py-8 mb-8">
            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto"
            >
              Generate professionally crafted emails from minimal input. Intelligent
              classification, tone detection, and automated follow-ups powered by
              GPT-4 and LangGraph.
            </motion.p>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/compose"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition-all text-lg"
            >
              Start Composing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-zinc-100 transition-all text-lg"
            >
              Create Account
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
