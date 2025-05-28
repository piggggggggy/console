import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';

import type { Page } from '@/api-clients/_common/schema/type';
import { usePrivateDataTableApi } from '@/api-clients/dashboard/private-data-table/composables/use-private-data-table-api';
import { usePublicDataTableApi } from '@/api-clients/dashboard/public-data-table/composables/use-public-data-table-api';
import type { DataTableLoadParameters } from '@/api-clients/dashboard/public-data-table/schema/api-verbs/load';
import { usePaginationQuery } from '@/query/composables/use-pagination-query';
import { useScopedQuery } from '@/query/composables/use-scoped-query';
import { useServiceQueryKey } from '@/query/query-key/use-service-query-key';

import { WIDGET_LOAD_STALE_TIME } from '@/common/modules/widgets/_constants/widget-constant';

interface UseDataTableLoadQueryOptions {
    dataTableId: ComputedRef<string|undefined>;
    params: ComputedRef<DataTableLoadParameters>;
    page: ComputedRef<Page|undefined>;
}

export const useDataTableLoadQuery = (options: UseDataTableLoadQueryOptions) => {
    const {
        dataTableId,
        params,
        page,
    } = options;

    const { publicDataTableAPI } = usePublicDataTableApi();
    const { privateDataTableAPI } = usePrivateDataTableApi();

    const isPrivate = computed(() => !!dataTableId?.value?.startsWith('private'));

    const { key: privateDataTableLoadQueryKey, params: privateDataTableLoadParams } = useServiceQueryKey('dashboard', 'private-data-table', 'load', {
        contextKey: dataTableId,
        params,
    });

    const { key: publicDataTableLoadQueryKey, params: publicDataTableLoadParams } = useServiceQueryKey('dashboard', 'public-data-table', 'load', {
        contextKey: dataTableId,
        params,
    });

    const queryFn = (loadParams: DataTableLoadParameters) => {
        if (!dataTableId.value) {
            throw new Error('Selected data table id is undefined');
        }
        if (isPrivate.value) {
            return privateDataTableAPI.load(loadParams);
        }
        return publicDataTableAPI.load(loadParams);
    };


    return usePaginationQuery({
        queryKey: isPrivate.value ? privateDataTableLoadQueryKey : publicDataTableLoadQueryKey,
        params,
        queryFn,
        page,
    });


    // return useScopedQuery({
    //     queryKey: isPrivate.value ? privateDataTableLoadQueryKey : publicDataTableLoadQueryKey,
    //     queryFn: () => {
    //         if (!dataTableId.value) {
    //             throw new Error('Selected data table id is undefined');
    //         }
    //         if (isPrivate.value) {
    //             return privateDataTableAPI.load(privateDataTableLoadParams.value);
    //         }
    //         return publicDataTableAPI.load(publicDataTableLoadParams.value);
    //     },
    //     enabled: computed(() => dataTableId.value !== undefined),
    //     staleTime: WIDGET_LOAD_STALE_TIME,
    //     retry: 2,
    // }, ['WORKSPACE', 'DOMAIN']);
};
