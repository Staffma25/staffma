const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      // If user is admin, they have all permissions
      if (req.user.type === 'admin') {
        return next();
      }

      // Check if user has the required permission
      const hasPermission = req.user.permissions?.[module]?.[action];

      if (!hasPermission) {
        return res.status(403).json({
          error: 'You do not have permission to perform this action'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        error: 'Error checking permissions'
      });
    }
  };
};

module.exports = {
  checkPermission
}; 