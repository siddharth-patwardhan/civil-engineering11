export default function Reports() {
  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md border-b border-outline-variant pb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports Center</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">Manage, preview, and distribute project documentation.</p>
        </div>
        <div className="flex gap-base">
          <button className="h-touch-target-min px-stack-md flex items-center gap-base border border-outline text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-table-data text-table-data">
            <span className="material-symbols-outlined">filter_list</span> Filter
          </button>
          <button onClick={() => window.print()} className="h-touch-target-min px-stack-md flex items-center gap-base bg-secondary text-on-secondary rounded-lg hover:bg-[#3b39c6] transition-colors font-table-data text-table-data shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
            <span className="material-symbols-outlined">download</span> Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mt-stack-md">
        <article className="bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-48 w-full bg-surface-container-low border-b border-outline-variant relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
            <span className="material-symbols-outlined absolute text-[64px] text-primary/80 fill">description</span>
          </div>
          <div className="p-stack-lg flex flex-col flex-1">
            <div className="flex justify-between items-start mb-stack-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Bill of Quantities (BOQ)</h3>
              <span className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-primary border border-outline-variant">PDF</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mb-stack-lg">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span> Generated On: Oct 24, 2023
            </p>
            <div className="mt-auto flex items-center gap-base pt-stack-md border-t border-outline-variant/30">
              <button onClick={() => window.print()} className="flex-1 h-touch-target-min bg-secondary text-on-secondary rounded-lg font-table-data text-table-data flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                <span className="material-symbols-outlined">download</span> Download
              </button>
              <button className="h-touch-target-min w-touch-target-min border border-outline text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors"><span className="material-symbols-outlined">share</span></button>
            </div>
          </div>
        </article>

        <article className="bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-48 w-full bg-surface-container-low border-b border-outline-variant relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
            <span className="material-symbols-outlined absolute text-[64px] text-primary/80 fill">request_quote</span>
          </div>
          <div className="p-stack-lg flex flex-col flex-1">
            <div className="flex justify-between items-start mb-stack-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Client Quotation</h3>
              <span className="bg-surface-container px-2 py-1 rounded font-label-caps text-label-caps text-primary border border-outline-variant">PDF</span>
            </div>
             <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mb-stack-lg">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span> Generated On: Oct 23, 2023
            </p>
            <div className="mt-auto flex items-center gap-base pt-stack-md border-t border-outline-variant/30">
              <button onClick={() => window.print()} className="flex-1 h-touch-target-min bg-secondary text-on-secondary rounded-lg font-table-data text-table-data flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                <span className="material-symbols-outlined">download</span> Download
              </button>
              <button className="h-touch-target-min w-touch-target-min border border-outline text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors"><span className="material-symbols-outlined">share</span></button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
