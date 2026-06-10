export const pvVisualTokens = {
  viewportPresets: [
    {
      key: "mobile",
      label: "Móvil",
      size: "390 × 844",
      width: 390,
      description: "Tarjetas compactas, acciones principales visibles y cero scroll horizontal.",
    },
    {
      key: "tablet",
      label: "Tablet",
      size: "768 × 1024",
      width: 768,
      description: "Dos columnas operativas, filtros colapsables y tablas resumidas.",
    },
    {
      key: "laptop",
      label: "Laptop",
      size: "1366 × 768",
      width: 1366,
      description: "Paneles laterales, métricas arriba y tablas compactas.",
    },
    {
      key: "desktop",
      label: "Desktop amplio",
      size: "1536 × 864",
      width: 1536,
      description: "Más aire visual sin perder densidad operativa.",
    },
  ],
  layout: {
    pageMaxWidth: 1440,
    desktopSidebarWidth: 272,
    desktopContentPadding: 32,
    tabletContentPadding: 24,
    mobileContentPadding: 16,
    sectionGap: 20,
    denseSectionGap: 12,
    cardRadius: 18,
    tableRowHeight: 56,
    mobileCardMinHeight: 96,
  },
  density: {
    compactControlHeight: 40,
    defaultControlHeight: 44,
    touchTarget: 48,
    metricCardMinHeight: 118,
  },
} as const;

export type PvViewportPreset = (typeof pvVisualTokens.viewportPresets)[number];
