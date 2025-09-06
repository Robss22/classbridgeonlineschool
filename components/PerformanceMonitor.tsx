'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

// Extend Window interface for custom events
declare global {
  interface WindowEventMap {
    'performance-metrics': CustomEvent<PerformanceMetrics>;
  }
}

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'production',
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const measurePerformance = () => {
      // Wait for page to fully load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', measurePerformance);
        return;
      }

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const layoutShift = performance.getEntriesByType('layout-shift');
      const firstInput = performance.getEntriesByType('first-input');

      const newMetrics: PerformanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0, // Will be updated by observer
        cumulativeLayoutShift: layoutShift.reduce((sum, shift) => {
          // Properly type the layout shift entry
          const layoutShiftEntry = shift as PerformanceEntry & { value: number };
          return sum + (layoutShiftEntry.value || 0);
        }, 0),
        firstInputDelay: (() => {
          const input = firstInput[0] as PerformanceEntry & { processingStart: number; startTime: number };
          return input ? (input.processingStart - input.startTime) : 0;
        })(),
        bundleSize: 0, // Will be calculated separately
      };

      // Measure Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          newMetrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Calculate bundle size
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('_next/static/chunks/')) {
          // Estimate size based on URL patterns
          totalSize += 50; // Rough estimate in KB
        }
      });
      newMetrics.bundleSize = totalSize;

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);

      // Send metrics to analytics (if configured)
      if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
        fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'performance',
            metrics: newMetrics,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
          })
        }).catch(console.error);
      }
    };

    // Start measuring after a short delay
    const timer = setTimeout(measurePerformance, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, onMetricsUpdate]);

  // Don't render anything in production to avoid affecting performance
  if (enabled) return null;

  // Development mode: show metrics
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      {metrics ? (
        <div className="space-y-1">
          <div>Load Time: {metrics.loadTime.toFixed(2)}ms</div>
          <div>FCP: {metrics.firstContentfulPaint.toFixed(2)}ms</div>
          <div>LCP: {metrics.largestContentfulPaint.toFixed(2)}ms</div>
          <div>CLS: {metrics.cumulativeLayoutShift.toFixed(3)}</div>
          <div>FID: {metrics.firstInputDelay.toFixed(2)}ms</div>
          <div>Bundle: ~{metrics.bundleSize}KB</div>
        </div>
      ) : (
        <div>Measuring...</div>
      )}
    </div>
  );
}

// Hook for using performance metrics in components
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for custom performance events
    const handlePerformanceEvent = (event: CustomEvent<PerformanceMetrics>) => {
      setMetrics(event.detail);
    };

    window.addEventListener('performance-metrics', handlePerformanceEvent);

    return () => {
      window.removeEventListener('performance-metrics', handlePerformanceEvent);
    };
  }, []);

  return metrics;
}
