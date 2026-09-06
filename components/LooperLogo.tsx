import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin'], weight: '900' })

export default function LooperLogo({
  variant = 'blue',
  className = '',
}: {
  variant?: 'blue' | 'white'
  className?: string
}) {
  const color = variant === 'blue' ? '#1a73e8' : '#fcfcfd'

  return (
    <svg viewBox="0 0 723 176" className={`${montserrat.className} ${className}`} fill={color}>
      <path
        d="M 88 132.50 L 138.57 132.50 A 46.07 48.50 0 0 0 174.88 113.86 L 225.36 54.14 A 46.07 48.50 0 1 1 225.36 113.86 L 174.88 54.14 A 46.07 48.50 0 0 0 92.54 85.98"
        fill="none"
        stroke={color}
        strokeWidth="35"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <text x="4" y="150" fontWeight={900} fontSize={188}>L</text>
      <text x="331.24" y="150" fontWeight={900} fontSize={188} letterSpacing="-6">PER</text>
    </svg>
  )
}
