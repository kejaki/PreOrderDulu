export default function ForbiddenPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4">
                        <span className="text-5xl">🚫</span>
                    </div>
                    <h1 className="text-6xl font-bold text-white mb-2">403</h1>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Forbidden</h2>
                    <p className="text-slate-400">
                        You don't have permission to access this page.
                    </p>
                </div>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
                >
                    Return to Home
                </a>
            </div>
        </div>
    );
}
