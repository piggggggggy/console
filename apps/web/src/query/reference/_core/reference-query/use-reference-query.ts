import type { ConsoleFilterOperator } from '@cloudforet/core-lib/query/type';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import type { ListResponse } from '@/api-clients/_common/schema/api-verbs/list';
import { referenceQueryClient as queryClient } from '@/query/clients';
import { useReferenceQueryKey } from '@/query/query-key/use-reference-query-key';



import type { ReferenceQueryParams, ReferenceQueryResponse } from '../../types/reference-query-type';
import type { ReferenceFetchInfo, ReferenceKeyType } from '../../types/reference-type';

export const useReferenceQuery = <T>(
    resourceKey: ReferenceKeyType,
    fetchInfo: ReferenceFetchInfo<T>,
) => {
    const {
        listFetchFn,
        statFetchFn,
        idKey,
        nameKey = 'name',
        searchTargets = [idKey, nameKey],
        only = [idKey, nameKey],
        nameFormatter = (d: T) => d[nameKey],
    } = fetchInfo;
    const { withSuffix: referenceQueryKey } = useReferenceQueryKey(resourceKey);


    const _getListParams = (params: ReferenceQueryParams = {}) => {
        const apiQueryHelper = new ApiQueryHelper();
        apiQueryHelper.setFilters([
            { k: idKey, v: [null, ''], o: '!=' },
        ]);

        if (params.options) {
            Object.entries(params.options).forEach(([key, value]) => {
                apiQueryHelper.addFilter({ k: key, v: value, o: '=' });
            });
        }

        if (params.search) {
            const searchFilters = searchTargets.map((key) => ({
                k: key,
                v: params.search ?? '',
                o: '' as ConsoleFilterOperator,
            }));
            apiQueryHelper.setOrFilters(searchFilters);
        }
        if (params.start !== undefined && params.limit !== undefined) {
            apiQueryHelper.setPage(params.start, params.limit);
        }

        return {
            query: {
                only,
                ...apiQueryHelper.data,
            },
        };
    };
    const _getStatParams = (params: ReferenceQueryParams = {}, dataKey: string) => {
        const apiQueryHelper = new ApiQueryHelper();

        // Additional Filter (ex. data_source_id)
        if (params.options) {
            apiQueryHelper.setFilters([]);
            Object.entries(params.options).forEach(([key, value]) => {
                apiQueryHelper.addFilter({ k: key, v: value, o: '=' });
            });
            apiQueryHelper.addFilter({ k: dataKey, v: [null, ''], o: '!=' });
        } else {
            apiQueryHelper.setFilters([
                { k: dataKey, v: [null, ''], o: '!=' },
            ]);
        }


        if (params.search) {
            apiQueryHelper.addFilter({ k: dataKey, v: params.search, o: '' });
        }
        if (params.filters) {
            apiQueryHelper.addFilter({ k: dataKey, v: params.filters, o: '=' });
        }

        if (params.start !== undefined && params.limit !== undefined) {
            apiQueryHelper.setPage(params.start, params.limit);
        }

        return {
            query: {
                distinct: dataKey,
                ...apiQueryHelper.data,
            },
        };
    };

    const _convertToReferenceQueryList = (response: ListResponse<T>, params: ReferenceQueryParams): ReferenceQueryResponse<T> => {
        let more = false;
        if (params.start !== undefined && params.limit !== undefined && response.total_count !== undefined) {
            more = (params.start * params.limit) < response.total_count;
        }
        return {
            results: response.results ? response.results.map((d) => ({ key: d[idKey], name: nameFormatter(d), data: d })) : [],
            more,
            title: fetchInfo.name,
        };
    };

    const _convertToReferenceQueryStat = (response: ListResponse<any>, params: ReferenceQueryParams, dataKey: string): ReferenceQueryResponse<any> => {
        let more = false;
        if (params.start !== undefined && params.limit !== undefined && response.total_count !== undefined) {
            more = (params.start - 1 + params.limit) < response.total_count;
        }

        return {
            results: (response.results ?? []).map((d) => ({ key: d, name: d, data: d })),
            more,
            title: dataKey,
        };
    };


    const listReferenceQuery = async (params: ReferenceQueryParams = {}): Promise<ReferenceQueryResponse<any>> => {
        const queryParams = _getListParams(params);
        const queryKey = referenceQueryKey(['list', queryParams]);

        const data = await queryClient.ensureQueryData({
            queryKey,
            queryFn: () => listFetchFn(queryParams),
            staleTime: 1000 * 60 * 5,
        });

        return _convertToReferenceQueryList(data, params);
    };

    const statReferenceQuery = async (dataKey: string) => {
        const _dataKey = dataKey;
        return async (params: ReferenceQueryParams = {}): Promise<ReferenceQueryResponse<any>> => {
            if (!statFetchFn) {
                console.warn('This resource does not support stat fetch');
                return { results: [], more: false };
            }
            const queryParams = _getStatParams(params, _dataKey);
            const queryKey = referenceQueryKey(['stat', queryParams]);

            const data = await queryClient.ensureQueryData({
                queryKey,
                queryFn: () => statFetchFn(queryParams),
                staleTime: 1000 * 60 * 5,
            });

            return _convertToReferenceQueryStat(data, params, dataKey);
        };
    };


    return {
        listReferenceQuery,
        statReferenceQuery,
    };
};


