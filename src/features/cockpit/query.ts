import { queryOptions } from "@tanstack/react-query";
import { getCockpitDataFn } from "./server/getCockpitData";

export const COCKPIT_QUERY_KEY = ['cockpit', 'data'] as const

export const cockpitQueryOptions = queryOptions({
    queryKey: COCKPIT_QUERY_KEY,
    queryFn: () => getCockpitDataFn(),
    staleTime: 1000 * 30,
})