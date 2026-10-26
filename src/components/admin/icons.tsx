// Icônes de l'administration (simples tracés, sans bibliothèque externe).
type IconProps = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className ?? "size-7"}>
      {children}
    </svg>
  );
}

export const IconRequests = (p: IconProps) => (
  <Svg {...p}><path d="M4 13l2-8h12l2 8" /><path d="M4 13v6h16v-6h-5l-1.5 2h-3L9 13H4z" /></Svg>
);
export const IconChanges = (p: IconProps) => (
  <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></Svg>
);
export const IconReports = (p: IconProps) => (
  <Svg {...p}><path d="M5 21V4" /><path d="M5 5h12l-2 4 2 4H5" /></Svg>
);
export const IconHome = (p: IconProps) => (
  <Svg {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Svg>
);
export const IconDeities = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></Svg>
);
export const IconEvents = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h3M13 14h3M8 17.5h3" /></Svg>
);
export const IconResources = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" /><path d="M5 17a3 3 0 013-3h10" /><path d="M9 8h5" /></Svg>
);
export const IconCompare = (p: IconProps) => (
  <Svg {...p}><circle cx="9" cy="9" r="4" /><circle cx="15" cy="15" r="4" /><path d="M12 12l0 0" /></Svg>
);
export const IconAudit = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3h6v3H9z" /><path d="M9 11h6M9 15h6" /></Svg>
);
export const IconUser = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Svg>
);
