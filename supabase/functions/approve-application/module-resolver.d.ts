// Comprehensive module resolver for Deno imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/resend@3.2.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: any): Promise<any>;
    };
  }
  export * from "resend";
}

// Generic fallback for any Deno imports
declare module "https://*" {
  const content: any;
  export = content;
  export default content;
}

// Additional global types for Deno
declare global {
  interface Request {
    method: string;
    json(): Promise<any>;
  }
  
  interface Response {
    status: number;
    headers: Record<string, string>;
  }
}
