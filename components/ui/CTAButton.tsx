import Link from 'next/link'

import { APP_CONFIG } from '@/lib/shared/config'
import { cn } from '@/lib/shared/utils/ui'

interface CTAButtonProps {
  variant: 'primary' | 'secondary'
  size?: 'default' | 'large'
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

export function CTAButton({ 
  variant, 
  size = 'default', 
  children, 
  href, 
  onClick, 
  className 
}: CTAButtonProps) {
  const baseClasses = cn(
    APP_CONFIG.UI.BUTTON.CTA_BASE,
    variant === 'primary' ? APP_CONFIG.UI.BUTTON.PRIMARY : APP_CONFIG.UI.BUTTON.SECONDARY,
    size === 'large' && APP_CONFIG.UI.BUTTON.CTA_RESPONSIVE,
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {children}
    </button>
  )
}