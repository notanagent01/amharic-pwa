export default function SettingsScreen() {
    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="bg-[#1a1a2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="font-semibold">Dark Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                </div>

                <hr className="border-gray-700" />

                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-semibold text-red-400">Danger Zone</span>
                        <p className="text-sm text-gray-400">This action cannot be undone.</p>
                    </div>
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-semibold active:scale-95 transition-transform">
                        Reset Progress
                    </button>
                </div>
            </div>
        </div>
    )
}
