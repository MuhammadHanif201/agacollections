// Banners replaced in code: the saved (old) file stays in storage and in the database, the new one is shown
// everywhere a category banner appears (category page hero, page preview image, the side menu's featured card).
export const SWAPPED: Record<string, string> = {
  // T-shirts: the owner's photo of five tees on a black rack, centred, its plain wall continued on both sides
  'uploads/categories/zq-t-shirts.jpg': 'uploads/categories/zq-t-shirts-rack.webp',
  // Shirts: the owner's six-shirt gold-rack image, centred with its hangers in view (label text and wall socket painted out)
  'uploads/categories/zq-shirts.jpg': 'uploads/categories/zq-shirts-rack-2.webp',
  // jerseys: the owner's four-jersey rail image, centred, its dark wall continued on both sides
  'uploads/categories/zq-football-jerseys.jpg': 'uploads/categories/zq-jerseys-rail-2.webp',
  // Baggy jeans: the owner's three-jeans rail image, centred, its wall continued on both sides
  'uploads/categories/zq-jeans.jpg': 'uploads/categories/zq-jeans-rail.webp',
  // Zipper hoodies: four tiles like the Plain Hoodies banner (black zip on a man, the couple, maroon zip, chocolate brown zip on a woman),
  // made from the store's own zip hoodie photos
  'uploads/categories/zq-zip-hoodies.jpg': 'uploads/categories/zq-zip-hoodies-grid-3.jpg',
  // Plain hoodies: four model photos like the Zip Hoodies banner (black on a man, the purple couple, sky blue on a man,
  // forest green on a woman), from the store's own plain hoodie photos
  'uploads/categories/zq-plain-hoodies.jpg': 'uploads/categories/zq-plain-hoodies-grid.jpg',
  // Printed hoodies: four model photos like the Zip and Plain Hoodies banners (Pressure, OCS Art of Forms from the back,
  // Violet Metal, Red Web), from the store's own printed hoodie photos
  'uploads/categories/zq-printed-hoodies.jpg': 'uploads/categories/zq-printed-hoodies-grid.jpg',
  // Shop All (the default banner): the owner's mannequin image, centred (the bag's cartoon face painted out)
  'banners/zq-shop.jpg': 'banners/zq-shop-mannequins.webp',
};
// their phone versions, named here (not looked up on disk, which misses files on the host)
export const SWAPPED_M: Record<string, string> = {
  'uploads/categories/zq-t-shirts-rack.webp': 'uploads/categories/zq-t-shirts-rack-m.webp',
  'uploads/categories/zq-shirts-rack-2.webp': 'uploads/categories/zq-shirts-rack-m.webp',
  'uploads/categories/zq-jerseys-rail-2.webp': 'uploads/categories/zq-jerseys-rail-m.webp',
  'uploads/categories/zq-jeans-rail.webp': 'uploads/categories/zq-jeans-rail-m.webp',
  'uploads/categories/zq-zip-hoodies-grid-3.jpg': 'uploads/categories/zq-zip-hoodies-grid-3-m.jpg',
  'uploads/categories/zq-plain-hoodies-grid.jpg': 'uploads/categories/zq-plain-hoodies-grid-m.jpg',
  'uploads/categories/zq-printed-hoodies-grid.jpg': 'uploads/categories/zq-printed-hoodies-grid-m.jpg',
  'banners/zq-shop-mannequins.webp': 'banners/zq-shop-mannequins-m.webp',
};
// saved paths may carry a leading "/" or "storage/" (mediaUrl drops both), so match on the bare path
export const swapBanner = (b: string | null | undefined) => (b ? SWAPPED[b.replace(/^\/+/, '').replace(/^storage\//, '')] ?? b : null);
