
{/* Shared Component: SideNavBar */}
<nav className="bg-surface-container-low dark:bg-surface-container-low text-primary dark:text-primary font-body text-sm font-medium tracking-wide uppercase fixed left-0 top-0 h-screen w-64 z-40 border-r border-outline-variant shadow-xl flex flex-col pt-20 pb-6 hidden md:flex">
<div className="px-6 mb-8 flex flex-col gap-1">
<span className="text-lg font-bold text-primary font-headline">RAIL-OPS-SEC</span>
<span className="text-[10px] text-on-surface-variant tracking-widest font-mono">Protocol v4.2.0-STABLE</span>
</div>
<div className="flex-1 flex flex-col gap-1 overflow-y-auto">
{/* Inactive */}
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-3 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform mx-2 rounded" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 0"}}>dashboard</span>
<span>Dashboard</span>
</a>
{/* Inactive */}
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-3 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform mx-2 rounded" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 0"}}>warning</span>
<span>Risk Queue</span>
</a>
{/* Inactive */}
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-3 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform mx-2 rounded" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 0"}}>engineering</span>
<span>Maintenance</span>
</a>
{/* Inactive */}
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-3 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform mx-2 rounded" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 0"}}>history</span>
<span>Logs</span>
</a>
{/* Inactive */}
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-3 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform mx-2 rounded" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 0"}}>hub</span>
<span>Network</span>
</a>
{/* Active */}
<a className="bg-secondary-container text-on-secondary-container border-l-4 border-primary px-4 py-3 flex items-center gap-3 mx-2 rounded-r" href="#">
<span className="material-symbols-outlined text-[20px]" style={{"fontVariationSettings":"'FILL' 1"}}>alt_route</span>
<span>Block Optimization</span>
</a>
</div>
<div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/30 pt-4 px-2">
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-2 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform rounded" href="#">
<span className="material-symbols-outlined text-[18px]">shield</span>
<span className="text-xs">Security</span>
</a>
<a className="text-on-surface-variant hover:bg-surface-container-high px-4 py-2 flex items-center gap-3 transition-colors hover:bg-surface-container-highest active:scale-95 transition-transform rounded" href="#">
<span className="material-symbols-outlined text-[18px]">contact_support</span>
<span className="text-xs">Support</span>
</a>
</div>
</nav>
{/* Main Content Wrapper */}
<div className="flex-1 flex flex-col ml-0 md:ml-64 h-screen relative">
{/* Shared Component: TopNavBar */}
<header className="bg-background dark:bg-background text-primary dark:text-primary font-headline text-on-surface tracking-tight font-bold fixed top-0 w-full z-50 border-b border-outline-variant shadow-sm flex justify-between items-center px-6 py-3 bg-background/95 backdrop-blur-md md:w-[calc(100%-16rem)] right-0">
<div className="flex items-center gap-4">
<div className="md:hidden flex items-center">
<span className="material-symbols-outlined cursor-pointer hover:text-primary-container">menu</span>
</div>
<div className="text-2xl font-black tracking-tighter text-primary dark:text-primary-container">RailOpt AI</div>
</div>
<div className="flex items-center gap-6">
{/* Search (on_right) */}
<div className="relative hidden sm:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input className="bg-surface-container rounded-full border border-outline-variant/50 pl-9 pr-4 py-1.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all w-64" placeholder="Search sections, IDs..." type="text"/>
</div>
<div className="flex items-center gap-4">
<button className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-highest transition-all p-1.5 rounded-full active:opacity-80 transition-opacity">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-highest transition-all p-1.5 rounded-full active:opacity-80 transition-opacity">
<span className="material-symbols-outlined">settings</span>
</button>
<button className="text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-container-highest transition-all p-1.5 rounded-full active:opacity-80 transition-opacity">
<span className="material-symbols-outlined">help</span>
</button>
<div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden ml-2 cursor-pointer relative group">
<img alt="Operations Controller Avatar" className="w-full h-full object-cover" data-alt="A futuristic, cyber-punk style avatar portrait of an operations controller with subtle neon highlights in a dimly lit control room setting, emphasizing high-tech command aesthetics. The lighting is cinematic and focused." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtHUeV_nz_7_m6OvfwaDRbrfil4yGGN_Rly8hIuD4pI8wuVBcZKbp4pWA6-kPisjJyyX2i4JrF9f9qbE1NugWvENFrCR0L3uTGG-U7j1jdyEg2cNHpygWrqGAFHYCMH198NPkG-GZrrnhUwoiVwBxXX4hDH1-lVITc1IPQ-x6TK6y2-DLbS3uLIB2Ar_Xr5RYmf2lL1RVCCbq7TR2AI8XADPaQ_4PmHTx8_GtD7xDmjMQ1MEo0g-L9brRiF4kBLNn0ihscuCRHxNbH"/>
<div className="absolute inset-0 ring-2 ring-primary-container/0 group-hover:ring-primary-container/50 rounded-full transition-all"></div>
</div>
</div>
</div>
</header>
{/* Main Canvas */}
<main className="flex-1 mt-16 p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-6">
{/* Top Control Bar */}
<section className="glass-panel rounded-xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
<button className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 cyan-glow hover:bg-primary-fixed transition-colors shadow-lg active:scale-95 group">
<span className="material-symbols-outlined text-[20px] group-hover:animate-spin">model_training</span>
                        Generate Optimized Plan
                    </button>
<div className="flex items-center bg-surface-container-highest rounded-lg p-1 border border-outline-variant/50">
<button className="px-4 py-1.5 rounded-md text-sm font-medium bg-surface text-on-surface shadow-sm border border-outline-variant/30 transition-all">Weekly: 7 Days</button>
<button className="px-4 py-1.5 rounded-md text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all">Monthly: 30 Days</button>
</div>
</div>
<div className="flex items-center gap-3 self-end lg:self-auto">
<div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full border border-primary-container/30">
<span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
<span className="font-mono text-xs text-primary-container tracking-tight">Solver: OR-Tools CP-SAT Optimal (1.15s)</span>
</div>
</div>
</section>
{/* KPI Tiles */}
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="glass-panel p-5 rounded-xl flex flex-col gap-2 glow-border">
<div className="flex justify-between items-center text-on-surface-variant">
<span className="text-xs font-semibold uppercase tracking-wider">Total Scheduled Blocks</span>
<span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
</div>
<div className="text-3xl font-black text-on-surface font-headline tracking-tighter">15</div>
</div>
<div className="glass-panel p-5 rounded-xl flex flex-col gap-2 glow-border">
<div className="flex justify-between items-center text-on-surface-variant">
<span className="text-xs font-semibold uppercase tracking-wider">Total Risk Mitigated</span>
<span className="material-symbols-outlined text-[18px] text-emerald-400">verified_user</span>
</div>
<div className="text-3xl font-black text-emerald-400 font-headline tracking-tighter">38.47<span className="text-sm font-medium ml-1 text-on-surface-variant">%</span></div>
</div>
<div className="glass-panel p-5 rounded-xl flex flex-col gap-2 glow-border">
<div className="flex justify-between items-center text-on-surface-variant">
<span className="text-xs font-semibold uppercase tracking-wider">Co-Allocated Rate</span>
<span className="material-symbols-outlined text-[18px] text-violet-400">merge_type</span>
</div>
<div className="text-3xl font-black text-violet-400 font-headline tracking-tighter">100<span className="text-sm font-medium ml-1 text-on-surface-variant">%</span></div>
</div>
<div className="glass-panel p-5 rounded-xl flex flex-col gap-2 glow-border">
<div className="flex justify-between items-center text-on-surface-variant">
<span className="text-xs font-semibold uppercase tracking-wider">Solver Method</span>
<span className="material-symbols-outlined text-[18px]">functions</span>
</div>
<div className="text-lg font-bold text-on-surface font-mono mt-1 text-primary-container truncate">CP-SAT Optimal</div>
</div>
</section>
{/* Main Content Area (Split Layout) */}
<section className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
{/* Left Column (Visual Corridor Gantt / Block List) */}
<div className="lg:col-span-2 glass-panel rounded-xl border border-outline-variant/40 flex flex-col overflow-hidden">
<div className="border-b border-outline-variant/30 p-4 bg-surface-container-lowest/50 flex justify-between items-center">
<h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary-container">timeline</span>
                            Proposed Corridor Blocks
                        </h2>
<button className="text-xs font-mono text-on-surface-variant hover:text-primary-container transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                        </button>
</div>
<div className="p-4 flex-1 overflow-y-auto space-y-4">
{/* Block Item 1 */}
<div className="bg-surface-container/60 border border-outline-variant/20 rounded-lg p-4 hover:border-outline-variant/50 transition-colors group">
<div className="flex justify-between items-start mb-3">
<div className="flex items-center gap-3">
<div className="bg-surface-container-highest px-2 py-1 rounded border border-outline-variant/40 font-mono text-sm font-bold text-on-surface">NDLS-GZB</div>
<div className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">schedule</span> 02:00 - 05:30 (3.5h)
                                    </div>
</div>
<div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">verified</span> High Confidence: Timetable-Backed 95%
                                </div>
</div>
<div className="flex flex-wrap gap-2">
<span className="bg-surface-bright text-xs px-2 py-1 rounded border border-outline-variant/30 font-mono text-on-surface-variant">Engineering</span>
<span className="text-on-surface-variant/50">+</span>
<span className="bg-surface-bright text-xs px-2 py-1 rounded border border-outline-variant/30 font-mono text-on-surface-variant">S&amp;T</span>
<span className="text-on-surface-variant/50">+</span>
<span className="bg-surface-bright text-xs px-2 py-1 rounded border border-outline-variant/30 font-mono text-on-surface-variant">Traction</span>
</div>
</div>
{/* Block Item 2 */}
<div className="bg-surface-container/60 border border-outline-variant/20 rounded-lg p-4 hover:border-outline-variant/50 transition-colors group">
<div className="flex justify-between items-start mb-3">
<div className="flex items-center gap-3">
<div className="bg-surface-container-highest px-2 py-1 rounded border border-outline-variant/40 font-mono text-sm font-bold text-on-surface">CSMT-KYN</div>
<div className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">schedule</span> 00:30 - 04:00 (3.5h)
                                    </div>
</div>
<div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">warning</span> Moderate: Goods Forecast-Backed 75%
                                </div>
</div>
<div className="flex flex-wrap gap-2">
<span className="bg-surface-bright text-xs px-2 py-1 rounded border border-outline-variant/30 font-mono text-on-surface-variant">Engineering</span>
<span className="text-on-surface-variant/50">+</span>
<span className="bg-surface-bright text-xs px-2 py-1 rounded border border-outline-variant/30 font-mono text-on-surface-variant">Overhead Maint.</span>
</div>
</div>
</div>
</div>
{/* Right Column ('What-If' Scenario Simulator Panel) */}
<div className="glass-panel rounded-xl border border-outline-variant/40 flex flex-col">
<div className="border-b border-outline-variant/30 p-4 bg-surface-container-lowest/50">
<h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary-container">science</span>
                            Scenario Simulator
                        </h2>
<p className="text-xs text-on-surface-variant mt-1">Real-time delta impact analysis.</p>
</div>
<div className="p-5 flex flex-col gap-6">
{/* Toggle Group 1 */}
<div className="flex flex-col gap-3">
<div className="flex justify-between items-center">
<label className="text-sm font-medium text-on-surface">Exclude Maintenance Requests</label>
{/* Custom Toggle */}
<div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in cursor-pointer">
<input className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" id="toggle1" name="toggle" style={{"right":"0","borderColor":"#3b494c","transition":"all 0.3s","zIndex":"2"}} type="checkbox"/>
<label className="toggle-label block overflow-hidden h-5 rounded-full bg-surface-container-highest cursor-pointer" htmlFor="toggle1" style={{"border":"1px solid #3b494c"}}></label>
</div>
</div>
{/* Delta Indicator (Visible state) */}
<div className="bg-surface-container-lowest border border-outline-variant/20 rounded p-2 flex items-center justify-between text-xs font-mono">
<span className="text-on-surface-variant">Est. Impact:</span>
<span className="text-emerald-400 flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span> +2.4% Efficiency</span>
</div>
</div>
<hr className="border-outline-variant/20"/>
{/* Toggle Group 2 */}
<div className="flex flex-col gap-3">
<div className="flex justify-between items-center">
<label className="text-sm font-medium text-on-surface">Simulate Corridor Closures (Full)</label>
{/* Custom Toggle Checked */}
<div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in cursor-pointer">
<input checked="" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-primary-container border-4 appearance-none cursor-pointer" id="toggle2" name="toggle" style={{"right":"0","borderColor":"#00e5ff","transform":"translateX(100%)","transition":"all 0.3s","zIndex":"2"}} type="checkbox"/>
<label className="toggle-label block overflow-hidden h-5 rounded-full bg-surface-container-highest cursor-pointer" htmlFor="toggle2" style={{"border":"1px solid #00e5ff","backgroundColor":"rgba(0, 229, 255, 0.2)"}}></label>
</div>
</div>
{/* Delta Indicator (Warning state) */}
<div className="bg-surface-container-lowest border border-outline-variant/20 rounded p-2 flex items-center justify-between text-xs font-mono">
<span className="text-on-surface-variant">Est. Impact:</span>
<span className="text-error flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_downward</span> -14m Avg Delay</span>
</div>
</div>
<div className="mt-auto pt-4">
<button className="w-full border border-primary-container/50 text-primary-container hover:bg-primary-container/10 font-bold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[18px]">calculate</span>
                                Recalculate Scenario
                            </button>
</div>
</div>
</div>
</section>
</main>
{/* Shared Component: Footer */}
<footer className="bg-surface-container-lowest dark:bg-surface-container-lowest text-secondary dark:text-secondary-fixed-dim font-mono text-xs uppercase tracking-widest fixed bottom-0 right-0 w-[calc(100%-16rem)] z-30 border-t border-outline-variant/30 flex justify-between items-center px-8 py-2">
<div>
                © 2024 RAILOPT AI - CLASSIFIED SYSTEM PROTOCOL METADATA [SEC-LEVEL-7]
            </div>
<div className="flex gap-6">
<a className="text-outline hover:text-primary transition-colors hover:text-primary-container cursor-pointer" href="#">Privacy Policy</a>
<a className="text-outline hover:text-primary transition-colors hover:text-primary-container cursor-pointer" href="#">Legal Notice</a>
<a className="text-outline hover:text-primary transition-colors hover:text-primary-container cursor-pointer" href="#">System Status</a>
</div>
</footer>
</div>
{/* Inline Script for generic toggle behavior */}
<script>
        // Simple script to handle visual state of the custom toggles
        document.querySelectorAll('.toggle-checkbox').forEach(toggle => {
            toggle.addEventListener('change', function() {
                if(this.checked) {
                    this.style.transform = 'translateX(100%)';
                    this.style.borderColor = '#00e5ff';
                    this.style.backgroundColor = '#00e5ff';
                    this.nextElementSibling.style.borderColor = '#00e5ff';
                    this.nextElementSibling.style.backgroundColor = 'rgba(0, 229, 255, 0.2)';
                } else {
                    this.style.transform = 'translateX(0)';
                    this.style.borderColor = '#3b494c';
                    this.style.backgroundColor = 'white';
                    this.nextElementSibling.style.borderColor = '#3b494c';
                    this.nextElementSibling.style.backgroundColor = '#2e3638';
                }
            });
            // Init state
            if(toggle.checked) {
                 toggle.style.transform = 'translateX(100%)';
                 toggle.style.borderColor = '#00e5ff';
                 toggle.style.backgroundColor = '#00e5ff';
            }
        });
    </script>
