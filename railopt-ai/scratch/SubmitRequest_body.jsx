
{/* TopNavBar */}
<header className="bg-surface-container-high dark:bg-surface-container-high font-headline text-on-surface font-bold border-b border-outline-variant shadow-sm fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16">
<div className="flex items-center gap-4">
<span className="text-xl font-headline font-black text-primary-container tracking-tight">RailOpt AI</span>
<div className="hidden md:flex items-center ml-8 relative text-on-surface-variant hover:text-primary-container transition-colors focus-within:text-primary-container">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] pointer-events-none">search</span>
<input className="bg-surface-variant border-none rounded-full py-1.5 pl-10 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary-container outline-none w-64 placeholder-on-surface-variant/50 transition-all" placeholder="Search resources..." type="text"/>
</div>
</div>
<div className="flex items-center gap-2">
<button className="p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer active:scale-95 text-on-surface-variant hover:text-primary-container flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">notifications</span>
</button>
<button className="p-2 rounded-full hover:bg-surface-variant transition-colors cursor-pointer active:scale-95 text-on-surface-variant hover:text-primary-container flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">settings</span>
</button>
<div className="h-8 w-px bg-outline-variant mx-2"></div>
<button className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant hover:border-primary-container transition-colors cursor-pointer active:scale-95 focus:ring-2 focus:ring-primary-container focus:outline-none">
<img alt="User profile" className="w-full h-full object-cover" data-alt="A detailed headshot photograph of a professional railway engineer looking confident in soft, dramatic studio lighting with a deep charcoal background, emphasizing a high-tech modern aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA30HLuqeSiSYnHA1zlO0P21GVcPMDVU3GBiMeafecGmUEJMfveir4lkW-QXvC_N3ozoTYHfRPGWBlaWFj5VU9t1xMv7UibJaOkNHclASbs2sfefsnoT9KFix41T0RhPABl6tBwAHDWxYvM5GtBhsplmi9h7gDQ0N4LYBktM7AFmwhp7XX-YpKFmmnNO7KrSRFk8tCFf-b5now7OCeo7IJOnkkqoKG5ZAhsC2ScnjrQbIBwqjUnMHUDcZ3xywd4dHd0w64qaP_x9yJW"/>
</button>
</div>
</header>
{/* SideNavBar */}
<nav className="bg-surface-container dark:bg-surface-container font-body text-sm font-medium border-r border-outline-variant shadow-md fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col p-4 z-40 w-64 hidden md:flex">
<div className="mb-8 px-2">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center border border-outline-variant">
<img alt="System Status" className="w-full h-full object-cover rounded-lg" data-alt="A clean, minimalist 3D icon of an industrial status monitor glowing subtly in cyan and teal against a dark slate background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1tFxJs7MvGooakzaT6FAByx6r991Nbrp1AdJTu16bXJb46q0syGrmoN2vOx2BznUMA55aHLYkZIcKGNS1AJz17xSl1tzJ5gzao9esWw1xTmlLFz3aC_5W_y6P_XlVEx0oR2NX0Cg-G3_ElpOZ0OZwjIjj71AXK3cFEUGrYzXS2Yj6pJyz8w5v1oggsfhogdUEalQkeOljatMyKgx4ap0B5f-kybyKdG75ztkh5kVKrmhwc75RWwF_95DREgh03ZwrWW2zqGk71cWc"/>
</div>
<div>
<h2 className="text-on-surface font-headline font-bold leading-tight">Operations</h2>
<p className="text-xs text-on-surface-variant">Active Session</p>
</div>
</div>
</div>
<ul className="flex flex-col gap-2 flex-grow">
<li>
<a className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer active:translate-x-1" href="#">
<span className="material-symbols-outlined text-[20px]">dashboard</span>
<span>Dashboard</span>
</a>
</li>
<li>
<a className="flex items-center gap-3 px-4 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-bold cursor-pointer active:translate-x-1" href="#">
<span className="material-symbols-outlined text-[20px]">engineering</span>
<span>Maintenance</span>
</a>
</li>
<li>
<a className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer active:translate-x-1" href="#">
<span className="material-symbols-outlined text-[20px]">history_edu</span>
<span>Logs</span>
</a>
</li>
<li>
<a className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer active:translate-x-1" href="#">
<span className="material-symbols-outlined text-[20px]">hub</span>
<span>Network</span>
</a>
</li>
</ul>
<div className="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-4">
<button className="w-full bg-primary-container text-on-primary-container font-headline font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary-container">
<span className="material-symbols-outlined text-[18px]">add</span>
        New Request
      </button>
<ul className="flex flex-col gap-1">
<li>
<a className="flex items-center gap-3 px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined text-[16px]">verified_user</span>
<span>Security</span>
</a>
</li>
<li>
<a className="flex items-center gap-3 px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined text-[16px]">help</span>
<span>Support</span>
</a>
</li>
</ul>
</div>
</nav>
{/* Main Content Area */}
<main className="md:ml-64 mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto bg-background">
<div className="max-w-7xl mx-auto space-y-6">
{/* Page Header */}
<div className="flex items-center justify-between">
<div>
<h1 className="text-2xl font-headline font-bold text-on-surface">Submit Maintenance Request</h1>
<p className="text-sm text-on-surface-variant mt-1">Log defect telemetry and schedule track resources.</p>
</div>
</div>
{/* Main Grid Layout */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/* Form Section (Bento Card) */}
<div className="lg:col-span-1 bg-surface-container rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
{/* Subtle background glow */}
<div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
<h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
<span className="material-symbols-outlined text-primary-container">edit_document</span>
            Request Details
          </h2>
<form className="flex flex-col gap-5 flex-grow">
{/* Defect Type */}
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">Defect Type</label>
<div className="relative">
<select className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container appearance-none outline-none transition-colors cursor-pointer">
<option>Track Defect</option>
<option>Signal Fault</option>
<option>Traction Fault</option>
<option>OHE Issue</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
</div>
</div>
{/* Corridor Section */}
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">Corridor Section</label>
<div className="relative">
<select className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container appearance-none outline-none transition-colors cursor-pointer">
<option>NDLS-GZB</option>
<option>CSMT-KYN</option>
<option>MAS-AJJ</option>
<option>HWH-BWN</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
</div>
</div>
{/* Asset ID */}
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">Asset ID</label>
<input className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-sm text-on-surface font-mono focus:ring-1 focus:ring-primary-container focus:border-primary-container outline-none transition-colors placeholder-on-surface-variant/50" placeholder="e.g. TRK-492-X" type="text"/>
</div>
{/* Urgency */}
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">Urgency / Criticality</label>
<div className="flex bg-surface-variant p-1 rounded-lg border border-outline-variant">
<label className="flex-1 text-center cursor-pointer">
<input checked="" className="peer hidden" name="urgency" type="radio"/>
<div className="py-1.5 rounded-md text-xs font-medium text-on-surface-variant peer-checked:bg-surface-container peer-checked:text-on-surface peer-checked:shadow-sm transition-all border border-transparent peer-checked:border-outline-variant">Low</div>
</label>
<label className="flex-1 text-center cursor-pointer">
<input className="peer hidden" name="urgency" type="radio"/>
<div className="py-1.5 rounded-md text-xs font-medium text-on-surface-variant peer-checked:bg-surface-container peer-checked:text-amber-400 peer-checked:shadow-sm transition-all border border-transparent peer-checked:border-outline-variant">Medium</div>
</label>
<label className="flex-1 text-center cursor-pointer">
<input className="peer hidden" name="urgency" type="radio"/>
<div className="py-1.5 rounded-md text-xs font-medium text-on-surface-variant peer-checked:bg-surface-container peer-checked:text-error peer-checked:shadow-sm transition-all border border-transparent peer-checked:border-outline-variant">High</div>
</label>
</div>
</div>
{/* Time Window */}
<div className="grid grid-cols-2 gap-4">
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">Start Window</label>
<div className="relative">
<input className="w-full bg-surface-variant border border-outline-variant rounded-lg pl-3 pr-1 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container outline-none transition-colors [color-scheme:dark]" type="datetime-local"/>
</div>
</div>
<div className="space-y-1.5">
<label className="block text-xs font-label text-on-surface-variant tracking-wider uppercase">End Window</label>
<div className="relative">
<input className="w-full bg-surface-variant border border-outline-variant rounded-lg pl-3 pr-1 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container outline-none transition-colors [color-scheme:dark]" type="datetime-local"/>
</div>
</div>
</div>
{/* CTA */}
<div className="mt-auto pt-4 border-t border-outline-variant">
<button className="w-full group bg-primary-container text-on-primary-container font-headline font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary-container shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]" type="button">
                Submit Maintenance Request
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</form>
</div>
{/* Table Section (Bento Card) */}
<div className="lg:col-span-2 bg-surface-container rounded-xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
{/* Table Header / Controls */}
<div className="p-5 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-high/50">
<h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-secondary">table_rows</span>
              My Department Requests
            </h2>
<div className="flex items-center gap-3 w-full sm:w-auto">
{/* Filter Pills */}
<div className="flex bg-surface-variant rounded-lg p-0.5 border border-outline-variant">
<button className="px-3 py-1 rounded-md text-xs font-medium bg-surface-container text-on-surface shadow-sm border border-outline-variant">All</button>
<button className="px-3 py-1 rounded-md text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">Pending</button>
<button className="px-3 py-1 rounded-md text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">Scheduled</button>
</div>
{/* Mini Search */}
<div className="relative flex-grow sm:flex-grow-0">
<span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">search</span>
<input className="w-full sm:w-40 bg-surface-variant border border-outline-variant rounded-lg py-1.5 pl-8 pr-3 text-xs text-on-surface focus:ring-1 focus:ring-primary-container focus:border-primary-container outline-none transition-colors placeholder-on-surface-variant/50" placeholder="Filter ID..." type="text"/>
</div>
</div>
</div>
{/* Table Content */}
<div className="overflow-x-auto flex-grow">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-lowest border-b border-outline-variant">
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold">Request ID</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold">Section</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold">Defect Type</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold">Requested Window</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold text-center">Overdue</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold text-center">Risk</th>
<th className="py-3 px-5 text-xs font-label text-on-surface-variant tracking-wider uppercase font-semibold text-right">Status</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/50 text-sm">
{/* Row 1 */}
<tr className="hover:bg-surface-variant/30 transition-colors group">
<td className="py-3 px-5 font-mono text-primary-container text-xs">#REQ-0923</td>
<td className="py-3 px-5 text-on-surface">NDLS-GZB</td>
<td className="py-3 px-5 text-on-surface-variant">Track Defect</td>
<td className="py-3 px-5 text-on-surface-variant font-mono text-xs">Oct 24, 02:00-06:00</td>
<td className="py-3 px-5 text-center font-mono text-error">2</td>
<td className="py-3 px-5 text-center">
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-error/10 text-error font-mono font-bold text-xs border border-error/20">85</span>
</td>
<td className="py-3 px-5 text-right">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-variant border border-outline-variant text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Pending
                    </span>
</td>
</tr>
{/* Row 2 */}
<tr className="hover:bg-surface-variant/30 transition-colors group">
<td className="py-3 px-5 font-mono text-primary-container text-xs">#REQ-0922</td>
<td className="py-3 px-5 text-on-surface">CSMT-KYN</td>
<td className="py-3 px-5 text-on-surface-variant">Signal Fault</td>
<td className="py-3 px-5 text-on-surface-variant font-mono text-xs">Oct 25, 10:00-14:00</td>
<td className="py-3 px-5 text-center font-mono text-on-surface-variant">-</td>
<td className="py-3 px-5 text-center">
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/10 text-amber-400 font-mono font-bold text-xs border border-amber-400/20">62</span>
</td>
<td className="py-3 px-5 text-right">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-variant border border-outline-variant text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      Scored
                    </span>
</td>
</tr>
{/* Row 3 */}
<tr className="hover:bg-surface-variant/30 transition-colors group">
<td className="py-3 px-5 font-mono text-primary-container text-xs">#REQ-0918</td>
<td className="py-3 px-5 text-on-surface">MAS-AJJ</td>
<td className="py-3 px-5 text-on-surface-variant">OHE Issue</td>
<td className="py-3 px-5 text-on-surface-variant font-mono text-xs">Oct 22, 00:00-04:00</td>
<td className="py-3 px-5 text-center font-mono text-on-surface-variant">-</td>
<td className="py-3 px-5 text-center">
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">24</span>
</td>
<td className="py-3 px-5 text-right">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Scheduled
                    </span>
</td>
</tr>
{/* Row 4 */}
<tr className="hover:bg-surface-variant/30 transition-colors group">
<td className="py-3 px-5 font-mono text-primary-container text-xs">#REQ-0915</td>
<td className="py-3 px-5 text-on-surface">HWH-BWN</td>
<td className="py-3 px-5 text-on-surface-variant">Traction Fault</td>
<td className="py-3 px-5 text-on-surface-variant font-mono text-xs">Oct 26, 22:00-02:00</td>
<td className="py-3 px-5 text-center font-mono text-on-surface-variant">-</td>
<td className="py-3 px-5 text-center">
<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 font-mono font-bold text-xs border border-violet-500/20">45</span>
</td>
<td className="py-3 px-5 text-right">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-variant border border-outline-variant text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                      Proposed
                    </span>
</td>
</tr>
</tbody>
</table>
</div>
{/* Table Footer / Pagination */}
<div className="p-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-highest/30">
<span>Showing 4 of 24 requests</span>
<div className="flex gap-1">
<button className="p-1 rounded hover:bg-surface-variant transition-colors disabled:opacity-50"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
<button className="p-1 rounded hover:bg-surface-variant transition-colors"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
</div>
</div>
</div>
</div>
</div>
</main>
