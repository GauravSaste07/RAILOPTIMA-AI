
{/* Background Pattern */}
<div className="absolute inset-0 grid-bg pointer-events-none z-0"></div>
{/* Subtle Radial Gradient Overlay for focus */}
<div className="absolute inset-0 bg-radial-gradient from-transparent via-background/80 to-background z-0 pointer-events-none" style={{"background":"radial-gradient(circle at center, transparent 0%, #0d1516 80%)"}}></div>
{/* Header (Simplified for Login) */}
<header className="w-full p-6 flex justify-between items-center z-10 relative">
<div className="flex items-center gap-3">
{/* Simulated Indian Railways Logo Mark */}
<div className="w-10 h-10 rounded-full border-2 border-primary-container flex items-center justify-center bg-surface-container-low shadow-[0_0_10px_rgba(0,229,255,0.3)]">
<span className="material-symbols-outlined text-primary-container" style={{"fontVariationSettings":"'FILL' 1"}}>train</span>
</div>
<div className="flex flex-col">
<h1 className="text-xl font-headline font-bold text-primary-container tracking-tight leading-tight">RailOpt AI</h1>
<span className="font-mono text-[10px] text-secondary-fixed-dim uppercase tracking-widest">Operations Command</span>
</div>
</div>
<div className="hidden sm:flex items-center gap-2">
<span className="relative flex h-3 w-3">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
<span className="relative inline-flex rounded-full h-3 w-3 bg-primary-container"></span>
</span>
<span className="font-mono text-xs text-on-surface-variant">SYSTEM ONLINE</span>
</div>
</header>
{/* Main Content */}
<main className="flex-grow flex items-center justify-center p-4 z-10 relative">
<div className="w-full max-w-md">
{/* Auth Card */}
<div className="glass-card rounded-xl shadow-2xl p-8 relative overflow-hidden">
{/* Decorative top line */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50"></div>
{/* Tabs */}
<div className="flex border-b border-outline-variant mb-8">
<button className="flex-1 pb-3 text-center font-headline font-bold text-primary-container border-b-2 border-primary-container transition-colors focus:outline-none">
                        Sign In
                    </button>
<button className="flex-1 pb-3 text-center font-headline font-medium text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none">
                        Create Account
                    </button>
</div>
{/* Form */}
<form className="space-y-6">
<div>
<label className="block font-mono text-xs text-on-surface-variant mb-2" htmlFor="identifier">Email or Staff ID</label>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">badge</span>
<input className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-3 pl-10 pr-4 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all font-mono text-sm placeholder:text-outline/50 outline-none" id="identifier" placeholder="e.g., EMP-49201" type="text"/>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-2">
<label className="block font-mono text-xs text-on-surface-variant" htmlFor="password">Password</label>
<a className="font-mono text-xs text-secondary-fixed-dim hover:text-primary-container transition-colors" href="#">Forgot Password?</a>
</div>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
<input className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-3 pl-10 pr-4 text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all font-mono text-sm placeholder:text-outline/50 outline-none" id="password" placeholder="••••••••" type="password"/>
</div>
</div>
<div className="pt-4 space-y-4">
<button className="w-full bg-primary-container text-on-primary-container font-headline font-bold rounded-lg py-3 flex items-center justify-center gap-2 glow-btn" type="button">
<span className="material-symbols-outlined">login</span>
                            Enter Control Center
                        </button>
<button className="w-full bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-highest hover:border-outline font-headline font-medium rounded-lg py-3 transition-all flex items-center justify-center gap-2" type="button">
<span className="material-symbols-outlined">group</span>
                            Guest Access
                        </button>
</div>
</form>
{/* Status indicator */}
<div className="mt-8 pt-4 border-t border-outline-variant/50 flex justify-between items-center">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-outline">shield_lock</span>
<span className="font-mono text-[10px] text-outline">256-BIT ENCRYPTION</span>
</div>
<span className="font-mono text-[10px] text-outline">NODE: IR-DEL-01</span>
</div>
</div>
</div>
</main>
{/* Footer Component based on JSON */}
<footer className="bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center px-8 py-3 w-full z-10 relative">
<p className="text-outline font-label text-[10px] uppercase tracking-widest">
            © 2024 RailOpt AI Operations. Classified Indian Railways Personnel Only.
        </p>
<div className="flex gap-4">
<a className="text-outline hover:text-tertiary-fixed transition-colors font-label text-[10px] uppercase tracking-widest" href="#">Terms of Service</a>
<a className="text-outline hover:text-tertiary-fixed transition-colors font-label text-[10px] uppercase tracking-widest" href="#">Privacy Policy</a>
<a className="text-outline hover:text-tertiary-fixed transition-colors font-label text-[10px] uppercase tracking-widest" href="#">Security Protocol</a>
</div>
</footer>
