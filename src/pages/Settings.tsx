export default function Settings() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
        
        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">domain</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Company Profile</h2>
            </div>
            
            <div className="flex flex-col gap-stack-md">
                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Company Name</label>
                    <input type="text" value="Apex Civil Engineering" className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all" />
                </div>
                
                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Registration ID</label>
                    <input type="text" value="ACE-9823-CIV" className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all" />
                </div>
                
                <div>
                    <label className="font-label-caps text-label-caps text-on-surface-variant block mb-stack-sm">Primary Contact</label>
                    <input type="email" value="admin@apexcivil.com" className="w-full h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all" />
                </div>
                
                <button className="h-touch-target-min w-full bg-secondary text-on-secondary font-table-data text-table-data rounded hover:bg-on-secondary-fixed-variant transition-colors active:scale-[0.98]">
                    Save Company Details
                </button>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Financial Preferences</h2>
            </div>
            
            <div className="flex flex-col gap-stack-md">
                <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Default Tax Rate (GST/VAT)</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Applied automatically to new estimates</span>
                    </div>
                    <div className="relative w-32">
                        <input type="number" step="0.1" value="18.5" className="w-full h-touch-target-min pl-gutter pr-8 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none text-right transition-all" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body-md text-body-md text-on-surface-variant">%</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Currency Symbol</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Display preference for reports</span>
                    </div>
                    <select className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AUD">AUD ($)</option>
                    </select>
                </div>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">straighten</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Unit Preferences</h2>
            </div>
            
            <div className="flex flex-col gap-stack-md">
                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">System of Measurement</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Affects volume, length, and weight inputs</span>
                    </div>
                    <div className="flex bg-surface-variant rounded p-1">
                        <button className="px-4 py-2 font-table-data text-table-data bg-secondary text-on-secondary rounded shadow-sm">Metric</button>
                        <button className="px-4 py-2 font-table-data text-table-data text-on-surface-variant hover:text-on-surface rounded">Imperial</button>
                    </div>
                </div>
                
                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Precision Level</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Decimal places for calculations</span>
                    </div>
                    <select className="h-touch-target-min px-gutter border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:border-2 focus:outline-none transition-all">
                        <option value="1">0.0 (1 decimal)</option>
                        <option value="2">0.00 (2 decimals)</option>
                        <option value="3">0.000 (3 decimals)</option>
                    </select>
                </div>
            </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg">
            <div className="flex items-center gap-base mb-stack-md">
                <span className="material-symbols-outlined text-primary text-[28px]">tune</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">System Options</h2>
            </div>
            
            <div className="flex flex-col gap-stack-md">
                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Dark Mode</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Reduce glare in low-light environments</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer h-touch-target-min">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                </div>
                
                <div className="flex items-center justify-between p-stack-sm rounded hover:bg-surface-container-lowest transition-colors">
                    <div>
                        <span className="font-body-lg text-body-lg text-on-surface block">Auto-Sync</span>
                        <span className="font-body-md text-body-md text-on-surface-variant block">Sync estimates to cloud when online</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer h-touch-target-min">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                </div>

                <div className="border-t border-outline-variant pt-stack-md mt-stack-sm">
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm">Data Management</h3>
                    <div className="flex gap-gutter">
                        <button className="flex-1 h-touch-target-min border border-outline text-on-surface font-table-data text-table-data rounded hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[20px]">cloud_download</span>
                            Backup
                        </button>
                        <button className="flex-1 h-touch-target-min border border-outline text-on-surface font-table-data text-table-data rounded hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[20px]">restore</span>
                            Restore
                        </button>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </>
  );
}
