import { computed, type ComputedRef } from 'vue';

import type { WidgetLoadParams, WidgetLoadResponse, WidgetLoadSumParams } from '@/api-clients/dashboard/_types/widget-type';
import { usePrivateWidgetApi } from '@/api-clients/dashboard/private-widget/composables/use-private-widget-api';
import { usePublicWidgetApi } from '@/api-clients/dashboard/public-widget/composables/use-public-widget-api';
import type { QueryKeyArray } from '@/query/query-key/_types/query-key-type';
import { _useAPIQueryKey } from '@/query/query-key/use-api-query-key';


interface UseWidgetLoadQueryContextOptions {
    widgetId: ComputedRef<string>;
    params: ComputedRef<WidgetLoadParams>;
    deps?: ComputedRef<object>;
}

interface UseWidgetLoadQueryContextResult {
    fetcher: () => Promise<WidgetLoadResponse>;
    key: ComputedRef<QueryKeyArray>;
}


// load verb
export const useWidgetLoadQueryContext = ({
    widgetId,
    params,
    deps,
}: UseWidgetLoadQueryContextOptions): UseWidgetLoadQueryContextResult => {
    const { publicWidgetAPI } = usePublicWidgetApi();
    const { privateWidgetAPI } = usePrivateWidgetApi();

    const isPrivate = computed(() => {
        if (!widgetId.value) return false;
        return widgetId.value.startsWith('private');
    });

    const { key: publicWidgetLoadQueryKey, params: publicWidgetLoadParams } = _useAPIQueryKey(
        'dashboard',
        'public-widget',
        'load',
        {
            id: widgetId,
            params,
            deps,
        },
    );

    const { key: privateWidgetLoadQueryKey, params: privateWidgetLoadParams } = _useAPIQueryKey(
        'dashboard',
        'private-widget',
        'load',
        {
            id: widgetId,
            params,
            deps,
        },
    );

    const fetcher = () => {
        if (!params.value) {
            throw new Error('Widget parameters are required');
        }
        return isPrivate.value
            ? privateWidgetAPI.load(privateWidgetLoadParams.value)
            : publicWidgetAPI.load(publicWidgetLoadParams.value);
    };

    return {
        fetcher,
        key: isPrivate.value ? privateWidgetLoadQueryKey : publicWidgetLoadQueryKey,
    };
};


interface UseWidgetLoadSumQueryContextOptions {
    widgetId: ComputedRef<string>;
    params: ComputedRef<WidgetLoadSumParams>;
    deps?: ComputedRef<object>;
}
interface UseWidgetLoadSumQueryContextResult {
    fetcher: () => Promise<WidgetLoadResponse>;
    key: ComputedRef<QueryKeyArray>;
}

// load-sum verb
export const useWidgetLoadSumQueryContext = ({
    widgetId,
    params,
    deps,
}: UseWidgetLoadSumQueryContextOptions): UseWidgetLoadSumQueryContextResult => {
    const { publicWidgetAPI } = usePublicWidgetApi();
    const { privateWidgetAPI } = usePrivateWidgetApi();

    const isPrivate = computed(() => {
        if (!widgetId.value) return false;
        return widgetId.value.startsWith('private');
    });

    const { key: publicWidgetLoadSumQueryKey, params: publicWidgetLoadSumParams } = _useAPIQueryKey(
        'dashboard',
        'public-widget',
        'load-sum',
        {
            id: widgetId,
            params,
            deps,
        },
    );

    const { key: privateWidgetLoadSumQueryKey, params: privateWidgetLoadSumParams } = _useAPIQueryKey(
        'dashboard',
        'private-widget',
        'load-sum',
        {
            id: widgetId,
            params,
            deps,
        },
    );

    const fetcher = () => {
        if (!params.value) {
            throw new Error('Widget parameters are required');
        }
        return isPrivate.value
            ? privateWidgetAPI.loadSum(privateWidgetLoadSumParams.value)
            : publicWidgetAPI.loadSum(publicWidgetLoadSumParams.value);
    };

    return {
        fetcher,
        key: isPrivate.value ? privateWidgetLoadSumQueryKey : publicWidgetLoadSumQueryKey,
    };
};
