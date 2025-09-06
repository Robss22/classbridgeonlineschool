# Next.js Configuration System

This project uses a sophisticated, environment-aware Next.js configuration system designed for professional development and production deployment.

## 🏗️ Configuration Architecture

### Core Configuration Files

1. **`next.config.js`** - Main configuration (fallback)
2. **`next.config.development.js`** - Development-specific settings
3. **`next.config.production.js`** - Production-specific settings
4. **`next.config.loader.js`** - Automatic configuration loader

## 🚀 Available Scripts

### Development
```bash
npm run dev                    # Standard development server
npm run dev:development        # Development mode with dev config
npm run dev:production         # Development server with production config
```

### Building
```bash
npm run build                  # Standard build
npm run build:development      # Build with development config
npm run build:production       # Build with production config
npm run build:analyze          # Build with bundle analysis
```

### Starting
```bash
npm run start                  # Standard start
npm run start:development      # Start with development config
npm run start:production       # Start with production config
```

## 🔧 Configuration Features

### Security Headers
- **XSS Protection**: `X-XSS-Protection: 1; mode=block`
- **Frame Options**: `X-Frame-Options: DENY`
- **Content Type**: `X-Content-Type-Options: nosniff`
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **CSP**: Comprehensive Content Security Policy
- **Permissions Policy**: Restricts camera, microphone, geolocation, payment

### Performance Optimizations
- **Image Optimization**: WebP, AVIF formats with responsive sizes
- **Bundle Splitting**: Vendor, common, and Supabase-specific chunks
- **Tree Shaking**: Enabled in production builds
- **Caching**: Optimized cache headers for static assets

### Development Features
- **Source Maps**: `eval-source-map` for fast development
- **Hot Reloading**: Optimized for development workflow
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement

## 🌍 Environment Variables

### Development
```bash
NODE_ENV=development
CUSTOM_KEY=your_dev_key
```

### Production
```bash
NODE_ENV=production
CUSTOM_KEY=your_prod_key
```

## 📁 File Structure

```
classbridgeonlineschool/
├── next.config.js              # Main configuration
├── next.config.development.js  # Development settings
├── next.config.production.js   # Production settings
├── next.config.loader.js       # Configuration loader
└── CONFIGURATION.md            # This documentation
```

## 🔄 Automatic Configuration Loading

The system automatically selects the appropriate configuration based on `NODE_ENV`:

1. **Development Mode**: Uses `next.config.development.js`
2. **Production Mode**: Uses `next.config.production.js`
3. **Fallback**: Uses `next.config.js` if specific config not found

## 🛡️ Security Features

### Headers by Route Type
- **Static Assets**: 1-year cache with immutable flag
- **API Routes**: No-cache, API version headers
- **Main Pages**: Full security headers
- **Development**: Minimal headers for faster development

### Content Security Policy
```javascript
"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none';"
```

## 📊 Performance Monitoring

### Bundle Analysis
```bash
npm run build:analyze
```
This will:
1. Build the project with analysis enabled
2. Open bundle analyzer in browser
3. Show chunk sizes and dependencies

### Image Optimization
- **Formats**: WebP, AVIF (with JPEG/PNG fallbacks)
- **Responsive**: Device-specific sizes
- **Caching**: Optimized TTL for production

## 🚨 Troubleshooting

### Common Issues

1. **Configuration Not Loading**
   - Check `NODE_ENV` environment variable
   - Verify configuration file exists
   - Check console for loading messages

2. **Build Errors**
   - Run `npm run type-check` for TypeScript issues
   - Check ESLint with `npm run lint`
   - Verify all dependencies are installed

3. **Performance Issues**
   - Use `npm run build:analyze` to identify large bundles
   - Check image optimization settings
   - Verify caching headers are correct

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=next:config npm run dev
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Environment-specific bundle splitting
- [ ] Advanced caching strategies
- [ ] Performance budget enforcement
- [ ] Automated security scanning
- [ ] Configuration validation

### Experimental Features
- [ ] Server Components external packages
- [ ] Package import optimization
- [ ] Advanced webpack configurations

## 📚 Additional Resources

- [Next.js Configuration Documentation](https://nextjs.org/docs/api-reference/next.config.js)
- [Security Headers Best Practices](https://owasp.org/www-project-secure-headers/)
- [Performance Optimization Guide](https://nextjs.org/docs/advanced-features/performance)
- [Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)

## 🤝 Contributing

When modifying configurations:

1. **Test in development** first
2. **Verify production builds** work correctly
3. **Update documentation** for new features
4. **Follow security best practices**
5. **Maintain backward compatibility**

---

**Note**: This configuration system is designed for professional use. Always test thoroughly before deploying to production.
