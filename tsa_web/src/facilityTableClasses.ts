/**
 * Shared visual system for Live Feed + Red-flag Alerts data tables.
 * Keep these in sync when adjusting either screen.
 */
export const facilityTableCard =
  'rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden'

export const facilityTableToolbar =
  'flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-3'

export const facilityTableScroll = 'overflow-x-auto'

/** Live Feed: allow horizontal scroll on narrow viewports */
export const facilityTable = 'w-full min-w-[640px] text-left border-collapse'

/** Red-flag Alerts: fit the main column without horizontal scroll */
export const facilityTableFluid = 'w-full table-fixed border-collapse text-left'

export const facilityTheadRow = 'border-b border-slate-200 bg-slate-50/90'

/** Base header cell — add first:/last: padding via firstTh / lastTh where needed */
export const facilityTh =
  'py-3.5 px-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500'

export const facilityThFirst = `${facilityTh} pl-5`

export const facilityThLast = `${facilityTh} pr-5`

export const facilityTbody = 'divide-y divide-slate-100'

export const facilityTr = 'transition-colors hover:bg-slate-50/80'

/** Default body cell */
export const facilityTd = 'px-3 py-4 align-middle text-sm text-slate-700'

export const facilityTdFirst = `${facilityTd} pl-5`

export const facilityTdLast = `${facilityTd} pr-5`

export const facilityTdTop = 'px-3 py-4 align-top text-sm text-slate-700'

export const facilityTdTopFirst = `${facilityTdTop} pl-5`

/** Patient name (primary line) */
export const facilityPatientName =
  'font-semibold text-slate-900 text-[15px] leading-tight tracking-tight'

/** Red-flag Alerts table: slightly smaller row type than Live Feed */
export const facilityPatientNameEscalation =
  'font-semibold text-slate-900 text-[13px] leading-tight tracking-tight'

/** Muted secondary text under patient name (no top margin — compose with mt-1 / mt-1.5) */
export const facilityPatientSubline = 'text-xs leading-snug text-slate-500'

/** Subline under patient name (e.g. alert source on Red-flag table) */
export const facilityPatientSub = `mt-1 ${facilityPatientSubline}`

export const facilityPatientSubEscalation = 'mt-1 text-[11px] leading-snug text-slate-500'

/** Text link action (e.g. Manage Case) */
export const facilityTableActionLink =
  'text-sm font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline'

export const facilityTableActionLinkEscalation =
  'text-xs font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline'
