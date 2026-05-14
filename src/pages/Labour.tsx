export default function Labour() {
  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Labour Management</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm">Workforce analytics and daily wage tracking</p>
        </div>
        <div className="flex gap-base w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center justify-center h-touch-target-min px-6 rounded-full bg-secondary text-on-secondary font-table-data whitespace-nowrap active:opacity-80 transition-opacity">
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Log Attendance
          </button>
          <button className="flex items-center justify-center h-touch-target-min px-4 rounded-full border border-outline text-on-surface font-table-data whitespace-nowrap hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined mr-2 text-[20px]">filter_list</span>
            Filter Roles
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-secondary flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Total Workforce</span>
            <span className="material-symbols-outlined text-outline">groups</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">142</div>
            <div className="font-table-data text-table-data text-primary mt-1 flex items-center">
              <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +5 today
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-primary flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Active on Site</span>
            <span className="material-symbols-outlined text-outline">engineering</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">128</div>
            <div className="font-table-data text-table-data text-error mt-1">14 Absent</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-tertiary-container flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Daily Wage Cost</span>
            <span className="material-symbols-outlined text-outline">payments</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">$12.4k</div>
            <div className="font-table-data text-table-data text-on-surface-variant mt-1">Est. baseline $11.8k</div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg border-l-4 border-l-secondary-container flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-label-caps text-outline">Productivity Index</span>
            <span className="material-symbols-outlined text-outline">speed</span>
          </div>
          <div>
            <div className="font-display-metrics text-display-metrics text-on-surface">88%</div>
            <div className="w-full bg-surface-variant h-2 rounded-full mt-2">
              <div className="bg-secondary h-2 rounded-full w-[88%]"></div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="font-headline-md text-headline-md text-on-surface mt-stack-md border-b border-outline-variant pb-2">Category Breakdown</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
          <div className="flex items-center gap-stack-sm mb-stack-md">
            <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined">handyman</span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface ml-2">Skilled Labour</h4>
            <span className="ml-auto bg-surface-variant text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full">45 Workers</span>
          </div>
          <div className="space-y-stack-md">
            <div className="flex justify-between items-center">
              <span className="font-table-data text-table-data text-on-surface-variant">Carpenters</span>
              <div className="flex items-center gap-4">
                <span className="font-table-data text-table-data font-bold">18</span>
                <span className="text-outline font-label-caps text-label-caps w-16 text-right">$120/day</span>
              </div>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full"><div className="bg-primary h-1 rounded-full w-[40%]"></div></div>
            
            <div className="flex justify-between items-center">
              <span className="font-table-data text-table-data text-on-surface-variant">Masons</span>
              <div className="flex items-center gap-4">
                <span className="font-table-data text-table-data font-bold">15</span>
                <span className="text-outline font-label-caps text-label-caps w-16 text-right">$115/day</span>
              </div>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full"><div className="bg-primary h-1 rounded-full w-[33%]"></div></div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
          <div className="flex items-center gap-stack-sm mb-stack-md">
            <div className="w-10 h-10 rounded bg-surface-variant text-on-surface flex items-center justify-center border border-outline">
              <span className="material-symbols-outlined">accessibility_new</span>
            </div>
            <h4 className="font-headline-md text-headline-md text-on-surface ml-2">Unskilled Labour</h4>
            <span className="ml-auto bg-surface-variant text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full">97 Workers</span>
          </div>
          <div className="space-y-stack-md">
            <div className="flex justify-between items-center">
              <span className="font-table-data text-table-data text-on-surface-variant">General Helpers</span>
              <div className="flex items-center gap-4">
                <span className="font-table-data text-table-data font-bold">65</span>
                <span className="text-outline font-label-caps text-label-caps w-16 text-right">$75/day</span>
              </div>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full"><div className="bg-outline h-1 rounded-full w-[67%]"></div></div>
            
            <div className="flex justify-between items-center">
              <span className="font-table-data text-table-data text-on-surface-variant">Material Carriers</span>
              <div className="flex items-center gap-4">
                <span className="font-table-data text-table-data font-bold">32</span>
                <span className="text-outline font-label-caps text-label-caps w-16 text-right">$80/day</span>
              </div>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full"><div className="bg-outline h-1 rounded-full w-[33%]"></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
