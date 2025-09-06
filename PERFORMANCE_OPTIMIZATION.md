# Performance Optimization Guide

This guide outlines the performance optimizations implemented in the ClassBridge Online School project to ensure fast loading times and optimal user experience.

## 🎯 Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size**: < 500KB per chunk
- **Build Time**: < 3 minutes

## 🚀 Bundle Optimization

### 1. Webpack Configuration

The project uses advanced webpack configuration for optimal bundle splitting:

```javascript
// next.config.js
webpack: (config, { dev, isServer }) => {
  if (!isServer && !dev) {
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, priority: 10 },
        supabase: { test: /[\\/]@supabase[\\/]/, priority: 20 },
        react: { test: /[\\/](react|react-dom)[\\/]/, priority: 15 },
        charts: { test: /[\\/](recharts|d3)[\\/]/, priority: 25 },
        utils: { test: /[\\/](clsx|tailwind-merge|date-fns)[\\/]/, priority: 30 },
      }
    };
  }
}
```

### 2. Package Import Optimization

Next.js experimental features for better tree shaking:

```javascript
experimental: {
  optimizePackageImports: [
    '@supabase/supabase-js',
    'lucide-react',
    'react-icons',
    'recharts',
    'date-fns',
    'clsx',
    'tailwind-merge'
  ]
}
```

### 3. Bundle Analysis

Regular bundle analysis to identify optimization opportunities:

```bash
# Analyze current bundle
npm run analyze

# Analyze performance build
npm run analyze:performance

# Generate performance report
npm run performance:check
```

## 📦 Code Splitting Strategies

### 1. Route-based Splitting

Automatic code splitting by Next.js App Router:

```typescript
// app/page.tsx - Automatically split
export default function HomePage() {
  return <div>Home Page</div>
}

// app/admin/page.tsx - Separate chunk
export default function AdminPage() {
  return <div>Admin Page</div>
}
```

### 2. Component-level Splitting

Lazy load heavy components:

```typescript
import dynamic from 'next/dynamic'

// Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Disable SSR for client-only components
})

// Lazy load with preloading
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <div>Loading admin panel...</div>,
  preload: true
})
```

### 3. Suspense Boundaries

Implement Suspense for better loading states:

```typescript
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading analytics...</div>}>
        <Analytics />
      </Suspense>
      <Suspense fallback={<div>Loading recent activity...</div>}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
```

## 🖼️ Image Optimization

### 1. Next.js Image Component

Use Next.js Image for automatic optimization:

```typescript
import Image from 'next/image'

export default function OptimizedImage() {
  return (
    <Image
      src="/hero-image.jpg"
      alt="Hero image"
      width={800}
      height={600}
      priority // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

### 2. Image Formats

Support modern formats for better compression:

```javascript
// next.config.js
images: {
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 31536000, // 1 year
}
```

### 3. Responsive Images

Implement responsive images for different screen sizes:

```typescript
<Image
  src="/hero-image.jpg"
  alt="Hero image"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
  className="object-cover"
/>
```

## 🗄️ Data Fetching Optimization

### 1. React Query Configuration

Optimize data fetching with TanStack React Query:

```typescript
// lib/react-query.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount) => failureCount < 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  }
})
```

### 2. Selective Data Fetching

Only fetch required data:

```typescript
// Fetch only necessary fields
const { data: users } = useQuery({
  queryKey: ['users', 'basic'],
  queryFn: () => supabase
    .from('users')
    .select('id, name, email, role')
    .eq('active', true)
})

// Fetch detailed data on demand
const { data: userDetails } = useQuery({
  queryKey: ['users', userId, 'details'],
  queryFn: () => supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single(),
  enabled: !!userId
})
```

### 3. Optimistic Updates

Implement optimistic updates for better UX:

```typescript
const updateUser = useMutation({
  mutationFn: updateUserApi,
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['users', newUser.id])
    
    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['users', newUser.id])
    
    // Optimistically update
    queryClient.setQueryData(['users', newUser.id], newUser)
    
    return { previousUser }
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users', newUser.id], context?.previousUser)
  }
})
```

## 🎨 CSS Optimization

### 1. Tailwind CSS Purge

Ensure unused CSS is removed:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // Enable JIT mode for better performance
  mode: 'jit',
}
```

### 2. CSS-in-JS Optimization

Use CSS Modules for better tree shaking:

```typescript
// components/Button.module.css
.button {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}

// components/Button.tsx
import styles from './Button.module.css'

export default function Button({ children }) {
  return <button className={styles.button}>{children}</button>
}
```

## 🔧 Build Optimization

### 1. Production Build

Use performance-optimized build:

```bash
# Standard build
npm run build

# Performance-optimized build
npm run build:performance

# Clean + performance build
npm run build:optimized
```

### 2. Environment-specific Configs

Different configurations for different environments:

```javascript
// next.config.js - Development
const nextConfig = {
  // Development optimizations
}

// next.config.performance.js - Production
const nextConfig = {
  // Production optimizations
  experimental: {
    optimizePackageImports: [...],
  }
}
```

### 3. Build Analysis

Regular build analysis to identify issues:

```bash
# Bundle analysis
npm run analyze

# Performance check
npm run performance:check

# Lighthouse audit
npm run performance:lighthouse
```

## 📊 Performance Monitoring

### 1. Core Web Vitals

Monitor key performance metrics:

```typescript
// components/PerformanceMonitor.tsx
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }
  }, [])
  
  return null
}
```

### 2. Bundle Size Monitoring

Track bundle size over time:

```bash
# Generate bundle report
npm run analyze > bundle-report.txt

# Compare with previous builds
npm run performance:budget
```

### 3. Lighthouse CI

Automated performance testing:

```yaml
# .github/workflows/performance.yml
name: Performance Check
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        run: npm run performance:lighthouse
```

## 🚀 Deployment Optimization

### 1. CDN Configuration

Optimize static asset delivery:

```javascript
// next.config.js
headers: async () => [
  {
    source: '/_next/static/(.*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
]
```

### 2. Compression

Enable compression for better transfer:

```javascript
// next.config.js
compress: true,
```

### 3. Security Headers

Optimize security without performance impact:

```javascript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
]
```

## 📈 Performance Metrics

### 1. Bundle Size Targets

- **Main bundle**: < 200KB
- **Vendor chunks**: < 300KB each
- **Route chunks**: < 100KB each
- **Total initial load**: < 1MB

### 2. Loading Performance

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms

### 3. Runtime Performance

- **JavaScript execution**: < 100ms
- **Layout calculations**: < 16ms per frame
- **Memory usage**: < 50MB baseline

## 🔍 Optimization Checklist

### Pre-build
- [ ] Analyze current bundle size
- [ ] Identify large dependencies
- [ ] Check for duplicate packages
- [ ] Review import statements

### Build
- [ ] Use performance configuration
- [ ] Enable tree shaking
- [ ] Configure bundle splitting
- [ ] Optimize package imports

### Post-build
- [ ] Analyze bundle output
- [ ] Check chunk sizes
- [ ] Run Lighthouse audit
- [ ] Monitor Core Web Vitals

### Runtime
- [ ] Implement lazy loading
- [ ] Use Suspense boundaries
- [ ] Optimize data fetching
- [ ] Monitor performance metrics

## 🛠️ Tools and Resources

### Bundle Analysis
- `@next/bundle-analyzer` - Bundle size analysis
- `webpack-bundle-analyzer` - Detailed webpack analysis
- `bundle-buddy` - Bundle comparison

### Performance Testing
- Lighthouse - Core Web Vitals
- WebPageTest - Detailed performance analysis
- GTmetrix - Performance monitoring

### Monitoring
- `web-vitals` - Core Web Vitals measurement
- `@sentry/nextjs` - Performance monitoring
- Custom performance metrics

## 📚 Best Practices

1. **Always measure** - Don't optimize without metrics
2. **Start with the biggest wins** - Focus on large bundles first
3. **Test in production** - Performance varies by environment
4. **Monitor over time** - Track performance trends
5. **Optimize incrementally** - Small improvements add up
6. **Consider user experience** - Performance is about perception
7. **Document changes** - Keep track of optimizations
8. **Automate testing** - Include performance in CI/CD

## 🎯 Next Steps

1. Run `npm run analyze` to identify current bottlenecks
2. Implement lazy loading for heavy components
3. Optimize image loading and formats
4. Set up performance monitoring
5. Create performance budgets
6. Automate performance testing
7. Monitor and iterate

Remember: Performance optimization is an ongoing process. Regular monitoring and incremental improvements will lead to the best results.
