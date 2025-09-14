import { usePasswordStrength } from '~/hooks'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  minScore?: number
}

export default function PasswordStrengthIndicator({
  password,
  className = '',
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumbers = true,
  requireSpecialChars = true,
  minScore = 3
}: PasswordStrengthIndicatorProps) {
  const { strengthInfo, isValid, getStrengthColor, getStrengthText } =
    usePasswordStrength(password, {
      minLength,
      requireUppercase,
      requireLowercase,
      requireNumbers,
      requireSpecialChars,
      minScore
    })

  if (!password || !strengthInfo) {
    return null
  }

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'weak': return '🔴'
      case 'fair': return '🟠'
      case 'good': return '🟡'
      case 'strong': return '🔵'
      case 'very_strong': return '🟢'
      default: return '⚪'
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strengthInfo.strength)}`}
            style={{ width: `${Math.min(100, (strengthInfo.score / 8) * 100)}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 flex items-center space-x-1">
          <span>{getStrengthIcon(strengthInfo.strength)}</span>
          <span>{getStrengthText(strengthInfo.strength)}</span>
        </span>
      </div>

      {/* Feedback Messages */}
      {strengthInfo.feedback.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {strengthInfo.feedback.map((message, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span className="text-red-500">•</span>
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Security Recommendations */}
      {strengthInfo.strength === 'very_strong' && (
        <div className="text-xs text-green-600 flex items-center space-x-1">
          <span>✅</span>
          <span>Excellent password strength!</span>
        </div>
      )}

      {/* Validation Status */}
      {isValid && (
        <div className="text-xs text-green-600 flex items-center space-x-1">
          <span>✅</span>
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  )
}
