
{/* TopNavBar (hidden on mobile, flex on md+) */}
<header className="bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline-variant shadow-sm flex justify-between items-center w-full px-6 h-16 shrink-0 z-20">
<div className="flex items-center gap-4">
<span className="text-xl font-black text-primary tracking-tight font-headline">RailOpt AI</span>
</div>
<div className="flex-1 flex justify-end mr-4">
<div className="relative w-64">
<span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant" style={{"fontVariationSettings":"'FILL' 0"}}>search</span>
<input className="w-full bg-surface-container-high border-outline-variant rounded-full py-2 pl-4 pr-10 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="Search Request ID..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4 text-on-surface-variant">
<button className="hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 transition-opacity">
<span className="material-symbols-outlined" data-icon="notifications" style={{"fontVariationSettings":"'FILL' 0"}}>notifications</span>
</button>
<button className="hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 transition-opacity">
<span className="material-symbols-outlined" data-icon="settings" style={{"fontVariationSettings":"'FILL' 0"}}>settings</span>
</button>
<button className="hover:text-primary transition-colors duration-200 cursor-pointer active:opacity-80 transition-opacity">
<span className="material-symbols-outlined" data-icon="help" style={{"fontVariationSettings":"'FILL' 0"}}>help</span>
</button>
<div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden ml-2 cursor-pointer border border-outline-variant">
<img className="w-full h-full object-cover" data-alt="A professional headshot of an Operations Manager avatar, lit with cool, artificial control room lighting. Dark background, sharp focus, professional attire. Cyan rim lighting accentuates the high-tech command center environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyyomVoONhdA-ZVh5oPRSEQ1ZgIh8MMDJyyxHRMvOsKIFG7tH-APRWKiTbkMGEtmMg_Ty3D7R3HOz809qIzpOONrFpkLSm3Hk30nbQLztEGq66xov8lCGponGcx4oJ3uQateS5zHvSbv-7noesQNf5ucX5KmM-4LYFZvPycwfQsXEFkhoFgX0FiG2HbFMrt0vvcqkt8mi1pb7I3q7FsxhFyYS2-G3YB6AGqVfKE2HTMd3MvFn7yES52zWQntIjtQra85L1Ng0tlTtQ"/>
</div>
</div>
</header>
<div className="flex flex-1 overflow-hidden">
{/* SideNavBar */}
<nav className="bg-surface-container dark:bg-surface-container border-r border-outline-variant dark:border-outline-variant shadow-md flex flex-col h-full py-4 px-3 gap-2 w-64 shrink-0 hidden md:flex z-10">
<div className="mb-6 px-3">
<h2 className="text-lg font-black text-primary-container font-headline tracking-wide">RAIL-OPS-ALPHA</h2>
<p className="text-xs text-on-surface-variant mt-1 font-mono">Sector 7G - Mainline</p>
</div>
{/* Tabs */}
<a className="bg-secondary-container text-on-secondary-container rounded-lg font-bold font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="dashboard" style={{"fontVariationSettings":"'FILL' 1"}}>dashboard</span>
                Dashboard
            </a>
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="engineering" style={{"fontVariationSettings":"'FILL' 0"}}>engineering</span>
                Assets
            </a>
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="event_note" style={{"fontVariationSettings":"'FILL' 0"}}>event_note</span>
                Schedule
            </a>
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="warning" style={{"fontVariationSettings":"'FILL' 0"}}>warning</span>
                Incidents
            </a>
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="sensors" style={{"fontVariationSettings":"'FILL' 0"}}>sensors</span>
                Telemetry
            </a>
<div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-2">
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="terminal" style={{"fontVariationSettings":"'FILL' 0"}}>terminal</span>
                    Diagnostics
                </a>
<a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all duration-200 rounded-lg font-medium font-label text-label-md flex items-center gap-3 px-3 py-2.5 scale-95 active:scale-90 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="history" style={{"fontVariationSettings":"'FILL' 0"}}>history</span>
                    Logs
                </a>
</div>
</nav>
{/* Main Content */}
<main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background relative">
<div className="max-w-7xl mx-auto space-y-6">
{/* Page Header */}
<div className="flex justify-between items-end mb-8">
<div>
<h1 className="font-headline text-3xl font-bold text-on-background tracking-tight">System Metrics</h1>
<p className="text-on-surface-variant mt-1 font-mono text-sm">GLOBAL_OP_STATUS: NOMINAL</p>
</div>
<div className="flex gap-3">
<button className="bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-variant px-4 py-2 rounded font-label text-sm font-medium transition-colors">Export Report</button>
</div>
</div>
{/* KPI Cards (Bento Grid Style) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Total Requests */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-6 relative overflow-hidden group">
<div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
<div className="flex justify-between items-start mb-4">
<h3 className="font-label text-on-surface-variant font-medium">Total Requests</h3>
<span className="material-symbols-outlined text-primary" style={{"fontVariationSettings":"'FILL' 0"}}>list_alt</span>
</div>
<div className="flex items-baseline gap-3">
<span className="font-headline text-4xl font-bold text-on-background">142</span>
<span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">arrow_upward</span> 12%
                            </span>
</div>
<div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary w-[75%] rounded-full"></div>
</div>
</div>
{/* Scheduled Blocks */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-6 relative overflow-hidden group">
<div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-50 group-hover:opacity-100 transition-opacity"></div>
<div className="flex justify-between items-start mb-4">
<h3 className="font-label text-on-surface-variant font-medium">Scheduled Blocks</h3>
<span className="material-symbols-outlined text-secondary" style={{"fontVariationSettings":"'FILL' 0"}}>event_available</span>
</div>
<div className="flex items-baseline gap-3">
<span className="font-headline text-4xl font-bold text-on-background">89</span>
<span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">arrow_upward</span> 5%
                            </span>
</div>
<p className="text-xs text-on-surface-variant mt-4 font-mono">Capacity: 89/120</p>
</div>
{/* Conflicts Detected */}
<div className="bg-surface-container border border-error/30 rounded-xl p-6 relative overflow-hidden group">
<div className="absolute top-0 left-0 w-1 h-full bg-error opacity-50 group-hover:opacity-100 transition-opacity"></div>
<div className="flex justify-between items-start mb-4">
<h3 className="font-label text-on-surface-variant font-medium">Conflicts Detected</h3>
<span className="material-symbols-outlined text-error" style={{"fontVariationSettings":"'FILL' 1"}}>warning</span>
</div>
<div className="flex items-baseline gap-3">
<span className="font-headline text-4xl font-bold text-error">12</span>
<span className="text-xs font-mono text-error bg-error/10 px-2 py-0.5 rounded flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">arrow_upward</span> 2 active
                            </span>
</div>
<p className="text-xs text-on-surface-variant mt-4 font-mono">Requires immediate attention</p>
</div>
</div>
{/* Charts Section (CSS Styled for Control Room Vibe) */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
{/* Risk Score Chart (Custom CSS Bar Chart) */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-6 h-[400px] flex flex-col">
<h3 className="font-headline font-semibold text-lg text-on-background mb-1">Average Risk Score</h3>
<p className="text-xs text-on-surface-variant font-mono mb-6">Scheduled vs. Unscheduled Requests</p>
<div className="flex-1 relative flex items-end justify-around pb-8 px-4 border-l border-b border-surface-variant">
{/* Y-axis labels */}
<div className="absolute left-[-24px] top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-on-surface-variant">
<span>100</span>
<span>75</span>
<span>50</span>
<span>25</span>
<span>0</span>
</div>
{/* Grid Lines */}
<div className="absolute inset-0 border-b border-surface-variant border-dashed opacity-20" style={{"bottom":"80%"}}></div>
<div className="absolute inset-0 border-b border-surface-variant border-dashed opacity-20" style={{"bottom":"60%"}}></div>
<div className="absolute inset-0 border-b border-surface-variant border-dashed opacity-20" style={{"bottom":"40%"}}></div>
<div className="absolute inset-0 border-b border-surface-variant border-dashed opacity-20" style={{"bottom":"20%"}}></div>
{/* Bars */}
<div className="flex flex-col items-center gap-2 group z-10 w-16">
<div className="w-full bg-primary/20 border border-primary/50 rounded-t h-[45%] bar-chart-bar relative overflow-hidden">
<div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-primary/10 to-primary/40"></div>
</div>
<span className="text-xs font-mono text-on-surface-variant absolute -bottom-6">Scheduled</span>
</div>
<div className="flex flex-col items-center gap-2 group z-10 w-16">
<div className="w-full bg-error/20 border border-error/50 rounded-t h-[82%] bar-chart-bar relative overflow-hidden">
<div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-error/10 to-error/40"></div>
</div>
<span className="text-xs font-mono text-on-surface-variant absolute -bottom-6">Unscheduled</span>
</div>
</div>
</div>
{/* Time Series Chart (Custom CSS Line/Area Chart concept) */}
<div className="bg-surface-container border border-outline-variant rounded-xl p-6 h-[400px] flex flex-col">
<div className="flex justify-between items-start mb-6">
<div>
<h3 className="font-headline font-semibold text-lg text-on-background mb-1">Conflict Resolution</h3>
<p className="text-xs text-on-surface-variant font-mono">Detected vs Resolved (30 Days)</p>
</div>
<div className="flex gap-4 text-xs font-mono">
<div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-error"></div> Detected</div>
<div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> Resolved</div>
</div>
</div>
<div className="flex-1 relative border-l border-b border-surface-variant">
{/* Y-axis labels */}
<div className="absolute left-[-20px] top-0 bottom-0 flex flex-col justify-between text-[10px] font-mono text-on-surface-variant py-2">
<span>20</span>
<span>10</span>
<span>0</span>
</div>
{/* Mock Line Chart via SVG for better control room aesthetic */}
<svg className="absolute inset-0 w-full h-full overflow-visible" preserveaspectratio="none" viewbox="0 0 100 100">
{/* Grid */}
<line className="text-surface-variant" stroke="currentColor" stroke-dasharray="2,2" stroke-width="0.5" x1="0" x2="100" y1="50" y2="50"></line>
{/* Detected Line (Red/Error) */}
<path className="text-error" d="M0,80 L10,75 L20,60 L30,65 L40,40 L50,45 L60,30 L70,35 L80,20 L90,25 L100,10" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"></path>
{/* Resolved Line (Cyan/Primary) */}
<path className="text-primary" d="M0,85 L10,80 L20,70 L30,72 L40,60 L50,55 L60,45 L70,40 L80,35 L90,30 L100,20" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"></path>
{/* Points for Detected */}
<circle className="text-error" cx="40" cy="40" fill="currentColor" r="1.5"></circle>
<circle className="text-error" cx="60" cy="30" fill="currentColor" r="1.5"></circle>
<circle className="text-error" cx="80" cy="20" fill="currentColor" r="1.5"></circle>
{/* Area under primary */}
<path className="text-primary opacity-10" d="M0,100 L0,85 L10,80 L20,70 L30,72 L40,60 L50,55 L60,45 L70,40 L80,35 L90,30 L100,20 L100,100 Z" fill="currentColor"></path>
</svg>
{/* X-axis labels */}
<div className="absolute bottom-[-24px] left-0 right-0 flex justify-between text-[10px] font-mono text-on-surface-variant">
<span>-30d</span>
<span>-15d</span>
<span>Now</span>
</div>
</div>
</div>
</div>
</div>
</main>
</div>
