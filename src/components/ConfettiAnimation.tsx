import { useEffect, useState } from 'react'

export default function ConfettiAnimation({ onComplete }: { onComplete?: () => void }) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            onComplete?.()
        }, 2000)
        return () => clearTimeout(timer)
    }, [onComplete])

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <svg width="400" height="400" viewBox="0 0 400 400" className="opacity-90">
                <style>
                    {`
            @keyframes fly {
              0% { transform: translate(200px, 200px) scale(0); opacity: 1; }
              80% { opacity: 1; }
              100% { transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(var(--rot)); opacity: 0; }
            }
            .particle {
              animation: fly 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
              transform-origin: center;
            }
          `}
                </style>
                {Array.from({ length: 40 }).map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5)
                    const distance = 100 + Math.random() * 150
                    const tx = 200 + Math.cos(angle) * distance
                    const ty = 200 + Math.sin(angle) * distance
                    const rot = Math.random() * 360

                    const colors = ['#e94560', '#ffd166', '#06d6a0', '#118ab2', '#a05195']
                    const color = colors[Math.floor(Math.random() * colors.length)]

                    return (
                        <rect
                            key={i}
                            x="-5"
                            y="-5"
                            width="10"
                            height="10"
                            fill={color}
                            className="particle"
                            style={
                                {
                                    '--tx': `${tx}px`,
                                    '--ty': `${ty}px`,
                                    '--rot': `${rot}deg`,
                                    animationDelay: `${Math.random() * 0.2}s`
                                } as React.CSSProperties
                            }
                        />
                    )
                })}
            </svg>
        </div>
    )
}
