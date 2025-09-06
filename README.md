# ClassBridge Online School

A modern, high-performance online learning platform built with Next.js 14, React 18, and Supabase.

## 🚀 Features

- **Modern Architecture**: Built with Next.js 14 App Router and React 18
- **High Performance**: Optimized bundle splitting and code splitting
- **Type Safety**: Full TypeScript support with strict configuration
- **Real-time**: Supabase integration for live updates
- **Responsive**: Mobile-first design with Tailwind CSS
- **SEO Optimized**: Server-side rendering and metadata optimization

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **State Management**: TanStack React Query
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React, React Icons
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+ or yarn
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd classbridgeonlineschool
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build Commands

### Development
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Production Builds
```bash
npm run build                    # Standard production build
npm run build:performance        # Performance-optimized build
npm run build:optimized         # Clean + performance build
npm run build:analyze           # Build with bundle analysis
```

### Performance Analysis
```bash
npm run analyze                  # Analyze bundle size
npm run analyze:performance      # Analyze performance build
npm run performance:check        # Build + Lighthouse audit
npm run performance:lighthouse  # Run Lighthouse audit
```

### Deployment
```bash
npm run deploy:production        # Production deployment
npm run deploy:performance       # Performance-optimized deployment
```

## 📊 Performance Optimization

This project includes several performance optimizations:

### Bundle Splitting
- **Vendor chunks**: Node modules separated by category
- **React chunks**: React and React DOM isolated
- **Supabase chunks**: Database client optimized
- **Utility chunks**: Common utilities bundled together
- **Icon chunks**: Icon libraries optimized

### Code Splitting
- Dynamic imports for route-based splitting
- Component-level lazy loading
- Suspense boundaries for better UX

### Webpack Optimizations
- Tree shaking enabled
- Module concatenation
- Advanced chunk splitting
- Performance budgets (500KB per chunk)

### Image Optimization
- WebP and AVIF formats
- Automatic optimization
- Lazy loading
- Responsive images

## 🔧 Configuration Files

- `next.config.js` - Main Next.js configuration
- `next.config.performance.js` - Performance-optimized configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.eslintrc.json` - ESLint configuration

## 📁 Project Structure

```
classbridgeonlineschool/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   └── [routes]/          # Route directories
├── components/             # Reusable components
│   ├── ui/                # UI components
│   ├── layout/            # Layout components
│   └── [feature]/         # Feature-specific components
├── lib/                    # Utility libraries
├── utils/                  # Helper functions
├── types/                  # TypeScript type definitions
├── supabase/               # Supabase configuration
└── public/                 # Static assets
```

## 🚀 Performance Best Practices

### 1. Bundle Size Management
- Keep chunks under 500KB
- Use dynamic imports for large components
- Optimize third-party libraries

### 2. Image Optimization
- Use Next.js Image component
- Implement lazy loading
- Choose appropriate formats (WebP/AVIF)

### 3. Code Splitting
- Route-based splitting
- Component-level splitting
- Suspense boundaries

### 4. Caching Strategy
- Static assets: 1 year
- API routes: No cache
- Dynamic content: Appropriate TTL

## 🔍 Monitoring & Analytics

### Bundle Analysis
```bash
npm run analyze
# Opens bundle analyzer in browser
```

### Performance Monitoring
```bash
npm run performance:check
# Runs Lighthouse audit and generates report
```

### Type Checking
```bash
npm run type-check
# Ensures type safety across the project
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   npm run clean:all
   npm install
   npm run build
   ```

2. **Type Errors**
   ```bash
   npm run type-check
   npm run lint:fix
   ```

3. **Performance Issues**
   ```bash
   npm run analyze
   npm run performance:check
   ```

### Performance Issues

- **Large bundles**: Use `npm run analyze` to identify large dependencies
- **Slow builds**: Use `npm run build:performance` for optimized builds
- **Runtime performance**: Check Lighthouse scores with `npm run performance:lighthouse`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.
