import { createClient } from '@supabase/supabase-js';
import express, { Request, Response, NextFunction } from 'express';
import { Database } from '../../../database.types'; // Path to root database.types.ts

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const router = express.Router();

// Middleware to check if password change is required
export const requirePasswordChange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user from Supabase Auth using JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1]
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query users table for password_changed status
    const { data, error } = await supabase
      .from('users')
      .select('password_changed')
      .eq('auth_user_id', user.id)
      .single();

    if (error || !data) {
      return res.status(500).json({ error: 'Failed to check user status' });
    }

    if (!data.password_changed) {
      return res.status(403).json({
        error: 'Password change required',
        redirect: '/api/student/change-password'
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Endpoint to handle password change
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    // Get user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.split(' ')[1]
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Update password_changed flag in users table
    const { error: dbError } = await supabase
      .from('users')
      .update({ password_changed: true })
      .eq('auth_user_id', user.id);

    if (dbError) {
      return res.status(500).json({ error: 'Failed to update user status' });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Protected route (student dashboard)
router.get('/dashboard', requirePasswordChange, (req: Request, res: Response) => {
  res.json({ message: 'Access granted to student dashboard' });
});

export default router;