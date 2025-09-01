import { supabase } from '@/lib/supabaseClient';

class UserService {
  /**
   * Fetch all users with proper authentication and authorization
   */
  async fetchAllUsers() {
    try {
      // Verify authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        throw new Error('Authentication required');
      }

      // Verify admin role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !userProfile || userProfile.role !== 'admin') {
        throw new Error('Admin privileges required');
      }

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      return this.transformUsers(users || []);
    } catch (error) {
      throw new Error(`User fetch failed: ${error.message}`);
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId, updates) {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle user status (active/inactive)
   */
  async toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    return await this.updateUser(userId, { status: newStatus });
  }

  /**
   * Change user password via secure API endpoint
   */
  async changeUserPassword(userId, newPassword) {
    try {
      const response = await fetch('/api/admin/change-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Password change failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Transform raw user data to consistent format
   */
  transformUsers(users) {
    return users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      status: user.status,
      created_at: user.created_at,
      teacher_id: user.role === 'teacher' ? user.teacher_id : null,
      user_id: user.id,
    }));
  }

  /**
   * Get user statistics
   */
  getUserStats(users) {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    };
  }
}

export const userService = new UserService();
