import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/ToastProvider'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface TestWrapperProps {
  children: React.ReactNode
}

function TestWrapper({ children }: TestWrapperProps) {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { wrapper: CustomWrapper, ...renderOptions } = options
  
  const Wrapper = CustomWrapper || TestWrapper
  
  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock Supabase client for tests
export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null,
        })),
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
  auth: {
    getSession: jest.fn(() => ({
      data: { session: null },
      error: null,
    })),
    signOut: jest.fn(() => ({
      error: null,
    })),
  },
}

// Mock data for tests
export const mockLiveClass = {
  live_class_id: 'test-id',
  title: 'Test Class',
  description: 'Test Description',
  scheduled_date: '2024-01-01',
  start_time: '10:00:00',
  end_time: '11:00:00',
  status: 'scheduled',
  meeting_link: null,
  meeting_platform: null,
  created_by: 'teacher-id',
  subject_id: 'subject-id',
}

export const mockResource = {
  resource_id: 'test-resource-id',
  title: 'Test Resource',
  description: 'Test Description',
  resource_type: 'document',
  file_url: 'https://example.com/file.pdf',
  subject_id: 'subject-id',
  level_id: 'level-id',
  created_by: 'teacher-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockStudent = {
  id: 'student-id',
  email: 'student@example.com',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  role: 'student',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
