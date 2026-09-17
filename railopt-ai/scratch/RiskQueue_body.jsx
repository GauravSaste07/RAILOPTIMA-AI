
{/* TopAppBar */}
<header className="bg-surface-dim dark:bg-surface-dim border-b border-outline-variant shadow-sm flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50">
<div className="flex items-center gap-4">
<h1 className="text-xl font-black tracking-tighter text-primary-fixed-dim dark:text-primary-fixed-dim font-headline">RailOpt AI</h1>
</div>
<div className="flex items-center gap-4 ml-auto">
<div className="relative hidden md:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input className="bg-surface-container rounded-full py-1.5 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim border border-outline-variant w-64 placeholder-on-surface-variant" placeholder="Search queues, IDs..." type="text"/>
</div>
<button className="p-2 text-on-surface-variant hover:bg-surface-variant transition-colors rounded-full cursor-pointer active:opacity-80 transition-all flex items-center justify-center">
<span className="material-symbols-outlined">lock</span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-variant transition-colors rounded-full cursor-pointer active:opacity-80 transition-all flex items-center justify-center relative">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
</button>
<button className="p-2 text-on-surface-variant hover:bg-surface-variant transition-colors rounded-full cursor-pointer active:opacity-80 transition-all flex items-center justify-center">
<span className="material-symbols-outlined">settings</span>
</button>
<div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ml-2">
<img alt="Chief Dispatcher Profile" className="w-full h-full object-cover" data-alt="A realistic profile photo of a Chief Dispatcher in a modern control room. The scene is illuminated by the soft, cool blue and cyan glow of monitor screens, creating a professional, high-tech, and serious mood." src="https://lh3.googleusercontent.com/aida-public/AB6AXuABdsAiu50pNTnM0Vf2ZY-C34m0EdU0qc7uwVtcj5d7AGGw9PzrcOT0q2sn6L6_UNBNvjLEYtNgZkkFJ_-ri33ir5J9B7apwE40GCWDg7T_lKaf7XGOFi0ouwCeaAdGKEkqlO2uGQnuqhycQ8jwtEP-E0P_Foe2IQq4InFZzu-gcEOPDAHapfaU1d8NsLsXwwhoB7KUeI93Im49hbklv2gVgAPsG0OD1VwaE-XjVMpuDSmdzRC4Nyokl9OzMYPpEOOHBx03699dg88m"/>
</div>
</div>
</header>
<div className="flex flex-1 overflow-hidden relative">
{/* SideNavBar */}
<nav className="hidden md:flex flex-col bg-surface-container dark:bg-surface-container border-r border-outline-variant w-64 py-6 shrink-0 h-full z-40">
<div className="px-6 mb-8 flex items-center gap-3">
<div className="w-10 h-10 rounded-lg overflow-hidden border border-outline-variant shrink-0">
<img alt="System Operator" className="w-full h-full object-cover" data-alt="A close-up of a system operator's glowing ID badge with abstract technological circuitry patterns. The lighting is dramatic, dark, and industrial, with stark cyan accents highlighting the badge details." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7g3g6cp6drRJBUkCruEImUY5-Wo-rltOgIVGIN0OVD5eamNv9_AYtJRNuNnob-3p7_00aw2IaFgkoHto-ri2J4GneCSvpptoWzN9NLK_kL9UxDJXbWpJHdXbggT3-9_wrja94bmcpAkfmrP4i5hN8SEm8kpM9VxQo4EUd44EWIWnQ2XWHKMqP7to880RC3gGX4sBNulezRd2kNvJq17MQ_tBoafGooHpWRHRp3WejTR5hnOC4v95TnUeVmNytbyAr0c5M1LJ46Nch"/>
</div>
<div>
<h2 className="font-headline font-semibold text-on-surface text-sm">Ops Center</h2>
<p className="text-on-surface-variant text-xs">Sector-7G</p>
</div>
</div>
<div className="flex-1 flex flex-col gap-1 px-3">
<a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200 group" href="#">
<span className="material-symbols-outlined text-lg group-active:scale-95 transition-transform">dashboard</span>
<span className="font-label uppercase tracking-widest text-[10px] font-semibold">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container border-r-4 border-primary-fixed-dim font-bold transition-all duration-200 group" href="#">
<span className="material-symbols-outlined text-lg group-active:scale-95 transition-transform" style={{"fontVariationSettings":"'FILL' 1"}}>warning</span>
<span className="font-label uppercase tracking-widest text-[10px] font-semibold">Risk Queue</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200 group" href="#">
<span className="material-symbols-outlined text-lg group-active:scale-95 transition-transform">engineering</span>
<span className="font-label uppercase tracking-widest text-[10px] font-semibold">Maintenance</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200 group" href="#">
<span className="material-symbols-outlined text-lg group-active:scale-95 transition-transform">terminal</span>
<span className="font-label uppercase tracking-widest text-[10px] font-semibold">Logs</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200 group" href="#">
<span className="material-symbols-outlined text-lg group-active:scale-95 transition-transform">hub</span>
<span className="font-label uppercase tracking-widest text-[10px] font-semibold">Network</span>
</a>
</div>
<div className="px-6 mb-4 mt-auto">
<button className="w-full bg-error/10 hover:bg-error/20 text-error border border-error/30 py-2 rounded font-label uppercase tracking-wider text-[10px] font-bold flex items-center justify-center gap-2 transition-colors">
<span className="material-symbols-outlined text-sm">emergency</span>
                    Emergency Stop
                </button>
</div>
<div className="mt-4 flex flex-col gap-1 px-3 border-t border-outline-variant pt-4">
<a className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200" href="#">
<span className="material-symbols-outlined text-base">help</span>
<span className="font-label uppercase tracking-widest text-[10px]">Support</span>
</a>
<a className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all duration-200" href="#">
<span className="material-symbols-outlined text-base">logout</span>
<span className="font-label uppercase tracking-widest text-[10px]">Sign Out</span>
</a>
</div>
</nav>
{/* Main Content */}
<main className="flex-1 overflow-y-auto flex flex-col relative z-10 bg-background bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMGQxNTE2Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMTMyLCAxNDcsIDE1MCwgMC4wNSkiPjwvcmVjdD4KPC9zdmc+')]">
<div className="p-6 lg:p-8 flex-1 flex flex-col max-w-[1600px] w-full mx-auto">
{/* Page Header & Tabs */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
<div>
<h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight mb-1 flex items-center gap-2">
<span className="material-symbols-outlined text-primary-fixed-dim">query_stats</span>
                            AI Risk Scoring Queue
                        </h2>
<p className="text-sm text-on-surface-variant">Real-time telemetric analysis and conflict resolution for maintenance requests.</p>
</div>
<div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant self-start">
<button className="px-4 py-1.5 rounded-md bg-surface-variant text-primary-fixed-dim font-medium text-sm shadow-sm transition-colors">All</button>
<button className="px-4 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 font-medium text-sm transition-colors flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-error"></span>
                            High Risk
                        </button>
<button className="px-4 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 font-medium text-sm transition-colors flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Conflict Detected
                        </button>
</div>
</div>
{/* High-Density Table (Bento/Card style wrapper) */}
<div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse whitespace-nowrap">
<thead>
<tr className="bg-surface-container-highest border-b border-outline-variant text-xs uppercase tracking-wider text-on-surface-variant font-label">
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface flex items-center gap-1 group">
                                        Request ID
                                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_downward</span>
</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface">Corridor Sec.</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface">Department</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface">Defect Type</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface">Requested Window</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface">Conflict Status</th>
<th className="py-3 px-4 font-semibold cursor-pointer hover:text-on-surface text-right group flex items-center justify-end gap-1">
<span className="material-symbols-outlined text-[14px] text-primary-fixed-dim">arrow_downward</span>
                                        Risk Score
                                    </th>
<th className="py-3 px-4 font-semibold w-10"></th>
</tr>
</thead>
<tbody className="text-sm divide-y divide-outline-variant/50">
{/* Row 1 (High Risk / Open Panel) */}
<tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer" onClick="document.getElementById('diagnostics-panel').classList.remove('panel-closed'); document.getElementById('diagnostics-panel').classList.add('panel-open');">
<td className="py-3 px-4 font-mono text-primary-fixed-dim font-medium">REQ-0923</td>
<td className="py-3 px-4 text-on-surface">NDLS-GZB</td>
<td className="py-3 px-4 text-on-surface-variant">Traction</td>
<td className="py-3 px-4 text-on-surface">Catenary Sag</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Oct 24, 02:00-06:00</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium badge-amber">
<span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            Conflict: Same Slot
                                        </span>
</td>
<td className="py-3 px-4 font-mono text-right font-bold score-red">0.89</td>
<td className="py-3 px-4 text-right">
<button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</td>
</tr>
{/* Row 2 */}
<tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer">
<td className="py-3 px-4 font-mono text-on-surface font-medium">REQ-0924</td>
<td className="py-3 px-4 text-on-surface">MCTM-JAT</td>
<td className="py-3 px-4 text-on-surface-variant">Track</td>
<td className="py-3 px-4 text-on-surface">Rail Fracture</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Oct 24, 11:30-14:00</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium badge-red">
<span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                            Emergency Priority
                                        </span>
</td>
<td className="py-3 px-4 font-mono text-right font-bold score-red">0.94</td>
<td className="py-3 px-4 text-right">
<button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</td>
</tr>
{/* Row 3 */}
<tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer">
<td className="py-3 px-4 font-mono text-on-surface font-medium">REQ-0918</td>
<td className="py-3 px-4 text-on-surface">BCT-BDTS</td>
<td className="py-3 px-4 text-on-surface-variant">S&amp;T</td>
<td className="py-3 px-4 text-on-surface">Point Failure</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Oct 25, 01:00-03:00</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium badge-green">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Clean Slot
                                        </span>
</td>
<td className="py-3 px-4 font-mono text-right font-medium score-amber">0.42</td>
<td className="py-3 px-4 text-right">
<button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</td>
</tr>
{/* Row 4 */}
<tr className="hover:bg-surface-variant/30 transition-colors group cursor-pointer">
<td className="py-3 px-4 font-mono text-on-surface font-medium">REQ-0912</td>
<td className="py-3 px-4 text-on-surface">HWH-BWN</td>
<td className="py-3 px-4 text-on-surface-variant">Track</td>
<td className="py-3 px-4 text-on-surface">Ballast Packing</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">Oct 26, 10:00-16:00</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium badge-green">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Clean Slot
                                        </span>
</td>
<td className="py-3 px-4 font-mono text-right font-medium score-green">0.18</td>
<td className="py-3 px-4 text-right">
<button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>
{/* Footer (Inline) */}
<footer className="flex justify-between items-center py-4 mt-auto border-t border-outline-variant/30 text-on-surface-variant text-[10px] font-body tracking-tight uppercase">
<p>© 2024 RAILOPT AI - CLASSIFIED SYSTEM PROTOCOL</p>
<div className="flex gap-4">
<a className="hover:text-primary-fixed transition-colors" href="#">Security Policy</a>
<a className="hover:text-primary-fixed transition-colors" href="#">Legal Disclosure</a>
<a className="hover:text-primary-fixed transition-colors" href="#">Maintenance Schedule</a>
</div>
</footer>
</div>
</main>
{/* Slide-over Side Panel (AI Risk Diagnostics) */}
<aside className="absolute right-0 top-0 bottom-0 w-[420px] bg-surface-container-high border-l border-outline-variant shadow-2xl flex flex-col panel-closed z-40 max-w-full" id="diagnostics-panel">
<div className="flex items-center justify-between p-5 border-b border-outline-variant">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-error/20 text-error border border-error/30">REQ-0923</span>
<span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-fixed-dim/20 text-primary-fixed-dim border border-primary-fixed-dim/30">XGBoost 94.2%</span>
</div>
<h3 className="font-headline font-semibold text-lg text-on-surface">AI Risk Diagnostics</h3>
</div>
<button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors" onClick="document.getElementById('diagnostics-panel').classList.remove('panel-open'); document.getElementById('diagnostics-panel').classList.add('panel-closed');">
<span className="material-symbols-outlined">close</span>
</button>
</div>
<div className="flex-1 overflow-y-auto p-5 space-y-6">
{/* Breakdown */}
<div>
<h4 className="text-xs uppercase font-label tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
<span className="material-symbols-outlined text-[16px]">bar_chart</span>
                        Feature Importance
                    </h4>
<div className="space-y-4">
{/* Bar 1 */}
<div>
<div className="flex justify-between text-xs mb-1">
<span className="text-on-surface">Urgency / Overdue Days</span>
<span className="font-mono text-error font-medium">34%</span>
</div>
<div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-error rounded-full" style={{"width":"34%"}}></div>
</div>
</div>
{/* Bar 2 */}
<div>
<div className="flex justify-between text-xs mb-1">
<span className="text-on-surface">Corridor Traffic Density</span>
<span className="font-mono text-amber-500 font-medium">28%</span>
</div>
<div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-amber-500 rounded-full" style={{"width":"28%"}}></div>
</div>
</div>
{/* Bar 3 */}
<div>
<div className="flex justify-between text-xs mb-1">
<span className="text-on-surface">Asset Stress Index</span>
<span className="font-mono text-primary-fixed-dim font-medium">18%</span>
</div>
<div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-primary-fixed-dim rounded-full" style={{"width":"18%"}}></div>
</div>
</div>
{/* Bar 4 */}
<div>
<div className="flex justify-between text-xs mb-1">
<span className="text-on-surface">Asset Base Criticality</span>
<span className="font-mono text-secondary font-medium">12%</span>
</div>
<div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{"width":"12%"}}></div>
</div>
</div>
{/* Bar 5 */}
<div>
<div className="flex justify-between text-xs mb-1">
<span className="text-on-surface">Defect Classification</span>
<span className="font-mono text-secondary-fixed-dim font-medium">8%</span>
</div>
<div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-secondary-fixed-dim rounded-full" style={{"width":"8%"}}></div>
</div>
</div>
</div>
</div>
<div className="glass-panel p-4 rounded-lg border border-error/30 bg-error/5 relative overflow-hidden">
<div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
<div className="flex gap-3">
<span className="material-symbols-outlined text-error mt-0.5">warning</span>
<div>
<h5 className="text-sm font-semibold text-on-surface mb-1">Critical Insight</h5>
<p className="text-xs text-on-surface-variant leading-relaxed">High risk score driven by overlapping maintenance requests on the NDLS-GZB corridor during peak freight transit windows. Rescheduling recommended.</p>
</div>
</div>
</div>
</div>
<div className="p-5 border-t border-outline-variant bg-surface-container-high space-y-3">
<button className="w-full bg-primary-fixed-dim hover:bg-surface-tint text-on-primary-fixed font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-fixed-dim/20">
                    Proceed to Optimization
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
<button className="w-full bg-transparent border border-outline hover:border-outline-variant hover:bg-surface-variant text-on-surface font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    Manual Override
                    <span className="material-symbols-outlined text-sm">edit_document</span>
</button>
</div>
</aside>
</div>
