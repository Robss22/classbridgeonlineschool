import supabaseAdmin from '@/lib/supabaseAdmin';

export async function requireAuthUserIdFromBearer(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) throw new Error('Invalid or expired token');
  return data.user.id;
}

export async function requireAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !data || data.role !== 'admin') throw new Error('Insufficient privileges');
}

