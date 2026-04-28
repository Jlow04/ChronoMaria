/**
 * Get the current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (err) {
    console.error('Error parsing user data:', err);
  }
  return null;
};

/**
 * Check if the current user is a Super Admin
 */
export const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'Super Admin';
};

/**
 * Get the department filter for API calls
 * Returns the user's department_name if not a super admin, null otherwise
 * This is used to filter faculty, subjects by department
 */
export const getDepartmentFilter = () => {
  const user = getCurrentUser();

  // Super admins see all departments
  if (user?.role === 'Super Admin') {
    return null;
  }

  // Regular users see only their department
  return user?.department_name || null;
};

/**
 * Get the user's department name
 */
export const getUserDepartmentName = () => {
  const user = getCurrentUser();
  return user?.department_name || null;
};

/**
 * Get the user's department program
 */
export const getUserDepartmentProgram = () => {
  const user = getCurrentUser();
  return user?.department_program || null;
};


