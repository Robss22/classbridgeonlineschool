// Example Express.js endpoint
app.post('/api/student/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const studentId = req.user.id; // from JWT token
    
    // Verify current password
    const student = await Student.findById(studentId);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password and mark as changed
    await Student.findByIdAndUpdate(studentId, {
      password: hashedNewPassword,
      isFirstLogin: false,
      passwordChangedAt: new Date()
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});