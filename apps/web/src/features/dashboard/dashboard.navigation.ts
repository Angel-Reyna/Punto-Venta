export function panelTitleActionLabel(to: string) {
  switch (to) {
    case "/users":
      return "Ver usuarios";
    case "/products":
      return "Ver productos";
    case "/inventory":
      return "Ver inventario";
    case "/sales":
      return "Ir a ventas";
    case "/reports":
      return "Ver reportes";
    case "/cash-register":
      return "Ir a caja";
    default:
      return "Abrir";
  }
}
