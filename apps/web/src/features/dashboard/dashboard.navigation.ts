export function panelTitleActionLabel(to: string) {
  const path = to.split("?")[0];

  switch (path) {
    case "/users":
      return "Ver usuarios";
    case "/products":
      return "Ver productos";
    case "/inventory":
      if (to.includes("view=movements")) return "Ver movimientos";
      if (to.includes("status=attention")) return "Ver atención";
      return "Ver inventario";
    case "/sales":
      return to.includes("view=adjustments") ? "Revisar ajustes" : "Ver ventas";
    case "/reports":
      return "Ver reportes";
    default:
      return "Abrir";
  }
}
