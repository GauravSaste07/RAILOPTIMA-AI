
{/* TopNavBar */}
<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container-low dark:bg-surface-container-low border-b border-outline-variant shadow-sm text-primary-fixed-dim font-headline text-on-surface font-bold tracking-tight text-xl font-display font-black text-primary-fixed-dim tracking-tighter uppercase cursor-pointer active:scale-95">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-3xl text-primary-fixed-dim">train</span>
<span className="text-xl font-display font-black text-primary-fixed-dim tracking-tighter uppercase">RailOpt AI</span>
</div>
<div className="flex items-center gap-6 text-on-surface-variant hover:text-primary-fixed hover:bg-surface-container-highest transition-colors">
<div className="relative w-64 mr-4">
<input className="w-full bg-surface-container-highest border border-outline-variant rounded-full py-1.5 px-4 text-sm focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim text-on-surface" placeholder="Search corridors, blocks..." type="text"/>
<span className="material-symbols-outlined absolute right-3 top-1.5 text-on-surface-variant text-sm">search</span>
</div>
<button className="hover:text-primary-fixed-dim transition-colors relative"><span className="material-symbols-outlined">notifications</span><span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span></button>
<button className="hover:text-primary-fixed-dim transition-colors"><span className="material-symbols-outlined">settings</span></button>
<button className="hover:text-primary-fixed-dim transition-colors"><span className="material-symbols-outlined">help</span></button>
<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-outline-variant">
<img alt="Admin Profile Avatar" className="w-full h-full object-cover" data-alt="A futuristic UI avatar placeholder, dark mode aesthetic, glowing cyan edges, highly detailed, photorealistic, 4k resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH4fuyAH59hzz_g7xNlqkFcpk_9InXsxMYA7pSPR6vzQpNcgat_v03_NrDoTSVOPFSfXaYdfWnhUlLTW-Nu1uxXityRZq2kiEc22_aB4tLbbuPKTHWPf5UtEz12BN3FfdPz88IiEC0LDEbKqj1dfYz9aFNJivfX2sU6HJvj0SYWO-OAjjIjBGcsfQclHTHeueiEZDMcSpuRXqZJ2zv8FThKHkbRp7007beCjlEoPge4ZvJM5Z7Kj-maeyOuqCe8ax4jizk_kroPtbT"/>
</div>
</div>
</header>
{/* SideNavBar */}
<nav className="fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col py-4 bg-surface-container-lowest dark:bg-surface-container-lowest text-primary-fixed-dim font-label text-sm uppercase tracking-widest font-display font-bold text-on-surface border-r border-outline-variant w-64 group-hover:translate-x-1 z-40">
<div className="px-6 mb-8 mt-4">
<h2 className="text-lg font-bold text-on-surface mb-1">Operations</h2>
<p className="text-xs text-on-surface-variant normal-case">Central Command</p>
</div>
<div className="flex flex-col flex-1 gap-2">
<a className="flex items-center gap-4 px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">dashboard</span>
                Dashboard
            </a>
<a className="flex items-center gap-4 px-6 py-3 bg-secondary-container text-on-secondary-container border-r-4 border-primary-fixed-dim transition-all duration-200" href="#">
<span className="material-symbols-outlined">fact_check</span>
                Admin Approval
            </a>
<a className="flex items-center gap-4 px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">map</span>
                Corridor Maps
            </a>
<a className="flex items-center gap-4 px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">engineering</span>
                Resource Plan
            </a>
<a className="flex items-center gap-4 px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">history</span>
                Audit Logs
            </a>
</div>
<div className="px-6 mb-6">
<button className="w-full flex items-center justify-center gap-2 bg-error-container text-on-error-container py-3 rounded hover:bg-error hover:text-on-error transition-colors font-bold text-xs uppercase tracking-wider">
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings":"'FILL' 1"}}>warning</span>
                Emergency Halt
            </button>
</div>
<div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
<a className="flex items-center gap-4 px-6 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">contact_support</span>
                Support
            </a>
<a className="flex items-center gap-4 px-6 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all duration-200" href="#">
<span className="material-symbols-outlined">logout</span>
                Logout
            </a>
</div>
</nav>
{/* Main Content Area */}
<main className="ml-64 mt-16 min-h-[calc(100vh-64px)] bg-surface-dim">
{/* TopAppBar */}
<div className="bg-surface-container-high/50 backdrop-blur-md px-8 py-6 flex flex-row items-center justify-between border-b border-outline-variant/30 sticky top-16 z-30 transition-transform duration-150 text-primary-fixed-dim font-headline text-2xl font-bold font-bold text-primary">
<div className="flex items-center gap-4">
<div className="w-12 h-12 rounded bg-primary-container/10 flex items-center justify-center text-primary-fixed-dim">
<span className="material-symbols-outlined text-3xl">pending_actions</span>
</div>
<div>
<h1 className="text-2xl font-bold text-on-surface tracking-tight">Corridor Block Approval Queue</h1>
<p className="text-sm font-normal text-on-surface-variant mt-1">15 Proposed Blocks Awaiting Signoff</p>
</div>
</div>
<div className="flex gap-3">
<button className="px-4 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-2 text-sm font-medium">
<span className="material-symbols-outlined text-sm">download</span>
                    Export CSV
                </button>
<button className="px-5 py-2 bg-primary-container text-on-primary-container rounded hover:bg-primary transition-colors flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]">
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings":"'FILL' 1"}}>done_all</span>
                    Batch Approve
                </button>
</div>
</div>
<div className="p-8 max-w-7xl mx-auto space-y-8">
{/* Section 1: Pending Proposed Blocks */}
<section>
<div className="flex items-center justify-between mb-6">
<h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary-fixed-dim">hourglass_top</span>
                        Pending Proposed Blocks
                    </h2>
<div className="flex gap-2">
<span className="px-3 py-1 bg-surface-container rounded-full text-xs font-mono text-on-surface-variant border border-outline-variant">Sorted by: Priority</span>
</div>
</div>
<div className="grid grid-cols-1 gap-6">
{/* Block Card 1 */}
<div className="glass-panel rounded-lg p-6 flex flex-col md:flex-row gap-6 hover:border-primary-fixed-dim/50 transition-colors relative overflow-hidden group">
<div className="absolute top-0 left-0 w-1 h-full bg-primary-fixed-dim"></div>
<div className="flex-1 space-y-4">
<div className="flex justify-between items-start">
<div>
<div className="flex items-center gap-3 mb-1">
<span className="font-mono text-lg font-bold text-primary-fixed-dim glow-cyan">BLK-7829</span>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-xs font-medium text-on-surface-variant border border-outline-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">layers</span>
                                            4 Requests
                                        </span>
</div>
<h3 className="text-xl font-bold text-on-surface">NDLS - GZB (Main Line)</h3>
</div>
<div className="text-right">
<div className="font-mono text-xl font-bold text-on-surface">00:30 - 05:30</div>
<div className="text-sm text-on-surface-variant">Duration: 5h 0m</div>
</div>
</div>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 rounded text-xs font-bold bg-[#7C2D12]/30 text-[#F97316] border border-[#F97316]/30">Engineering</span>
<span className="px-2 py-1 rounded text-xs font-bold bg-[#4C1D95]/30 text-[#A78BFA] border border-[#A78BFA]/30">S&amp;T</span>
<span className="px-2 py-1 rounded text-xs font-bold bg-[#083344]/30 text-[#22D3EE] border border-[#22D3EE]/30">Traction</span>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded bg-surface-container-low border border-outline-variant/30">
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">AI Confidence</div>
<div className="font-mono text-lg text-secondary-fixed">95%</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Risk Mitigated</div>
<div className="font-mono text-lg text-on-surface">2.75x</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Trains Affected</div>
<div className="font-mono text-lg text-on-surface">12 (Rescheduled)</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Resource Fit</div>
<div className="font-mono text-lg text-on-surface">Optimal</div>
</div>
</div>
</div>
<div className="flex flex-col justify-center gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
<button className="w-full py-2 bg-[#064E3B] text-[#34D399] border border-[#34D399]/50 rounded hover:bg-[#065F46] transition-colors font-bold text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">check_circle</span>
                                Approve Block
                            </button>
<button className="w-full py-2 bg-transparent text-error border border-error/50 rounded hover:bg-error/10 transition-colors font-bold text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">cancel</span>
                                Reject Block
                            </button>
<button className="w-full py-2 bg-transparent text-primary-fixed-dim border border-transparent rounded hover:bg-primary-fixed-dim/10 transition-colors font-medium text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">edit_calendar</span>
                                Modify
                            </button>
</div>
</div>
{/* Block Card 2 */}
<div className="glass-panel rounded-lg p-6 flex flex-col md:flex-row gap-6 hover:border-primary-fixed-dim/50 transition-colors relative overflow-hidden group">
<div className="absolute top-0 left-0 w-1 h-full bg-tertiary-fixed-dim"></div>
<div className="flex-1 space-y-4">
<div className="flex justify-between items-start">
<div>
<div className="flex items-center gap-3 mb-1">
<span className="font-mono text-lg font-bold text-tertiary-fixed-dim">BLK-7830</span>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-xs font-medium text-on-surface-variant border border-outline-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">layers</span>
                                            2 Requests
                                        </span>
</div>
<h3 className="text-xl font-bold text-on-surface">CSMT - KYN (Slow Line)</h3>
</div>
<div className="text-right">
<div className="font-mono text-xl font-bold text-on-surface">11:00 - 15:00</div>
<div className="text-sm text-on-surface-variant">Duration: 4h 0m</div>
</div>
</div>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 rounded text-xs font-bold bg-[#7C2D12]/30 text-[#F97316] border border-[#F97316]/30">Engineering</span>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded bg-surface-container-low border border-outline-variant/30">
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">AI Confidence</div>
<div className="font-mono text-lg text-tertiary-fixed-dim">82%</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Risk Mitigated</div>
<div className="font-mono text-lg text-on-surface">1.50x</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Trains Affected</div>
<div className="font-mono text-lg text-on-surface">8 (Rerouted)</div>
</div>
<div>
<div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Resource Fit</div>
<div className="font-mono text-lg text-on-surface">Marginal</div>
</div>
</div>
</div>
<div className="flex flex-col justify-center gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
<button className="w-full py-2 bg-[#064E3B] text-[#34D399] border border-[#34D399]/50 rounded hover:bg-[#065F46] transition-colors font-bold text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">check_circle</span>
                                Approve Block
                            </button>
<button className="w-full py-2 bg-transparent text-error border border-error/50 rounded hover:bg-error/10 transition-colors font-bold text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">cancel</span>
                                Reject Block
                            </button>
<button className="w-full py-2 bg-transparent text-primary-fixed-dim border border-transparent rounded hover:bg-primary-fixed-dim/10 transition-colors font-medium text-sm flex justify-center items-center gap-2">
<span className="material-symbols-outlined text-sm">edit_calendar</span>
                                Modify
                            </button>
</div>
</div>
</div>
</section>
{/* Section 2: Recently Actioned Blocks */}
<section className="pt-8 border-t border-outline-variant/30">
<div className="flex items-center justify-between mb-6">
<h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-on-surface-variant">history</span>
                        Recently Actioned Blocks
                    </h2>
<button className="text-sm font-medium text-primary-fixed-dim hover:text-primary transition-colors flex items-center gap-1">
                        View All History <span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
<div className="glass-panel rounded-lg overflow-hidden border border-outline-variant/50">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container border-b border-outline-variant/50">
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Block ID</th>
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Section</th>
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Status</th>
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Timestamp</th>
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Actioned By</th>
<th className="py-3 px-4 font-mono text-xs text-on-surface-variant uppercase tracking-wider">Final Window</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/30">
<tr className="hover:bg-surface-container-highest/50 transition-colors">
<td className="py-3 px-4 font-mono text-sm font-bold text-on-surface">BLK-7820</td>
<td className="py-3 px-4 text-sm text-on-surface">MAS - BZA</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#064E3B]/40 text-[#34D399] border border-[#34D399]/30">
<span className="material-symbols-outlined text-[14px]">check</span> Approved
                                    </span>
</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">2023-10-27 14:23</td>
<td className="py-3 px-4 text-sm text-on-surface-variant">R. Kumar (DRM)</td>
<td className="py-3 px-4 font-mono text-sm text-on-surface">22:00 - 04:00</td>
</tr>
<tr className="hover:bg-surface-container-highest/50 transition-colors">
<td className="py-3 px-4 font-mono text-sm font-bold text-on-surface">BLK-7819</td>
<td className="py-3 px-4 text-sm text-on-surface">HWH - BWN</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#7F1D1D]/40 text-[#F87171] border border-[#F87171]/30">
<span className="material-symbols-outlined text-[14px]">close</span> Rejected
                                    </span>
</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">2023-10-27 13:45</td>
<td className="py-3 px-4 text-sm text-on-surface-variant">S. Das (Sr. DOM)</td>
<td className="py-3 px-4 font-mono text-sm text-on-surface-variant">-</td>
</tr>
<tr className="hover:bg-surface-container-highest/50 transition-colors">
<td className="py-3 px-4 font-mono text-sm font-bold text-on-surface">BLK-7815</td>
<td className="py-3 px-4 text-sm text-on-surface">SBC - MYS</td>
<td className="py-3 px-4">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#064E3B]/40 text-[#34D399] border border-[#34D399]/30">
<span className="material-symbols-outlined text-[14px]">check</span> Approved
                                    </span>
</td>
<td className="py-3 px-4 font-mono text-xs text-on-surface-variant">2023-10-27 11:10</td>
<td className="py-3 px-4 text-sm text-on-surface-variant">System Auto-Signoff</td>
<td className="py-3 px-4 font-mono text-sm text-on-surface">01:00 - 03:30</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>
