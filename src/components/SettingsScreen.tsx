import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

export default function SettingsScreen() {
    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in pb-24">
            <SectionHeader title="Settings" subtitle="Manage your preferences" className="mb-8" />

            <div className="flex flex-col gap-6">
                <Card className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold text-text block text-lg">Dark Mode</span>
                            <span className="text-sm text-muted">Toggle application visual theme</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-14 h-8 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner border border-border"></div>
                        </label>
                    </div>

                    <hr className="border-border" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="font-bold text-[#E63946] block text-lg">Danger Zone</span>
                            <p className="text-sm text-muted">This action cannot be undone. All your progress will be lost.</p>
                        </div>
                        <button className="px-6 py-3 bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 rounded-xl font-bold active:scale-95 transition-all hover:bg-[#E63946]/20 shrink-0">
                            Reset Progress
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
