export interface CardVariant {
  id: number;
  option_values: Record<string, string>;
  quantity: number;
  price: number | null;
  sale_price: number | null;
}

/** What a product card needs; plain JSON so client components can render cards too */
export interface CardProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  quantity: number;
  images: string[]; // primary first
  primary_image: string | null; // the image marked primary, if any
  categories: { title: string; slug: string }[];
  variants: CardVariant[];
  first_variant_id: number | null;
  rating: { avg: number; count: number } | null; // approved reviews only; null when there are none
}
