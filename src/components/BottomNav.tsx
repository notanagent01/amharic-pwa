import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
    const location = useLocation()

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/fidel', icon: 'ሀ', label: 'Fidel' },
        { path: '/srs', icon: '📇', label: 'Review' },
        { path: '/vocab', icon: '📚', label: 'Vocab' },
        { path: '/grammar', icon: '🧩', label: 'Grammar' },
        { path: '/dialogue', icon: '💬', label: 'Chat' },
    ]

    return (
        <nav className="fixed bottom-0 w-full bg-[#1a1a2e] border-t border-gray-800 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <span className="text-xl leading-none">{item.icon}</span>
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
