import { useRouter, usePathname } from "next/navigation";

export function useSearchParamsHelpers() {
  const router = useRouter();
  const pathname = usePathname();

  const getUpdatedSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    return params.toString();
  };

  const updateSearchParam = (key: string, value: string | null) => {
    const updated = getUpdatedSearchParams(key, value);
    console.log("Updated search params:", updated);

    const queryString = updated ? `?${updated}` : '';
    router.replace(`${pathname}${queryString}`, { scroll: false });
  };

  return { getUpdatedSearchParams, updateSearchParam };
}
