# ClassBridge Online School Platform

A comprehensive educational management system built with Next.js, TypeScript, and Supabase.

## 🚀 Features

- **Multi-role Authentication**: Admin, Teacher, and Student portals
- **Content Management**: Resources, assessments, and assignments
- **Real-time Messaging**: Integrated communication system
- **File Management**: Secure file upload/download with Supabase Storage
- **Role-based Access Control**: Granular permissions and security
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏗️ Architecture

```
classbridgeonlineschool/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard and management
│   ├── teachers/          # Teacher portal and tools
│   ├── students/          # Student portal and content
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── contexts/              # React Context providers
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── supabase/              # Supabase configuration and functions
└── scripts/               # Database migration and utility scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd classbridgeonlineschool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Database Setup**
   - Run the SQL migration scripts in `supabase/` directory
   - Set up Row Level Security (RLS) policies
   - Configure storage buckets

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages

### Component Structure
```typescript
// components/ExampleComponent.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ExampleComponentProps {
  title: string;
  children?: React.ReactNode;
}

export default function ExampleComponent({ title, children }: ExampleComponentProps) {
  const { user } = useAuth();
  
  return (
    <div className="p-4">
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

### Error Handling
```typescript
import { errorHandler } from '@/lib/errorHandler';

try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
} catch (error) {
  const appError = errorHandler.handleSupabaseError(error, 'fetch_data', user?.id);
  // Handle error appropriately
}
```

### Caching
```typescript
import { cache } from '@/lib/cache';

// Cache frequently accessed data
const cachedData = cache.get('key');
if (!cachedData) {
  const data = await fetchData();
  cache.set('key', data, 5 * 60 * 1000); // 5 minutes
}
```

## 📊 Database Schema

### Core Tables
- `users`: User profiles and authentication
- `teachers`: Teacher-specific data
- `students`: Student enrollment and progress
- `programs`: Educational programs
- `levels`: Academic levels within programs
- `subjects`: Course subjects
- `teacher_assignments`: Teacher-subject-level assignments
- `resources`: Educational materials
- `assessments`: Tests and assignments
- `messages`: Communication system

### Security
- Row Level Security (RLS) policies
- Role-based access control
- Secure file uploads
- Input validation and sanitization

## 🔒 Security Features

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security (RLS)
- **File Security**: Secure storage with access controls
- **Input Validation**: Server-side validation
- **Rate Limiting**: API request throttling
- **Security Headers**: XSS and CSRF protection

## 📈 Performance Optimization

- **Caching**: In-memory cache for frequent data
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Webpack bundle analyzer
- **Database Indexing**: Optimized queries

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check environment variables
   - Verify Supabase configuration
   - Clear browser cache

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Review database logs

3. **File Upload Failures**
   - Check storage bucket permissions
   - Verify file size limits
   - Review CORS settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs` directory
