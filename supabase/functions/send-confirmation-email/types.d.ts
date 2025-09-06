// Deno types for Edge Functions
declare module "https://deno.land/std@0.192.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "npm:resend@4.6.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: {
        from: string;
        to: string;
        subject: string;
        html: string;
      }): Promise<{ id: string }>;
    };
  }
}

// Global Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}
