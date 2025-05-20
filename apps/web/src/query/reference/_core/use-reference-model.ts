import { computed } from 'vue';

import type { ReferenceFetchInfo, ReferenceKeyType } from '../types/reference-type';
import { useReferenceListQuery } from './reference-list/use-reference-list-query';
import { useBatchedReferenceMap } from './reference-map/use-batched-reference-map';
import { useReferenceQuery } from './reference-query/use-reference-query';



interface BatchedLazyReferenceOptions {
    debounceMs?: number;
    batchSize?: number;
    maxBatchSize?: number;
}


export const useReferenceModel = <T, R extends Record<string, any>>(
    resourceKey: ReferenceKeyType,
    fetchInfo: ReferenceFetchInfo<T>,
    transform: (item: T) => R,
    options?: BatchedLazyReferenceOptions,
) => {
    const { referenceMap } = useBatchedReferenceMap(
        resourceKey,
        fetchInfo,
        transform,
        options,
    );

    const { data: refererenceList, isFetching } = useReferenceListQuery(
        resourceKey,
        fetchInfo,
        transform,
    );

    const {
        listReferenceQuery,
        statReferenceQuery,
    } = useReferenceQuery(
        resourceKey,
        fetchInfo,
    );

    return {
        referenceMap,
        refererenceList,
        listReferenceQuery,
        statReferenceQuery,
        loading: computed(() => isFetching.value || refererenceList.value.length === 0),
    };
};
