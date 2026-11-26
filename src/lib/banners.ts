// Banners replaced in code: the saved (old) file stays in storage and in the database, the new one is shown
// everywhere a category banner appears (category page hero, page preview image, the side menu's featured card).
export const SWAPPED: Record<string, string> = {
  // T-shirts: four model photos like the other banners (lips, the 318 graffiti couple, new york 90 sitting, the street vibe couple)
  'uploads/categories/zq-t-shirts.jpg': 'uploads/categories/zq-t-shirts-grid-2.jpg',
  // Shirts: four model photos like the hoodie and jersey banners (hot pink, the black couple, yellow, the coffee brown couple)
  'uploads/categories/zq-shirts.jpg': 'uploads/categories/zq-shirts-grid.jpg',
  // jerseys: four model photos like the hoodie banners (Barca front, Real Madrid couple, Barca couple, Real Madrid sitting)
  'uploads/categories/zq-football-jerseys.jpg': 'uploads/categories/zq-jerseys-grid.jpg',
  // Baggy jeans: four full-length model photos like the other banners (8 pocket cargo, the mid blue couple, vintage washed, the ice blue couple)
  'uploads/categories/zq-jeans.jpg': 'uploads/categories/zq-jeans-grid.jpg',
  // Zipper hoodies: four tiles like the Plain Hoodies banner (black zip on a man, the couple, maroon zip, chocolate brown zip on a woman),
  // made from the store's own zip hoodie photos
  'uploads/categories/zq-zip-hoodies.jpg': 'uploads/categories/zq-zip-hoodies-grid-3.jpg',
  // Plain hoodies: four model photos like the Zip Hoodies banner (black on a man, the purple couple, sky blue on a man,
  // forest green on a woman), from the store's own plain hoodie photos
  'uploads/categories/zq-plain-hoodies.jpg': 'uploads/categories/zq-plain-hoodies-grid.jpg',
  // Hoodies (the parent category, both saved records): the same banner as Plain Hoodies
  'uploads/categories/hoodies-banner-1791446873.jpg': 'uploads/categories/zq-plain-hoodies-grid.jpg',
  'uploads/categories/hoodies-banner-1792048088.jpg': 'uploads/categories/zq-plain-hoodies-grid.jpg',
  // Printed hoodies: four model photos like the Zip and Plain Hoodies banners (Pressure, OCS Art of Forms from the back,
  // Violet Metal, Red Web), from the store's own printed hoodie photos
  'uploads/categories/zq-printed-hoodies.jpg': 'uploads/categories/zq-printed-hoodies-grid.jpg',
  // Shop All (the default banner): one look per category in black, white and light denim (white lips tee, black zip hoodie,
  // the ice blue couple in white hoodies, white button-down, black plain hoodie), the couple wider in the middle
  'banners/zq-shop.jpg': 'banners/zq-shop-grid.jpg',
};
// their phone versions, named here (not looked up on disk, which misses files on the host)
export const SWAPPED_M: Record<string, string> = {
  'uploads/categories/zq-t-shirts-grid-2.jpg': 'uploads/categories/zq-t-shirts-grid-2-m.jpg',
  'uploads/categories/zq-shirts-grid.jpg': 'uploads/categories/zq-shirts-grid-m.jpg',
  'uploads/categories/zq-jerseys-grid.jpg': 'uploads/categories/zq-jerseys-grid-m.jpg',
  'uploads/categories/zq-jeans-grid.jpg': 'uploads/categories/zq-jeans-grid-m.jpg',
  'uploads/categories/zq-zip-hoodies-grid-3.jpg': 'uploads/categories/zq-zip-hoodies-grid-3-m.jpg',
  'uploads/categories/zq-plain-hoodies-grid.jpg': 'uploads/categories/zq-plain-hoodies-grid-m.jpg',
  'uploads/categories/zq-printed-hoodies-grid.jpg': 'uploads/categories/zq-printed-hoodies-grid-m.jpg',
  'banners/zq-shop-grid.jpg': 'banners/zq-shop-grid-m.jpg',
};
// saved paths may carry a leading "/" or "storage/" (mediaUrl drops both), so match on the bare path
export const swapBanner = (b: string | null | undefined) => (b ? SWAPPED[b.replace(/^\/+/, '').replace(/^storage\//, '')] ?? b : null);
