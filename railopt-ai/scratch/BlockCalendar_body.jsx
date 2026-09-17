
{/* Shared Component: SideNavBar */}
<nav className="bg-surface-container-lowest text-primary-container font-body text-sm font-medium h-screen w-64 fixed left-0 top-0 border-r border-outline-variant flat flex flex-col h-full pt-16 pb-4 z-40">
{/* Brand / Header (Absolute positioned to sit above nav links) */}
<div className="absolute top-0 left-0 w-full h-16 flex items-center px-6 border-b border-outline-variant bg-surface-container-lowest z-50">
<span className="material-symbols-outlined mr-3 text-primary-container icon-fill text-2xl">train</span>
<div>
<h1 className="text-lg font-headline font-bold text-primary-fixed-dim leading-tight">RailOpt AI</h1>
<p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Southern Zone - HQ</p>
</div>
</div>
<div className="flex-1 overflow-y-auto mt-4 px-3 flex flex-col gap-1">
{/* Inactive Nav Items */}
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">dashboard</span>
                Dashboard
            </a>
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">warning</span>
                Risk Queue
            </a>
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">engineering</span>
                Maintenance
            </a>
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">history</span>
                Logs
            </a>
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">hub</span>
                Network
            </a>
<a className="flex items-center px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3">bolt</span>
                Block Optimization
            </a>
{/* Active Nav Item */}
<a className="flex items-center px-3 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container border-r-4 border-primary-container shadow-[0_0_15px_rgba(0,229,255,0.2)] active:translate-x-1 duration-200" href="#">
<span className="material-symbols-outlined mr-3 icon-fill">calendar_month</span>
                Block Calendar
            </a>
</div>
{/* CTA & Footer Links */}
<div className="px-4 mt-auto space-y-4">
<button className="w-full bg-primary-container text-on-primary-container font-bold py-2.5 rounded flex items-center justify-center hover:bg-primary transition-colors shadow-[0_0_10px_rgba(0,229,255,0.3)]">
<span className="material-symbols-outlined mr-2 text-sm">add</span>
                New Block Request
            </button>
<div className="pt-4 border-t border-outline-variant flex flex-col gap-1">
<a className="flex items-center px-3 py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
<span className="material-symbols-outlined mr-2 text-[18px]">support_agent</span>
                    Support
                </a>
<a className="flex items-center px-3 py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors" href="#">
<span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
                    Sign Out
                </a>
</div>
</div>
</nav>
{/* Main Workspace Area */}
<main className="ml-64 flex-1 flex flex-col h-screen relative">
{/* Shared Component: TopNavBar */}
<header className="bg-surface-container-low text-primary-container font-headline text-on-surface flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 border-b border-outline-variant shadow-sm shrink-0">
{/* Left: Search (from JSON config search_bar: "on_left") */}
<div className="flex-1 max-w-md">
<div className="relative group">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-container transition-colors">search</span>
<input className="w-full bg-surface-container-highest border border-outline-variant rounded-md py-1.5 pl-10 pr-4 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" placeholder="Search blocks, IDs, corridors..." type="text"/>
</div>
</div>
{/* Right: Actions & Profile */}
<div className="flex items-center space-x-2">
<button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary-fixed-dim transition-colors active:scale-95 duration-150 relative">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full shadow-[0_0_5px_theme(colors.error)]"></span>
</button>
<button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary-fixed-dim transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined">settings</span>
</button>
<button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary-fixed-dim transition-colors active:scale-95 duration-150">
<span className="material-symbols-outlined">help</span>
</button>
<div className="h-6 w-px bg-outline-variant mx-2"></div>
<button className="flex items-center hover:bg-surface-container-high p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-outline-variant">
<img alt="Operations Officer Profile" className="w-8 h-8 rounded-full border border-primary-container shadow-[0_0_5px_rgba(0,229,255,0.4)] mr-2" data-alt="Operations Officer Profile avatar image featuring glowing cyan letters on dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADTfDk9T7tZNxBOhuiLoUawIPjD0Klbo6zJKRaSiEaY2opi4bOpJQjesOmHdkdhHOOyi9xOIsolmIi3i9kJMVZHgpswjZSEYqjevxKpY4n8_wbS1xnRr2jpYxFDZzxTsgQbgAJzuGcrH4kTvM5XI32-3oL6j61MWWWgdFpg1vaMPuKEl-6M609SE3NccHCVMVjtjrMN_NiUlGoQu2ayBiyBE4hgRWqGf4Ij6gGmrAGMwKTTomY8kDpZOetJhIHjAJIAtZ-03MeZ_g_"/>
<div className="text-left hidden md:block">
<p className="text-xs font-semibold text-on-surface leading-tight">O. Officer</p>
<p className="text-[10px] text-on-surface-variant">Control Room</p>
</div>
</button>
</div>
</header>
{/* Calendar Content Wrapper */}
<div className="flex-1 flex overflow-hidden">
{/* Main Calendar Area */}
<div className="flex-1 flex flex-col min-w-0 bg-background relative z-10">
{/* Calendar Toolbar */}
<div className="h-14 border-b border-surface-container-highest bg-surface-dim flex items-center justify-between px-6 shrink-0">
{/* Date & View Toggles */}
<div className="flex items-center space-x-4">
<div className="flex items-center bg-surface-container rounded-md border border-outline-variant p-1">
<button className="p-1 text-on-surface-variant hover:text-primary-container transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
<span className="px-3 font-mono text-sm font-bold text-on-surface tracking-wide">SEP 2026</span>
<button className="p-1 text-on-surface-variant hover:text-primary-container transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
</div>
<div className="flex bg-surface-container-lowest rounded-md border border-outline-variant p-0.5 shadow-inner">
<button className="px-3 py-1 text-xs font-medium rounded bg-secondary-container text-on-secondary-container shadow-sm border border-transparent transition-all">Weekly</button>
<button className="px-3 py-1 text-xs font-medium rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all">Monthly</button>
</div>
</div>
{/* Filters & Legend */}
<div className="flex items-center space-x-6">
<button className="flex items-center space-x-2 text-sm text-on-surface border border-outline-variant rounded-md px-3 py-1.5 hover:bg-surface-container transition-colors bg-surface-container-low">
<span className="material-symbols-outlined text-sm">filter_alt</span>
<span>All Corridors</span>
<span className="material-symbols-outlined text-sm">arrow_drop_down</span>
</button>
<div className="h-4 w-px bg-outline-variant"></div>
<div className="flex items-center space-x-3 text-xs font-label">
<div className="flex items-center"><span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim mr-1.5 shadow-[0_0_4px_theme(colors.tertiary-fixed-dim)]"></span> Eng</div>
<div className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary-fixed-dim mr-1.5 shadow-[0_0_4px_theme(colors.secondary-fixed-dim)]"></span> S&amp;T</div>
<div className="flex items-center"><span className="w-2 h-2 rounded-full bg-primary-container mr-1.5 shadow-[0_0_4px_theme(colors.primary-container)]"></span> Trc</div>
<div className="flex items-center"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-container to-secondary-fixed-dim mr-1.5"></span> Multi</div>
</div>
</div>
</div>
{/* Calendar Grid Core (Gantt style) */}
<div className="flex-1 overflow-auto flex flex-col relative grid-bg-pattern">
{/* Timeline Header (Sticky) */}
<div className="sticky top-0 z-20 flex bg-surface-dim border-b border-surface-container-highest shadow-sm">
{/* Spacer for Y-axis labels */}
<div className="w-48 shrink-0 border-r border-surface-container-highest bg-surface flex items-center justify-between px-4 py-2">
<span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Corridor Sect</span>
<span className="material-symbols-outlined text-sm text-outline">sort</span>
</div>
{/* Days/Hours */}
<div className="flex-1 flex">
{/* Mon 14 */}
<div className="w-[240px] shrink-0 border-r border-surface-container-highest flex flex-col">
<div className="text-center py-1 bg-surface-container-low border-b border-surface-container-highest text-xs font-mono text-on-surface">MON 14</div>
<div className="flex flex-1 text-[10px] text-outline font-mono opacity-50">
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">00</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">06</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">12</div>
<div className="flex-1 text-center py-0.5">18</div>
</div>
</div>
{/* Tue 15 */}
<div className="w-[240px] shrink-0 border-r border-surface-container-highest flex flex-col">
<div className="text-center py-1 bg-surface-container-low border-b border-surface-container-highest text-xs font-mono text-primary-container font-bold shadow-[inset_0_-2px_0_theme(colors.primary-container)]">TUE 15 (Today)</div>
<div className="flex flex-1 text-[10px] text-outline font-mono opacity-50">
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5 bg-primary-fixed-dim/5">00</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5 bg-primary-fixed-dim/5">06</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5 bg-primary-fixed-dim/5">12</div>
<div className="flex-1 text-center py-0.5 bg-primary-fixed-dim/5">18</div>
</div>
</div>
{/* Wed 16 */}
<div className="w-[240px] shrink-0 border-r border-surface-container-highest flex flex-col">
<div className="text-center py-1 bg-surface-container-low border-b border-surface-container-highest text-xs font-mono text-on-surface">WED 16</div>
<div className="flex flex-1 text-[10px] text-outline font-mono opacity-50">
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">00</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">06</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">12</div>
<div className="flex-1 text-center py-0.5">18</div>
</div>
</div>
{/* Thu 17 */}
<div className="w-[240px] shrink-0 border-r border-surface-container-highest flex flex-col">
<div className="text-center py-1 bg-surface-container-low border-b border-surface-container-highest text-xs font-mono text-on-surface">THU 17</div>
<div className="flex flex-1 text-[10px] text-outline font-mono opacity-50">
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">00</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">06</div>
<div className="flex-1 border-r border-surface-container-highest/30 text-center py-0.5">12</div>
<div className="flex-1 text-center py-0.5">18</div>
</div>
</div>
</div>
</div>
{/* Grid Rows */}
<div className="flex flex-col relative">
{/* Current Time Indicator Line */}
<div className="absolute top-0 bottom-0 left-[340px] w-px bg-primary-container z-10 shadow-[0_0_8px_theme(colors.primary-container)] pointer-events-none">
<div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_theme(colors.primary-container)]"></div>
</div>
{/* Row 1: NDLS-GZB */}
<div className="flex h-16 border-b border-surface-container/50 group hover:bg-surface-container-low/30 transition-colors">
<div className="w-48 shrink-0 bg-surface border-r border-surface-container-highest flex flex-col justify-center px-4 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
<span className="font-mono text-sm font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">NDLS-GZB</span>
<span className="text-[10px] text-on-surface-variant">Mainline Up/Dn</span>
</div>
<div className="flex-1 relative">
{/* Event Chip: Scheduled */}
<div className="absolute top-2 h-12 rounded bg-surface-container-highest border border-outline-variant flex flex-col justify-center px-2 shadow-sm cursor-pointer hover:border-primary-container transition-colors group/chip" style={{"left":"40px","width":"140px"}}>
<div className="flex justify-between items-center mb-1">
<div className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
<span className="text-[9px] font-bold text-on-surface uppercase tracking-wider">BLK-4012</span>
</div>
<span className="material-symbols-outlined text-[12px] text-primary-container">check_circle</span>
</div>
<div className="font-mono text-[10px] text-on-surface-variant group-hover/chip:text-on-surface">04:00 - 18:00</div>
</div>
</div>
</div>
{/* Row 2: CSMT-KYN (Active Inspector Target) */}
<div className="flex h-16 border-b border-surface-container/50 bg-secondary-container/10 group">
<div className="w-48 shrink-0 bg-surface border-r border-surface-container-highest flex flex-col justify-center px-4 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
<span className="font-mono text-sm font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">CSMT-KYN</span>
<span className="text-[10px] text-on-surface-variant">Suburban Slow</span>
</div>
<div className="flex-1 relative">
{/* Event Chip: Priority/Active */}
<div className="absolute top-2 h-12 rounded bg-surface-container-high border border-primary-container flex flex-col justify-center px-2 shadow-[0_0_12px_rgba(0,229,255,0.15)] cursor-pointer ring-1 ring-primary-container z-10" style={{"left":"280px","width":"180px"}}>
<div className="flex justify-between items-center mb-1">
<div className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary-container to-secondary-fixed-dim"></span>
<span className="text-[10px] font-bold text-primary-container uppercase tracking-wider">BLK-8291</span>
</div>
<div className="bg-primary-container/20 text-primary-fixed-dim text-[8px] px-1.5 py-0.5 rounded border border-primary-container/30">APPROVED</div>
</div>
<div className="font-mono text-[10px] text-on-surface font-semibold">00:00 - 18:00 (15th)</div>
</div>
</div>
</div>
{/* Row 3: HWH-BWN */}
<div className="flex h-16 border-b border-surface-container/50 group hover:bg-surface-container-low/30 transition-colors">
<div className="w-48 shrink-0 bg-surface border-r border-surface-container-highest flex flex-col justify-center px-4 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
<span className="font-mono text-sm font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">HWH-BWN</span>
<span className="text-[10px] text-on-surface-variant">Chord Line</span>
</div>
<div className="flex-1 relative">
{/* Event Chip: Planned */}
<div className="absolute top-2 h-12 rounded bg-surface border border-outline-variant/50 flex flex-col justify-center px-2 opacity-80 cursor-pointer hover:opacity-100 transition-opacity" style={{"left":"500px","width":"120px"}}>
<div className="flex justify-between items-center mb-1">
<div className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim"></span>
<span className="text-[9px] font-bold text-outline uppercase tracking-wider">BLK-9022</span>
</div>
<span className="material-symbols-outlined text-[12px] text-outline">pending_actions</span>
</div>
<div className="font-mono text-[10px] text-outline">02:00 - 14:00</div>
</div>
</div>
</div>
{/* Row 4: MAS-BZA */}
<div className="flex h-16 border-b border-surface-container/50 group hover:bg-surface-container-low/30 transition-colors">
<div className="w-48 shrink-0 bg-surface border-r border-surface-container-highest flex flex-col justify-center px-4 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
<span className="font-mono text-sm font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">MAS-BZA</span>
<span className="text-[10px] text-on-surface-variant">Trunk Route</span>
</div>
<div className="flex-1 relative">
{/* Event Chip: Maintenance */}
<div className="absolute top-2 h-12 rounded bg-surface-container border-l-2 border-l-tertiary-fixed-dim border-y border-r border-outline-variant/50 flex flex-col justify-center px-2 cursor-pointer" style={{"left":"200px","width":"90px"}}>
<div className="flex justify-between items-center mb-1">
<span className="text-[9px] font-bold text-tertiary-fixed-dim uppercase tracking-wider">BLK-771</span>
</div>
<div className="font-mono text-[10px] text-on-surface-variant">20:00 - 05:00</div>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Modal/Inspector (Slide-over on right) */}
<aside className="w-[380px] bg-surface-container-lowest border-l border-outline-variant shadow-[-4px_0_15px_rgba(0,0,0,0.3)] flex flex-col z-30 shrink-0 transform transition-transform duration-300 translate-x-0">
{/* Inspector Header */}
<div className="h-14 border-b border-outline-variant bg-surface-container-low flex justify-between items-center px-4 shrink-0">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary-container">troubleshoot</span>
<h2 className="font-headline font-bold text-on-surface tracking-tight">Block Telemetry Details</h2>
</div>
<button className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors">
<span className="material-symbols-outlined">close</span>
</button>
</div>
{/* Inspector Content (Scrollable) */}
<div className="flex-1 overflow-y-auto p-5 space-y-6">
{/* Primary Status Card */}
<div className="bg-surface-container rounded-lg p-4 border border-primary-container/30 relative overflow-hidden">
{/* Glowing accent line */}
<div className="absolute top-0 left-0 w-1 h-full bg-primary-container shadow-[0_0_10px_theme(colors.primary-container)]"></div>
<div className="flex justify-between items-start mb-3 ml-2">
<div>
<div className="text-[10px] text-primary-fixed-dim font-mono mb-1 tracking-wider uppercase">Active Block ID</div>
<div className="text-2xl font-mono font-bold text-on-surface">BLK-8291</div>
</div>
<div className="bg-primary-container/10 text-primary-container border border-primary-container/50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-[0_0_5px_rgba(0,229,255,0.2)]">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                                APPROVED
                            </div>
</div>
<div className="grid grid-cols-2 gap-4 mt-4 ml-2 border-t border-surface-container-highest pt-3">
<div>
<p className="text-[10px] text-on-surface-variant uppercase mb-1">Corridor Section</p>
<p className="font-mono text-sm font-semibold text-on-surface">CSMT-KYN</p>
</div>
<div>
<p className="text-[10px] text-on-surface-variant uppercase mb-1">Dept Co-allocation</p>
<div className="flex gap-1">
<span className="px-1.5 py-0.5 rounded text-[9px] bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30">ENG</span>
<span className="px-1.5 py-0.5 rounded text-[9px] bg-secondary-fixed-dim/20 text-secondary-fixed-dim border border-secondary-fixed-dim/30">S&amp;T</span>
</div>
</div>
<div className="col-span-2">
<p className="text-[10px] text-on-surface-variant uppercase mb-1">Time Window</p>
<div className="flex items-center gap-2 font-mono text-sm text-on-surface bg-surface-container-lowest p-2 rounded border border-outline-variant/50">
<span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                                    00:00 <span className="text-outline-variant">→</span> 18:00 (15 Sep)
                                </div>
</div>
</div>
</div>
{/* Constituent Requests Section */}
<div>
<h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
<span className="material-symbols-outlined text-[16px]">build_circle</span>
                            Constituent Requests
                        </h3>
<div className="space-y-2">
{/* Request 1 */}
<div className="bg-surface-container border border-outline-variant/50 rounded p-3 hover:border-outline transition-colors cursor-pointer flex justify-between items-center group">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="font-mono text-xs text-on-surface group-hover:text-primary-fixed-dim transition-colors">REQ-992A</span>
<span className="text-[9px] bg-surface-bright px-1 rounded text-outline">Track Renew</span>
</div>
<p className="text-[10px] text-on-surface-variant">Km 45.2 to 48.0</p>
</div>
<div className="flex flex-col items-end">
<span className="text-[9px] text-on-surface-variant mb-1">Risk Score</span>
{/* Risk Bar */}
<div className="flex items-center gap-2">
<div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-error w-[85%] shadow-[0_0_4px_theme(colors.error)]"></div>
</div>
<span className="font-mono text-xs text-error font-bold">85</span>
</div>
</div>
</div>
{/* Request 2 */}
<div className="bg-surface-container border border-outline-variant/50 rounded p-3 hover:border-outline transition-colors cursor-pointer flex justify-between items-center group">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="font-mono text-xs text-on-surface group-hover:text-primary-fixed-dim transition-colors">REQ-104B</span>
<span className="text-[9px] bg-surface-bright px-1 rounded text-outline">Signal Maint</span>
</div>
<p className="text-[10px] text-on-surface-variant">Interlocking KYN</p>
</div>
<div className="flex flex-col items-end">
<span className="text-[9px] text-on-surface-variant mb-1">Risk Score</span>
{/* Risk Bar */}
<div className="flex items-center gap-2">
<div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-tertiary-fixed-dim w-[42%]"></div>
</div>
<span className="font-mono text-xs text-tertiary-fixed-dim font-bold">42</span>
</div>
</div>
</div>
</div>
</div>
{/* Work Crew Telemetry */}
<div>
<h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
<span className="material-symbols-outlined text-[16px]">groups</span>
                            Assigned Crew Telemetry
                        </h3>
<div className="bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
{/* Map placeholder/viz */}
<div className="h-24 bg-surface-dim relative border-b border-outline-variant flex items-center justify-center overflow-hidden">
{/* simulated radar/map background */}
<div className="absolute inset-0 opacity-20" style={{"backgroundImage":"radial-gradient(circle at center, theme('colors.primary-container') 1px, transparent 1px)","backgroundSize":"10px 10px"}}></div>
<span className="material-symbols-outlined text-4xl text-outline-variant">map</span>
<div className="absolute w-3 h-3 bg-primary-container rounded-full shadow-[0_0_10px_theme(colors.primary-container)] animate-ping"></div>
<div className="absolute w-3 h-3 bg-primary-container rounded-full shadow-[0_0_10px_theme(colors.primary-container)]"></div>
</div>
<div className="p-3">
<div className="flex justify-between items-center mb-2 pb-2 border-b border-surface-container-highest">
<div className="flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-inverse-primary text-on-primary flex items-center justify-center text-[10px] font-bold">C1</div>
<span className="font-mono text-sm text-on-surface">CRW-ALPHA-9</span>
</div>
<span className="px-2 py-0.5 rounded-full text-[9px] bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20">ON SITE</span>
</div>
<div className="grid grid-cols-2 gap-2 text-xs">
<div className="flex flex-col gap-0.5">
<span className="text-[9px] text-on-surface-variant uppercase">Foreman Contact</span>
<span className="font-mono text-on-surface">+91 98765 43210</span>
</div>
<div className="flex flex-col gap-0.5">
<span className="text-[9px] text-on-surface-variant uppercase">Current Loc</span>
<span className="font-mono text-on-surface text-primary-fixed-dim">Lat 19.2, Lon 73.1</span>
</div>
</div>
</div>
</div>
</div>
{/* Actions */}
<div className="pt-4 border-t border-outline-variant flex gap-3">
<button className="flex-1 bg-surface border border-outline-variant text-on-surface py-2 rounded text-sm font-medium hover:bg-surface-container-high transition-colors">Modify Block</button>
<button className="flex-1 bg-primary-container text-on-primary-container py-2 rounded text-sm font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:bg-primary transition-colors">Issue Clearance</button>
</div>
</div>
</aside>
</div>
</main>
