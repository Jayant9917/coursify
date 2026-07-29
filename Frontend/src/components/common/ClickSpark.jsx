import { useCallback, useEffect, useRef } from "react";

export function ClickSpark({
  sparkColor = "#84CC16",
  sparkSize = 8,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 450,
  easing = "ease-out",
  extraScale = 1,
  children,
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return undefined;

    let resizeTimeout;
    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };
    const resizeObserver = new ResizeObserver(handleResize);

    resizeObserver.observe(parent);
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  const ease = useCallback(
    (progress) => {
      switch (easing) {
        case "linear":
          return progress;
        case "ease-in":
          return progress * progress;
        case "ease-in-out":
          return progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;
        default:
          return progress * (2 - progress);
      }
    },
    [easing]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let animationId;
    const draw = (timestamp) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = ease(elapsed / duration);
        const distance = progress * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - progress);
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        context.strokeStyle = sparkColor;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [duration, ease, extraScale, sparkColor, sparkRadius, sparkSize]);

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, index) => ({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        angle: (2 * Math.PI * index) / sparkCount,
        startTime: now,
      }))
    );
  };

  return (
    <div className="relative w-full" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 block h-full w-full select-none"
      />
      {children}
    </div>
  );
}
