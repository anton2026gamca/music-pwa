import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function useSearchParamsHelpers() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getUpdatedSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    return params.toString();
  }

  const updateSearchParam = (key: string, value: string | null) => {
    const updated = getUpdatedSearchParams(key, value);
    router.replace(`${pathname}?${updated}`, { scroll: false });
  };

  return { getUpdatedSearchParams, updateSearchParam };
}
