/**
 * Map an inventory item id to its icon file under /icons/ETB_UI/.
 * Returns null when the slot has no renderable item.
 */
export const getItemImageFile = (itemName: string | null | undefined): string | null => {
  if (!itemName || itemName === "None") return null;
  if (itemName === "Toy") return "Teddy_Bear.png";
  return `${itemName}.png`;
};
