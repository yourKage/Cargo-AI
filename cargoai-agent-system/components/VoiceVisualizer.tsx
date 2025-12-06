import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      if (!isActive) {
        // Flat line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      // Simple sine wave simulation for visual feedback
      for (let i = 0; i < width; i++) {
        const amplitude = 20 + Math.sin(time * 0.1) * 10;
        const frequency = 0.05;
        const y = height / 2 + Math.sin(i * frequency + time) * amplitude;
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = '#10b981'; // Emerald 500
      ctx.lineWidth = 3;
      ctx.stroke();

      time += 0.2;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-32 rounded-lg bg-slate-900 shadow-inner"
    />
  );
};