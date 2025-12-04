import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BsBell, BsEnvelope, BsGear, BsX } from "react-icons/bs"

import { Button } from "~/components/Atoms/Button/Button"
import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"
import type { UserAlertPreferences } from "~/types/database"

interface AlertPreferencesProps {
  preferences: UserAlertPreferences
  onPreferencesChange: (preferences: Partial<UserAlertPreferences>) => void
}

interface CheckboxFieldProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}

const CheckboxField = ({
  id,
  checked,
  onChange,
  label,
  description,
}: CheckboxFieldProps) => (
  <label className="flex items-center gap-3" htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      aria-label={label}
    />
    <div>
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
  </label>
)

interface StatusBadgeProps {
  enabled?: boolean
  value?: number
}

const StatusBadge = ({ enabled, value }: StatusBadgeProps) => {
  if (value !== undefined) {
    return (
      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
        {value}
      </span>
    )
  }
  return (
    <span
      className={`text-xs px-2 py-1 rounded ${
        enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  )
}

export const AlertPreferences = ({
  preferences,
  onPreferencesChange,
}: AlertPreferencesProps) => {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [tempPreferences, setTempPreferences] = useState(preferences)

  useEffect(() => {
    setTempPreferences(preferences)
  }, [preferences])

  const handleSave = () => {
    onPreferencesChange(tempPreferences)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempPreferences(preferences)
    setIsEditing(false)
  }

  const updatePreference = (
    key: keyof UserAlertPreferences,
    value: boolean | number
  ) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <VooDooDetails
      summary={t("alerts.preferences", "Alert Preferences")}
      className="justify-around text-noir-gold"
      name="alert-preferences"
    >
      <div className="p-4 space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="text-sm text-noir-gold-100 mb-4">
              {t(
                "alerts.preferencesDescription",
                "Configure how and when you receive alerts."
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <BsBell className="h-4 w-4" />
                {t("alerts.alertTypes", "Alert Types")}
              </h4>

              <div className="space-y-2 ml-6">
                <CheckboxField
                  id="wishlist-alerts"
                  checked={tempPreferences.wishlistAlertsEnabled}
                  onChange={checked => updatePreference("wishlistAlertsEnabled", checked)}
                  label={t("alerts.wishlistAlerts", "Wishlist Alerts")}
                  description={t(
                    "alerts.wishlistAlertsDescription",
                    "Get notified when items from your wishlist become available for trade"
                  )}
                />

                <CheckboxField
                  id="decant-alerts"
                  checked={tempPreferences.decantAlertsEnabled}
                  onChange={checked => updatePreference("decantAlertsEnabled", checked)}
                  label={t("alerts.decantAlerts", "Decant Interest Alerts")}
                  description={t(
                    "alerts.decantAlertsDescription",
                    "Get notified when someone shows interest in your decants"
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <BsEnvelope className="h-4 w-4" />
                {t("alerts.emailNotifications", "Email Notifications")}
              </h4>

              <div className="space-y-2 ml-6">
                <CheckboxField
                  id="email-wishlist-alerts"
                  checked={tempPreferences.emailWishlistAlerts}
                  onChange={checked => updatePreference("emailWishlistAlerts", checked)}
                  label={t("alerts.emailWishlistAlerts", "Email Wishlist Alerts")}
                  description={t(
                    "alerts.emailWishlistAlertsDescription",
                    "Receive email notifications for wishlist alerts"
                  )}
                />

                <CheckboxField
                  id="email-decant-alerts"
                  checked={tempPreferences.emailDecantAlerts}
                  onChange={checked => updatePreference("emailDecantAlerts", checked)}
                  label={t("alerts.emailDecantAlerts", "Email Decant Alerts")}
                  description={t(
                    "alerts.emailDecantAlertsDescription",
                    "Receive email notifications for decant interest alerts"
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                {t("alerts.alertLimits", "Alert Limits")}
              </h4>

              <div className="ml-6">
                <label className="block" htmlFor="max-alerts">
                  <div className="font-medium text-gray-900 mb-1">
                    {t("alerts.maxAlerts", "Maximum Alerts to Keep")}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {t(
                      "alerts.maxAlertsDescription",
                      "Older alerts will be automatically dismissed when this limit is reached"
                    )}
                  </div>
                  <select
                    id="max-alerts"
                    value={tempPreferences.maxAlerts}
                    onChange={e => updatePreference("maxAlerts", parseInt(e.target.value, 10))}
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

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save Preferences
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                leftIcon={<BsX className="h-4 w-4" />}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t(
                  "alerts.preferencesDescription",
                  "Configure how and when you receive alerts."
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<BsGear className="h-4 w-4" />}
              >
                Edit
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <BsBell className="h-4 w-4" />
                  {t("alerts.alertTypes", "Alert Types")}
                </h4>

                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t("alerts.wishlistAlerts", "Wishlist Alerts")}
                    </span>
                    <StatusBadge enabled={preferences.wishlistAlertsEnabled} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t("alerts.decantAlerts", "Decant Interest Alerts")}
                    </span>
                    <StatusBadge enabled={preferences.decantAlertsEnabled} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <BsEnvelope className="h-4 w-4" />
                  {t("alerts.emailNotifications", "Email Notifications")}
                </h4>

                <div className="space-y-2 ml-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t("alerts.emailWishlistAlerts", "Email Wishlist Alerts")}
                    </span>
                    <StatusBadge enabled={preferences.emailWishlistAlerts} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t("alerts.emailDecantAlerts", "Email Decant Alerts")}
                    </span>
                    <StatusBadge enabled={preferences.emailDecantAlerts} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {t("alerts.maxAlerts", "Max Alerts")}
                    </span>
                    <StatusBadge value={preferences.maxAlerts} />
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
