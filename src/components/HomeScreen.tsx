import { Link } from 'react-router-dom'

export default function HomeScreen() {
    const percentage = 0
    const xp = localStorage.getItem('xp_total') || 0
    const streak = localStorage.getItem('streak_count') || 0

    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mt-4">
                <div>
                    <h1 className="text-sm text-gray-400">Welcome back</h1>
                    <p className="fidel-char text-3xl font-bold mt-1">ጤና ይስጥልኝ</p>
                </div>
                <div className="text-right space-y-1">
                    <div className="text-sm font-semibold bg-surface rounded-full px-3 py-1 flex items-center justify-end gap-2">
                        🔥 {streak} day streak
                    </div>
                    <div className="text-sm font-semibold bg-surface rounded-full px-3 py-1 flex items-center justify-end gap-2">
                        ⭐ {xp} XP
                    </div>
                </div>
            </div>

            <div className="flex justify-center my-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            className="text-gray-700"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                        <circle
                            className="text-accent"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="64"
                            cy="64"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold">{percentage}%</span>
                        <span className="text-xs text-gray-400">Mastery</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link to="/fidel" className="bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span className="text-3xl">ሀ</span>
                    <span className="font-semibold">Fidel</span>
                </Link>
                <Link to="/srs" className="bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span className="text-3xl">📇</span>
                    <span className="font-semibold">Review</span>
                </Link>
                <Link to="/vocab" className="bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span className="text-3xl">📚</span>
                    <span className="font-semibold">Vocab</span>
                </Link>
                <Link to="/grammar" className="bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span className="text-3xl">🧩</span>
                    <span className="font-semibold">Grammar</span>
                </Link>
                <Link to="/dialogue" className="col-span-2 bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span className="text-3xl">💬</span>
                    <span className="font-semibold">Dialogues</span>
                </Link>
            </div>
        </div>
    )
}
