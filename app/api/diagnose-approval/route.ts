import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Start diagnosis
    
    type TestStatus = 'SUCCESS' | 'FAILED' | 'EXCEPTION'
    interface ConnectivityDiag { status: TestStatus; message?: string; error?: string; code?: string; details?: unknown; stack?: string | undefined }
    interface TableDiag { status: TestStatus; columns?: string[]; sampleData?: unknown; error?: string; code?: string }
    interface EdgeFuncDiag { status: TestStatus; response?: unknown; error?: string; details?: unknown }
    interface Diagnostics {
      timestamp: string;
      environment: { hasSupabaseUrl: boolean; hasServiceRoleKey: boolean; supabaseUrl?: string };
      database: { connectivity?: ConnectivityDiag; applicationsTable?: TableDiag; usersTable?: TableDiag };
      edgeFunction: { test?: EdgeFuncDiag };
    }

    const diagnostics: Diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      },
      database: {},
      edgeFunction: {}
    };

    // Test 1: Basic database connectivity
    try {
      // Test 1: Basic database connectivity
      const { error: testError } = await supabaseAdmin
        .from('applications')
        .select('count')
        .limit(1);
      
      if (testError) {
        diagnostics.database.connectivity = {
          status: 'FAILED',
          error: testError.message,
          code: testError.code,
          details: testError.details
        };
      } else {
        diagnostics.database.connectivity = {
          status: 'SUCCESS',
          message: 'Database connection working'
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorStack = err instanceof Error ? err.stack : undefined;
      diagnostics.database.connectivity = {
        status: 'EXCEPTION',
        error: errorMessage,
        stack: errorStack
      };
    }

    // Test 2: Check applications table structure
    try {
      // Test 2: Applications table structure
      const { data: appData, error: appError } = await supabaseAdmin
        .from('applications')
        .select('*')
        .limit(1);
      
      if (appError) {
        diagnostics.database.applicationsTable = {
          status: 'FAILED',
          error: appError.message,
          code: appError.code
        };
      } else {
        diagnostics.database.applicationsTable = {
          status: 'SUCCESS',
          columns: appData && appData.length > 0 ? Object.keys(appData[0]) : [],
          sampleData: appData && appData.length > 0 ? appData[0] : null
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.database.applicationsTable = {
        status: 'EXCEPTION',
        error: errorMessage
      };
    }

    // Test 3: Check users table structure
    try {
      // Test 3: Users table structure
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);
      
      if (userError) {
        diagnostics.database.usersTable = {
          status: 'FAILED',
          error: userError.message,
          code: userError.code
        };
      } else {
        diagnostics.database.usersTable = {
          status: 'SUCCESS',
          columns: userData && userData.length > 0 ? Object.keys(userData[0]) : [],
          sampleData: userData && userData.length > 0 ? userData[0] : null
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.database.usersTable = {
        status: 'EXCEPTION',
        error: errorMessage
      };
    }

    // Test 4: Edge Function test
    try {
      // Test 4: Edge Function test
      const { data: funcData, error: funcError } = await supabaseAdmin.functions.invoke('approve-application', {
        body: { test_mode: true }
      });
      
      if (funcError) {
        diagnostics.edgeFunction.test = {
          status: 'FAILED',
          error: funcError.message,
          details: funcError.details
        };
      } else {
        diagnostics.edgeFunction.test = {
          status: 'SUCCESS',
          response: funcData
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.edgeFunction.test = {
        status: 'EXCEPTION',
        error: errorMessage
      };
    }

    // Diagnosis complete
    
    return NextResponse.json({
      success: true,
      diagnostics,
      summary: {
        databaseWorking: diagnostics.database.connectivity?.status === 'SUCCESS',
        applicationsTableWorking: diagnostics.database.applicationsTable?.status === 'SUCCESS',
        usersTableWorking: diagnostics.database.usersTable?.status === 'SUCCESS',
        edgeFunctionWorking: diagnostics.edgeFunction.test?.status === 'SUCCESS'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}
