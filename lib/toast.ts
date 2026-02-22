import toast from 'react-hot-toast';

export const appToast = {
  success: (message: string) => {
    return toast.success(message, {
      style: {
        background: '#10b981',
        color: '#ffffff',
        border: '1px solid #059669',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981',
      },
    });
  },

  error: (message: string) => {
    return toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#ffffff',
        border: '1px solid #dc2626',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#ef4444',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        border: '1px solid #2563eb',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#3b82f6',
      },
    });
  },

  // Specific user-friendly messages
  messages: {
    auth: {
      loginSuccess: 'Welcome back! You have successfully logged in.',
      loginError: 'Login failed. Please check your email and password.',
      signupSuccess: 'Account created successfully! Welcome to DeepStaq.',
      signupError: 'Account creation failed. Please try again.',
      logoutSuccess: 'You have been logged out successfully.',
    },
    settings: {
      alertThresholdsSaved: 'Alert thresholds updated successfully!',
      settingsSaved: 'Settings saved successfully!',
      settingsError: 'Failed to save settings. Please try again.',
    },
    data: {
      loadError: 'Unable to load data. Please refresh the page.',
      saveSuccess: 'Data saved successfully!',
      saveError: 'Failed to save data. Please try again.',
      deleteSuccess: 'Item deleted successfully.',
      deleteError: 'Failed to delete item. Please try again.',
    },
    product: {
      created: 'Product added successfully!',
      updated: 'Product updated successfully!',
      deleted: 'Product deleted successfully.',
      createError: 'Failed to add product. Please try again.',
      updateError: 'Failed to update product. Please try again.',
      deleteError: 'Failed to delete product. Please try again.',
    },
    company: {
      created: 'Company added successfully!',
      updated: 'Company updated successfully!',
      deleted: 'Company deleted successfully.',
      createError: 'Failed to add company. Please try again.',
      updateError: 'Failed to update company. Please try again.',
    },
    unit: {
      created: 'Unit type added successfully!',
      updated: 'Unit type updated successfully!',
      deleted: 'Unit type deleted successfully.',
      createError: 'Failed to add unit type. Please try again.',
      updateError: 'Failed to update unit type. Please try again.',
      deleteError: 'Failed to delete unit type. Please try again.',
    },
  }
};

export default appToast;
