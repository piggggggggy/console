import type { ComputedRef } from 'vue';
import {
    computed, watch, type Ref,
} from 'vue';

import { useInfiniteQuery } from '@tanstack/vue-query';

import type { Query } from '@cloudforet/core-lib/space-connector/type';

import type { Page } from '@/api-clients/_common/schema/type';

import type { QueryKeyArray } from '../query-key/_types/query-key-type';

type PaginationQueryParams = {
    query: Query;
    [key: string]: any;
} | any;

interface UsePaginationQueryOptions<T = any> {
    queryKey: Ref<QueryKeyArray>;
    params: ComputedRef<PaginationQueryParams>;
    queryFn: (args: PaginationQueryParams) => Promise<T>;
    page: ComputedRef<Page|undefined>;
}

export const usePaginationQuery = (options: UsePaginationQueryOptions) => {
    const {
        queryKey, params, queryFn, page,
    } = options;

    const start = computed<number>(() => {
        console.debug('[[Page]]', page);
        return page?.value?.start ?? 1;
    });
    const limit = computed<number>(() => page?.value?.limit ?? 15);

    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => {
            console.debug('[[QUerY FN]]', pageParam);
            return queryFn({
                ...params.value,
                // query: {
                // ...(params.value?.query ?? {}),
                page: {
                    start: pageParam,
                    limit: limit.value,
                },
                // },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
            console.debug('[[[NEXT PARAM]]]', {
                start: start.value, lastPage, allPages, lastPageParam, allPageParams,
            });
            const nextOffset = start.value;
            const totalCount = lastPage.total_count;
            return totalCount < nextOffset ? undefined : nextOffset;
        },
        staleTime: 1000 * 60 * 5,
    });

    watch(start, (_start, _prevStart) => {
        console.debug('[[[page watch]]]', { _start, _prevStart });
        if (!_start || !_prevStart || (_start === _prevStart)) return;
        if (_start > _prevStart) query.fetchNextPage();
        else if (_start < _prevStart) query.fetchPreviousPage();
    }, { immediate: true });


    return {
        page: computed<Page>(() => ({
            start: start.value * limit.value,
            limit: limit.value,
        })),
        data: computed(() => query.data.value?.pages?.[0]),
        query,
    };
};
