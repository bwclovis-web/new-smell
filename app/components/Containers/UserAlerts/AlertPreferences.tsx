import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsGear, BsBell, BsEnvelope, BsX } from 'react-icons/bs'

import VooDooDetails from '~/components/Atoms/VooDooDetails/VooDooDetails'
import { Button } from '~/components/Atoms/Button/Button'
import type { UserAlertPreferences } from '~/types/database'

interface AlertPreferencesProps {
  preferences: UserAlertPreferences
  onPreferencesChange: (preferences: Partial<UserAlertPreferences>) => void
}

export const AlertPreferences = ({
  preferences,
  onPreferencesChange
}: AlertPreferencesProps) => {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [tempPreferences, setTempPreferences] = useState(preferences)

  const handleSave = () => {
    onPreferencesChange(tempPreferences)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempPreferences(preferences)
    setIsEditing(false)
  }

  const updatePreference = (key: keyof UserAlertPreferences, value: boolean | number) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <VooDooDetails
      summary={
        <div className="flex items-center gap-2">
          <BsGear className="h-4 w-4" />
          {t('alerts.preferences', 'Alert Preferences')}
        </div>
      }
      className="text-start"
      name="alert-preferences"
    >
      <div className="p-4 space-y-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {t('alerts.preferencesDescription', 'Configure how and when you receive alerts.')}
            </div>

            {/* Alert Types */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <BsBell className="h-4 w-4" />
                {t('alerts.alertTypes', 'Alert Types')}
              </h4>

              <div className="space-y-2 ml-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tempPreferences.wishlistAlertsEnabled}
                    onChange={(e) => updatePreference('wishlistAlertsEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {t('alerts.wishlistAlerts', 'Wishlist Alerts')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('alerts.wishlistAlertsDescription', 'Get notified when items from your wishlist become available for trade')}
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tempPreferences.decantAlertsEnabled}
                    onChange={(e) => updatePreference('decantAlertsEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {t('alerts.decantAlerts', 'Decant Interest Alerts')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('alerts.decantAlertsDescription', 'Get notified when someone shows interest in your decants')}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <BsEnvelope className="h-4 w-4" />
                {t('alerts.emailNotifications', 'Email Notifications')}
              </h4>

              <div className="space-y-2 ml-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tempPreferences.emailWishlistAlerts}
                    onChange={(e) => updatePreference('emailWishlistAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {t('alerts.emailWishlistAlerts', 'Email Wishlist Alerts')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('alerts.emailWishlistAlertsDescription', 'Receive email notifications for wishlist alerts')}
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={tempPreferences.emailDecantAlerts}
                    onChange={(e) => updatePreference('emailDecantAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {t('alerts.emailDecantAlerts', 'Email Decant Alerts')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('alerts.emailDecantAlertsDescription', 'Receive email notifications for decant interest alerts')}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Alert Limits */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {t('alerts.alertLimits', 'Alert Limits')}
              </h4>

              <div className="ml-6">
                <label className="block">
                  <div className="font-medium text-gray-900 mb-1">
                    {t('alerts.maxAlerts', 'Maximum Alerts to Keep')}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {t('alerts.maxAlertsDescription', 'Older alerts will be automatically dismissed when this limit is reached')}
                  </div>
                  <select
                    value={tempPreferences.maxAlerts}
                    onChange={(e) => updatePreference('maxAlerts', parseInt(e.target.value))}
                    className="rounded border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5 alerts</option>
                    <option value={10}>10 alerts</option>
                    <option value={20}>20 alerts</option>
                    <option value={50}>50 alerts</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                Save Preferences
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <BsX className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('alerts.preferencesDescription', 'Configure how and when you receive alerts.')}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <BsGear className="h-4 w-4" />
                Edit
              </Button>
            </div>

            {/* Current Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <BsBell className="h-4 w-4" />
                  {t('alerts.alertTypes', 'Alert Types')}
                </h4>

                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t('alerts.wishlistAlerts', 'Wishlist Alerts')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${preferences.wishlistAlertsEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {preferences.wishlistAlertsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t('alerts.decantAlerts', 'Decant Interest Alerts')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${preferences.decantAlertsEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {preferences.decantAlertsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <BsEnvelope className="h-4 w-4" />
                  {t('alerts.emailNotifications', 'Email Notifications')}
                </h4>

                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t('alerts.emailWishlistAlerts', 'Email Wishlist Alerts')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${preferences.emailWishlistAlerts
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {preferences.emailWishlistAlerts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t('alerts.emailDecantAlerts', 'Email Decant Alerts')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${preferences.emailDecantAlerts
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {preferences.emailDecantAlerts ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t('alerts.maxAlerts', 'Max Alerts')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {preferences.maxAlerts}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VooDooDetails>
  )
}

export default AlertPreferences
