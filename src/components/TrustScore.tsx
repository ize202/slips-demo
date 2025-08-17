interface TrustScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function TrustScore({ score, size = 'md' }: TrustScoreProps) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-24 bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`font-semibold ${sizeClasses[size]}`}>{score}</span>
    </div>
  )
}