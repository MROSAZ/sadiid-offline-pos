
/**
 * Utilities for monitoring and optimizing application performance
 */
import React from 'react';

// Track key performance metrics
const performanceMetrics: Record<string, {
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
}> = {};

/**
 * Measure performance of an operation
 * @param name - Name of the operation
 * @param operation - Operation to measure
 * @returns Result of the operation
 */
export const measurePerformance = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    recordMetric(name, duration);
  }
};

/**
 * Record a performance metric
 * @param name - Name of the metric
 * @param duration - Duration in milliseconds
 */
export const recordMetric = (name: string, duration: number): void => {
  if (!performanceMetrics[name]) {
    performanceMetrics[name] = {
      count: 0,
      totalDuration: 0,
      minDuration: Number.MAX_VALUE,
      maxDuration: 0,
    };
  }
  
  const metric = performanceMetrics[name];
  metric.count++;
  metric.totalDuration += duration;
  metric.minDuration = Math.min(metric.minDuration, duration);
  metric.maxDuration = Math.max(metric.maxDuration, duration);
};

/**
 * Get performance metrics
 * @returns Object containing all recorded metrics
 */
export const getPerformanceMetrics = (): Record<string, {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
}> => {
  const result: Record<string, any> = {};
  
  Object.entries(performanceMetrics).forEach(([name, metric]) => {
    result[name] = {
      count: metric.count,
      avgDuration: metric.totalDuration / metric.count,
      minDuration: metric.minDuration,
      maxDuration: metric.maxDuration,
    };
  });
  
  return result;
};

/**
 * Log performance metrics to console
 */
export const logPerformanceMetrics = (): void => {
  console.group('Performance Metrics');
  Object.entries(getPerformanceMetrics()).forEach(([name, metric]) => {
    console.log(`${name}:`, {
      count: metric.count,
      avg: `${metric.avgDuration.toFixed(2)}ms`,
      min: `${metric.minDuration.toFixed(2)}ms`,
      max: `${metric.maxDuration.toFixed(2)}ms`,
    });
  });
  console.groupEnd();
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = (): void => {
  Object.keys(performanceMetrics).forEach(key => {
    delete performanceMetrics[key];
  });
};

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Throttle a function
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall < delay) {
      return;
    }
    
    lastCall = now;
    return fn.apply(this, args);
  };
};

/**
 * Measure memory usage
 * @returns Memory usage information
 */
export const getMemoryUsage = (): { jsHeapSizeLimit: number, totalJSHeapSize: number, usedJSHeapSize: number } | null => {
  if (window.performance && (performance as any).memory) {
    return (performance as any).memory;
  }
  return null;
};

/**
 * Track React component render time
 * Usage: Place in component body: const renderTime = useRenderTime('MyComponent');
 */
export const useRenderTime = (componentName: string): React.MutableRefObject<number> => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    recordMetric(`render_${componentName}`, renderTime);
    
    return () => {
      const unmountTime = performance.now();
      const lifetime = unmountTime - startTime.current;
      recordMetric(`lifetime_${componentName}`, lifetime);
    };
  }, [componentName]);
  
  React.useEffect(() => {
    startTime.current = performance.now();
  });
  
  return startTime;
};

/**
 * Get Core Web Vital metrics
 * @returns Promise resolving to performance metrics
 */
export const getWebVitals = async (): Promise<Record<string, number>> => {
  // Wait for LCP to be available
  const getLCP = (): Promise<number> => {
    return new Promise(resolve => {
      const entryTypes = ['largest-contentful-paint'];
      let lcpValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });
      
      try {
        observer.observe({ entryTypes });
      } catch (e) {
        // Not supported
      }
      
      // Resolve after 5 seconds or on load
      window.addEventListener('load', () => resolve(lcpValue));
      setTimeout(() => resolve(lcpValue), 5000);
    });
  };
  
  // Get FID value
  const getFID = (): Promise<number> => {
    return new Promise(resolve => {
      let fidValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        if (firstInput) {
          fidValue = firstInput.processingStart - firstInput.startTime;
        }
      });
      
      try {
        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // Not supported
      }
      
      // Resolve after 5 seconds or on load
      window.addEventListener('load', () => resolve(fidValue));
      setTimeout(() => resolve(fidValue), 5000);
    });
  };
  
  // Get CLS value
  const getCLS = (): Promise<number> => {
    return new Promise(resolve => {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          // @ts-ignore - PerformanceEntry might not have value property
          if (!entry.hadRecentInput) {
            // @ts-ignore - PerformanceEntry might not have value property
            clsValue += entry.value;
          }
        });
      });
      
      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // Not supported
      }
      
      // Resolve after 5 seconds or on load
      window.addEventListener('load', () => resolve(clsValue));
      setTimeout(() => resolve(clsValue), 5000);
    });
  };
  
  // Get metrics
  const [lcp, fid, cls] = await Promise.all([getLCP(), getFID(), getCLS()]);
  
  return {
    LCP: lcp,
    FID: fid,
    CLS: cls,
  };
};

// Expose API for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).__PERFORMANCE_UTILS__ = {
    getMetrics: getPerformanceMetrics,
    logMetrics: logPerformanceMetrics,
    resetMetrics: resetPerformanceMetrics,
    getMemory: getMemoryUsage,
    getWebVitals,
  };
}
