const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = isProd
  ? {
      webpack: (config) => {
        // Suppress Supabase realtime-js dynamic require warning (prod only)
        config.ignoreWarnings = config.ignoreWarnings || [];
        config.ignoreWarnings.push((warning) => {
          const isCriticalExpr =
            typeof warning.message === 'string' &&
            warning.message.includes(
              'Critical dependency: the request of a dependency is an expression'
            );
          const isSupabaseRealtime =
            warning.module &&
            warning.module.resource &&
            /@supabase[\\\/]realtime-js[\\\/]dist[\\\/]module[\\\/]lib[\\\/]websocket-factory\.js$/.test(
              warning.module.resource
            );
          return isCriticalExpr && isSupabaseRealtime;
        });
        return config;
      },
    }
  : {};

export default nextConfig;
