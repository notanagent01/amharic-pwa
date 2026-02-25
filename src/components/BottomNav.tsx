import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import type { IconName } from '@/components/ui/Icon'

export default function BottomNav() {
    const location = useLocation()

    const navItems: { path: string; icon: IconName | string; label: string; isText?: boolean }[] = [
        { path: '/', icon: 'home', label: 'Home' },
        { path: '/fidel', icon: 'ሀ', label: 'Fidel', isText: true },
        { path: '/srs', icon: 'layers', label: 'Review' },
        { path: '/vocab', icon: 'book-open', label: 'Vocab' },
        { path: '/grammar', icon: 'play', label: 'Grammar' }, // or something else, but play/book-open
        { path: '/dialogue', icon: 'message-circle', label: 'Chat' },
    ]

    return (
        <nav className="fixed bottom-0 w-full backdrop-blur-md bg-surface/90 border-t border-border pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
            <div className="flex justify-around items-center h-16 w-full max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 py-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted hover:text-text'}`}
                        >
                            {item.isText ? (
                                <span className={`text-2xl font-ethiopic leading-none ${isActive ? 'text-primary' : ''}`}>{item.icon}</span>
                            ) : (
                                <Icon name={item.icon as IconName} size={22} className={isActive ? 'text-primary' : ''} />
                            )}
                            <span className="text-[10px] sm:text-xs font-medium leading-none whitespace-nowrap">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
