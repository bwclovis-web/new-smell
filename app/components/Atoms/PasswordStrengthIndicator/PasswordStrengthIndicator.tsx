import { useState, useEffect } from 'react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

interface StrengthInfo {
  score: number
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong'
  feedback: string[]
}

export default function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const [strengthInfo, setStrengthInfo] = useState<StrengthInfo | null>(null)

  useEffect(() => {
    if (!password) {
      setStrengthInfo(null)
      return
    }

    // Client-side password strength calculation (simplified version)
    const calculateStrength = (pwd: string): StrengthInfo => {
      const feedback: string[] = []
      let score = 0

      // Length scoring
      if (pwd.length >= 8) score += 1
      else feedback.push('Use at least 8 characters')

      if (pwd.length >= 12) score += 1
      if (pwd.length >= 16) score += 1

      // Character variety scoring
      if (/[a-z]/.test(pwd)) score += 1
      else feedback.push('Add lowercase letters')

      if (/[A-Z]/.test(pwd)) score += 1
      else feedback.push('Add uppercase letters')

      if (/[0-9]/.test(pwd)) score += 1
      else feedback.push('Add numbers')

      if (/[^a-zA-Z0-9]/.test(pwd)) score += 1
      else feedback.push('Add special characters')

      // Pattern penalties
      if (/(.)\1{2,}/.test(pwd)) {
        score -= 1
        feedback.push('Avoid repeated characters')
      }

      if (/123|abc|qwe|asd|zxc/i.test(pwd)) {
        score -= 1
        feedback.push('Avoid common sequences')
      }

      // Determine strength level
      let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong'
      if (score <= 2) strength = 'weak'
      else if (score <= 4) strength = 'fair'
      else if (score <= 6) strength = 'good'
      else if (score <= 8) strength = 'strong'
      else strength = 'very_strong'

      return { score, strength, feedback }
    }

    setStrengthInfo(calculateStrength(password))
  }, [password])

  if (!password || !strengthInfo) {
    return null
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500'
      case 'fair': return 'bg-orange-500'
      case 'good': return 'bg-yellow-500'
      case 'strong': return 'bg-blue-500'
      case 'very_strong': return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return 'Weak'
      case 'fair': return 'Fair'
      case 'good': return 'Good'
      case 'strong': return 'Strong'
      case 'very_strong': return 'Very Strong'
      default: return 'Unknown'
    }
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
    </div>
  )
}

