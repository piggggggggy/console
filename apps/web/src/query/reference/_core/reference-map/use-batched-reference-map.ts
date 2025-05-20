import {
    computed,
} from 'vue';

import { useReferenceQueryKey } from '@/query/query-key/use-reference-query-key';
import type { ReferenceFetchInfo, ReferenceKeyType } from '@/query/reference/types/reference-type';

import type { ReferenceMap } from '@/store/reference/type';

import { REFRENCE_KEY_MAP } from '../../constants/reference-constant';
import { useWatchedQueryCache } from '../common/use-watched-query-cache';
import { useBatchedReferenceFetch } from './use-batched-reference-fetch';

interface BatchedLazyReferenceOptions {
  debounceMs?: number;
  batchSize?: number;
  maxBatchSize?: number;
}

export const useBatchedReferenceMap = <T, R extends Record<string, any>>(
    resourceKey: ReferenceKeyType,
    fetchInfo: ReferenceFetchInfo<T>,
    transform: (item: T) => R,
    options?: BatchedLazyReferenceOptions,
) => {
    const { listFetchFn, idKey } = fetchInfo;
    const { key: queryKey } = useReferenceQueryKey(resourceKey);

    // Utills
    const getId = (item: T) => {
        if (!idKey) {
            throw new Error(`[getId] Invalid resource key: ${resourceKey}`);
        }
        return item[idKey];
    };
    const batchedFecher = async (ids: string[]) => {
        if (!idKey) {
            throw new Error(`[batchedFetcher] Invalid resource key: ${resourceKey}`);
        }
        let params: any = {
            query: {
                filter: [
                    {
                        k: idKey,
                        o: 'in',
                        v: ids,
                    },
                ],
            },
        };
        if (fetchInfo.only) {
            params = {
                ...params,
                query: {
                    ...params.query,
                    only: fetchInfo.only,
                },
            };
        }
        const response = await listFetchFn(params);
        return response.results || [];
    };

    // Core
    const { enqueue } = useBatchedReferenceFetch(
        queryKey.value,
        batchedFecher,
        getId,
        options,
    );
    const { data: cachedData } = useWatchedQueryCache<T[]>(queryKey.value);

    // Computed
    const _cachedMap = computed(() => (cachedData.value || []).reduce((acc, item) => {
        acc[getId(item)] = transform(item);
        return acc;
    }, {} as ReferenceMap<R>));


    const proxyMap = new Proxy({}, {
        get(_, id: string) {
            const cache = _cachedMap.value;
            if (!(id in cache)) enqueue(id);
            return cache[id];
        },
    });

    return {
        referenceMap: computed(() => proxyMap as ReferenceMap<R>),
    };
};
