"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Command } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md"
      >
        <Search className="h-4 w-4" />
        <span>Search alumni, events...</span>
        <kbd className="hidden md:inline-flex ml-2 h-5 items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative z-50 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl border"
            >
              <Command
                className="w-full h-full flex flex-col bg-transparent"
                loop
                shouldFilter={true}
              >
                <div className="flex items-center border-b px-4 py-3">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
                  <Command.Input 
                    value={inputValue}
                    onValueChange={setInputValue}
                    autoFocus
                    placeholder="Search anything..."
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                  <Command.Empty className="py-6 text-center text-sm text-slate-500">
                    No results found for "{inputValue}".
                  </Command.Empty>
                  
                  <Command.Group heading="Recent Alumni" className="px-2 py-1.5 text-xs font-semibold text-slate-500 mb-1">
                    <Command.Item className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md aria-selected:bg-slate-100 cursor-pointer">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">CG</div>
                      <div>
                         <p className="font-medium text-slate-900">Charles Gift</p>
                         <p className="text-xs text-slate-500">Class of 2024 • Information Security</p>
                      </div>
                    </Command.Item>
                    <Command.Item className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md aria-selected:bg-slate-100 cursor-pointer">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs">JM</div>
                      <div>
                         <p className="font-medium text-slate-900">Jane Mwangi</p>
                         <p className="text-xs text-slate-500">Class of 2018 • Computer Science</p>
                      </div>
                    </Command.Item>
                  </Command.Group>

                  <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-2">
                    <Command.Item onSelect={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md aria-selected:bg-slate-100 cursor-pointer">
                      Add New Alumni
                    </Command.Item>
                    <Command.Item onSelect={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md aria-selected:bg-slate-100 cursor-pointer">
                      Create Event
                    </Command.Item>
                    <Command.Item onSelect={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md aria-selected:bg-slate-100 cursor-pointer">
                      Generate Analytics Report
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
