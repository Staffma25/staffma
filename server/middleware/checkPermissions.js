const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // Get user from request (set by auth middleware)
      const user = req.user;

      if (!user) {
        console.log('No user found in request');
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log('Checking permissions for user:', {
        userId: user._id,
        role: user.role,
        permissions: user.permissions,
        requiredPermissions
      });

      // Check if user has the required permissions
      const hasPermission = requiredPermissions.every(permission => {
        const [module, action] = permission.split('.');
        return user.permissions[module] && user.permissions[module][action];
      });

      if (!hasPermission) {
        console.log('Permission check failed:', {
          userId: user._id,
          role: user.role,
          requiredPermissions,
          userPermissions: user.permissions
        });
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: 'You do not have the required permissions to perform this action'
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

// Helper functions for common permission checks
const canViewEmployees = checkPermissions(['employees.view']);
const canCreateEmployees = checkPermissions(['employees.create']);
const canEditEmployees = checkPermissions(['employees.edit']);
const canDeleteEmployees = checkPermissions(['employees.delete']);

const canViewPerformance = checkPermissions(['performance.view']);
const canCreatePerformance = checkPermissions(['performance.create']);
const canEditPerformance = checkPermissions(['performance.edit']);
const canDeletePerformance = checkPermissions(['performance.delete']);

const canViewPayroll = checkPermissions(['payroll.view']);
const canCreatePayroll = checkPermissions(['payroll.create']);
const canEditPayroll = checkPermissions(['payroll.edit']);
const canDeletePayroll = checkPermissions(['payroll.delete']);

const canViewUsers = checkPermissions(['users.view']);
const canCreateUsers = checkPermissions(['users.create']);
const canEditUsers = checkPermissions(['users.edit']);
const canDeleteUsers = checkPermissions(['users.delete']);

module.exports = {
  checkPermissions,
  canViewEmployees,
  canCreateEmployees,
  canEditEmployees,
  canDeleteEmployees,
  canViewPerformance,
  canCreatePerformance,
  canEditPerformance,
  canDeletePerformance,
  canViewPayroll,
  canCreatePayroll,
  canEditPayroll,
  canDeletePayroll,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers
}; 