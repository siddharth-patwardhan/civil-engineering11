export default function Materials() {
  return (
    <>
      <section className="flex flex-col gap-stack-md">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Material Library</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Search, compare, and add structural materials to your estimate.</p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-stack-sm w-full mt-2">
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input type="text" placeholder="Search by name, spec, or vendor (e.g. 'Rebar #4')" className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" />
            </div>
            <button className="h-touch-target-min px-gutter bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-center gap-2 text-on-surface hover:bg-surface-container transition-colors shadow-sm whitespace-nowrap">
                <span className="material-symbols-outlined">tune</span>
                <span className="font-table-data text-table-data">Filters</span>
            </button>
        </div>
      </section>

      <section className="flex flex-col gap-stack-sm mt-stack-md">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-sm">history</span>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Recently Used & Favorites</h3>
        </div>
        <div className="flex gap-stack-md overflow-x-auto hide-scrollbar pb-2">
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-surface-container-lowest border border-outline-variant rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-secondary text-[18px] fill">star</span>
                <span className="font-table-data text-table-data text-on-surface">Portland Cement T-I</span>
            </button>
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-surface-container-lowest border border-outline-variant rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-outline text-[18px]">schedule</span>
                <span className="font-table-data text-table-data text-on-surface">Rebar Grade 60 (#4)</span>
            </button>
            <button className="shrink-0 flex items-center gap-2 px-4 h-10 bg-surface-container-lowest border border-outline-variant rounded-full hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-outline text-[18px]">schedule</span>
                <span className="font-table-data text-table-data text-on-surface">Crushed Stone (3/4")</span>
            </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mt-stack-md">
        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter flex flex-col gap-stack-md hover:border-outline transition-all group col-span-1 md:col-span-2 lg:col-span-2 shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-surface-variant to-surface-tint border border-outline-variant flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant">texture</span>
                    </div>
                    <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">Ready-Mix Concrete (3000 PSI)</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-1 rounded">Concrete & Masonry</span>
                            <span className="font-label-caps text-label-caps text-secondary bg-surface-container-low border border-secondary/20 px-2 py-1 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">verified</span> Standard Spec
                            </span>
                        </div>
                    </div>
                </div>
                <button className="text-secondary hover:text-primary-container p-1"><span className="material-symbols-outlined fill">star</span></button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-md border-l-4 border-primary pl-base py-2 bg-surface-bright rounded-r-lg mt-2">
                <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline mb-1">Base Rate</span>
                    <div className="flex items-baseline gap-1">
                        <span className="font-display-metrics text-display-metrics text-on-surface tracking-tight">$128.50</span>
                        <span className="font-table-data text-table-data text-outline">/ Cu. Yd.</span>
                    </div>
                </div>
                <div className="flex flex-col justify-end pb-1">
                    <span className="font-label-caps text-label-caps text-outline mb-1">30-Day Trend</span>
                    <div className="flex items-center gap-2 text-error">
                        <span className="material-symbols-outlined">trending_up</span>
                        <span className="font-table-data text-table-data font-bold">+4.2%</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center pt-stack-sm border-t border-outline-variant mt-auto gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex flex-col">
                        <span className="font-label-caps text-label-caps text-outline">Primary Vendor</span>
                        <span className="font-table-data text-table-data text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span> National Mix Co.
                        </span>
                    </div>
                </div>
                <button className="w-full sm:w-auto h-touch-target-min px-6 bg-secondary text-on-secondary rounded-lg font-table-data text-table-data font-bold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm">
                    <span className="material-symbols-outlined">add</span> Add to Estimate
                </button>
            </div>
        </article>

        <article className="bg-surface-container-lowest border border-outline-variant rounded-xl p-gutter flex flex-col gap-stack-md hover:border-outline transition-all group shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">Rebar Grade 60 (#4)</h3>
                    <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-1 rounded inline-block mt-2">Metals & Steel</span>
                </div>
                <button className="text-outline-variant hover:text-primary p-1"><span className="material-symbols-outlined">star</span></button>
            </div>
            
            <div className="flex flex-col gap-2 border-l-4 border-outline-variant pl-base py-1 mt-2">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="font-label-caps text-label-caps text-outline mb-1">Base Rate</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">$845.00</span>
                            <span className="font-table-data text-table-data text-outline">/ Ton</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-secondary mb-1">
                        <span className="material-symbols-outlined text-[18px]">trending_down</span>
                        <span className="font-table-data text-table-data font-bold">-1.2%</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center pt-stack-sm border-t border-outline-variant mt-auto">
                <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline">Vendor</span>
                    <span className="font-table-data text-table-data text-on-surface truncate max-w-[120px]">Apex Steel</span>
                </div>
                <button className="h-10 px-4 bg-surface-container border border-outline-variant text-primary rounded-lg font-table-data text-table-data hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add</span> Add
                </button>
            </div>
        </article>
      </section>
    </>
  );
}
