export function panelTitleActionLabel(to: string) {
  const path = to.split("?")[0];

  switch (path) {
    case "/users":
      return "Ver usuarios";
    case "/products":
      return "Ver productos";
    case "/inventory":
      if (to.includes("view=movements")) return "Ver movimientos";
      if (to.includes("status=out")) return "Ver sin stock";
      if (to.includes("status=low")) return "Ver bajo stock";
      return "Ver inventario";
    case "/sales":
      return to.includes("view=adjustments") ? "Revisar ajustes" : "Ver ventas";
    case "/reports":
      return "Ver reportes";
    default:
      return "Abrir";
  }
}
