import { usePathname, useSearchParams } from 'next/navigation';

/** Changes whenever the visitor navigates to another page or another query (?page=2) */
export function useNavKey(): string {
  const pathname = usePathname();
  const search = useSearchParams();
  return `${pathname}?${search.toString()}`;
}
