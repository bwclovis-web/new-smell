import { useState } from 'react'
import { Form } from 'react-router-dom'

import { Button } from '~/components/Atoms/Button/Button'
import PasswordStrengthIndicator from '~/components/Atoms/PasswordStrengthIndicator/PasswordStrengthIndicator'

interface ChangePasswordFormProps {
  actionData?: any
  isSubmitting?: boolean
  className?: string
}

export default function ChangePasswordForm({ actionData, isSubmitting = false, className = '' }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Remove the handleSubmit function since we're using React Router's Form

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const passwordsMatch = formData.newPassword === formData.confirmNewPassword
  const isFormValid = formData.currentPassword && formData.newPassword && formData.confirmNewPassword && passwordsMatch

  return (
    <Form method="post" className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
        <p className="text-gray-600">Update your password to keep your account secure.</p>
      </div>

      {/* Current Password */}
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your current password"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your new password"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {formData.newPassword && (
          <div className="mt-2">
            <PasswordStrengthIndicator password={formData.newPassword} />
          </div>
        )}
      </div>

      {/* Confirm New Password */}
      <div>
        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            id="confirmNewPassword"
            name="confirmNewPassword"
            value={formData.confirmNewPassword}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formData.confirmNewPassword && !passwordsMatch
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
              }`}
            placeholder="Confirm your new password"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Password Match Indicator */}
        {formData.confirmNewPassword && (
          <div className="mt-1 text-sm">
            {passwordsMatch ? (
              <span className="text-green-600 flex items-center space-x-1">
                <span>✅</span>
                <span>Passwords match</span>
              </span>
            ) : (
              <span className="text-red-600 flex items-center space-x-1">
                <span>❌</span>
                <span>Passwords do not match</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{actionData.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{actionData.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• At least 8 characters long</li>
          <li>• Contains uppercase and lowercase letters</li>
          <li>• Contains at least one number</li>
          <li>• Contains at least one special character (!@#$%^&*)</li>
          <li>• No spaces allowed</li>
          <li>• Different from your current password</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear
        </button>
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="px-6 py-2"
        >
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </Button>
      </div>
    </Form>
  )
}
