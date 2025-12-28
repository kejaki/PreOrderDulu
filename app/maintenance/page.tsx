export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-4">
                        <span className="text-5xl">🔧</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Under Maintenance</h1>
                    <p className="text-slate-400">
                        We're currently performing scheduled maintenance to improve your experience.
                    </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-slate-300">
                        We'll be back shortly. Thank you for your patience!
                    </p>
                </div>
            </div>
        </div>
    );
}
