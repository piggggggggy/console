import {
    computed,
} from 'vue';

import { referenceQueryClient as queryClient } from '@/query/clients';
import { useReferenceQueryKey } from '@/query/query-key/use-reference-query-key';
import type { ReferenceKeyType } from '@/query/reference/types/reference-type';
import { REFERENCE_CONFIG_MAP } from '@/query/resource-query/reference-model/constants/reference-config-map';
import { useResourceInfo } from '@/query/resource-query/shared/composable/use-resource-info';

import type { ReferenceMap } from '@/store/reference/type';

import { useWatchedQueryCache } from '../common/use-watched-query-cache';
import { useBatchedReferenceFetch } from './use-batched-reference-fetch';


export const useReferenceMap = <T, R extends Record<string, any>>(
    resourceKey: ReferenceKeyType,
    forceFetch: boolean,
) => {
    const { config, api } = useResourceInfo(resourceKey);
    const { transform, only } = REFERENCE_CONFIG_MAP[resourceKey];

    if (!config) {
        throw new Error(`Invalid reference key - map : ${resourceKey}`);
    }

    const { key: queryKey } = useReferenceQueryKey(resourceKey);

    // Utills
    const getId = (item: T) => {
        if (!config.idKey) {
            throw new Error(`[getId] Invalid resource key: ${resourceKey}`);
        }
        return item[config.idKey];
    };
    const batchedFecher = async (ids: string[]) => {
        if (!config.idKey) {
            throw new Error(`[batchedFetcher] Invalid resource key: ${resourceKey}`);
        }
        let params: any = {
            query: {
                filter: [
                    {
                        k: config.idKey,
                        o: 'in',
                        v: ids,
                    },
                ],
            },
        };
        if (only) {
            params = {
                ...params,
                query: {
                    ...params.query,
                    only,
                },
            };
        }
        const response = await api.list(params);
        return response.results || [];
    };

    // Core
    const { enqueue } = useBatchedReferenceFetch(
        queryKey.value,
        batchedFecher,
        getId,
    );
    const { data: cachedData } = useWatchedQueryCache<T[]>(queryKey.value);

    // Computed
    const _cachedMap = computed(() => (cachedData.value || []).reduce((acc, item) => {
        acc[getId(item as T)] = transform(item as T);
        return acc;
    }, {} as ReferenceMap<R>));


    const proxyMap = new Proxy({}, {
        get(_, id: string) {
            const cache = _cachedMap.value;
            if (forceFetch) queryClient.
            if (!(id in cache)) enqueue(id);
            return cache[id];
        },
    });

    return {
        referenceMap: computed(() => proxyMap as ReferenceMap<R>),
    };
};
