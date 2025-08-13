const isProd = process.env.NODE_ENV === 'production';

// Detect Supabase storage host for Next/Image remote patterns
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
let supabaseHost = '';
try {
	if (supabaseUrl) {
		supabaseHost = new URL(supabaseUrl).host;
	}
} catch {}

const baseConfig = {
	images: {
		remotePatterns: supabaseHost
			? [
				{
					protocol: 'https',
					hostname: supabaseHost,
					pathname: '/storage/v1/object/public/**',
				},
			]
			: [],
	},
};

/** @type {import('next').NextConfig} */
const nextConfig = isProd
  ? {
		...baseConfig,
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
  : {
		...baseConfig,
	};

export default nextConfig;
