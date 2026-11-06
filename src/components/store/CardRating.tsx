import { plural } from '@/lib/format';
import type { CardProduct } from '@/types/catalog';

/** Stars and review count under a card's name; nothing when the product has no approved review. Styles: .zq-rating */
export default function CardRating({ rating }: { rating: CardProduct['rating'] }) {
  if (!rating?.count) return null;
  return (
    <div className="zq-rating" aria-label={`Rated ${rating.avg} out of 5 from ${rating.count} ${plural('review', rating.count)}`}>
      <span className="zq-rating-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= Math.floor(rating.avg) ? 'ri-star-fill' : i - 0.5 <= rating.avg ? 'ri-star-half-line' : 'ri-star-line'}></i>
        ))}
      </span>
      <span className="zq-rating-count">{rating.count} {plural('Review', rating.count)}</span>
    </div>
  );
}
