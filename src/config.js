// EDITA ESTA LISTA: códigos de barras de los productos que compraste.
export const MIS_PRODUCTOS = ["737628064502"];

// Perfil del efecto del probador virtual (0 a 100). Lo define el producto, no la persona.
// Son valores de demostración: ajústalos a lo que quieras mostrar.
export const EFECTO_BASE = { nombre: "Clean Classic Conditioner", brillo: 55, suavidad: 45 };
// Un perfil por código de barras (opcional). Si el producto verificado no está aquí, se usa EFECTO_BASE.
export const EFECTOS_PRODUCTO = {
  "737628064502": { brillo: 55, suavidad: 45 },
};
