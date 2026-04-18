
"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, Ref } from 'react';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  className?: string;
}

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  setColor: (color: string) => void;
}

function DrawingCanvas({ className }: DrawingCanvasProps, ref: Ref<DrawingCanvasRef>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if(!container) return;

    // For high-DPI displays
    const scale = window.devicePixelRatio;
    canvas.width = container.offsetWidth * scale;
    canvas.height = container.offsetHeight * scale;
    canvas.style.width = `${container.offsetWidth}px`;
    canvas.style.height = `${container.offsetHeight}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(scale, scale);
    context.lineCap = 'round';
    context.strokeStyle = 'hsl(240 5% 95%)'; // Default color
    context.lineWidth = 4;
    contextRef.current = context;
  }, []);
  
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        if(context && canvas) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    setColor: (color: string) => {
        const context = contextRef.current;
        if(context) {
            context.strokeStyle = color;
        }
    }
  }));

  const getEventPosition = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    if (event.touches && event.touches.length > 0) {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return null;
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPosition(event.nativeEvent);
    if (!pos || !contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(pos.x, pos.y);
    isDrawing.current = true;
    event.preventDefault();
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    isDrawing.current = false;
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const pos = getEventPosition(event.nativeEvent);
    if (!pos || !contextRef.current) return;
    contextRef.current.lineTo(pos.x, pos.y);
    contextRef.current.stroke();
    event.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseUp={finishDrawing}
      onMouseMove={draw}
      onMouseLeave={finishDrawing}
      onTouchStart={startDrawing}
      onTouchEnd={finishDrawing}
      onTouchMove={draw}
      className={cn("w-full h-full cursor-crosshair bg-primary/20", className)}
    />
  );
}

export default forwardRef(DrawingCanvas);
