import type { ComputedRef } from 'vue';
import {
    computed, reactive,
} from 'vue';

import type { ListResponse } from '@/api-clients/_common/schema/api-verbs/list';
import { _useAPIQueryKey } from '@/query/query-key/use-api-query-key';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useWidgetFormQuery } from '@/common/modules/widgets/_composables/use-widget-form-query';
import { createDataTableReferenceMap } from '@/common/modules/widgets/_helpers/widget-data-table-helper';
import { useWidgetGenerateStore } from '@/common/modules/widgets/_store/widget-generate-store';
import type { DataTableModel, DataTableReference } from '@/common/modules/widgets/types/widget-data-table-type';


interface UseDataTableCascadeUpdateOptions {
    widgetId: ComputedRef<string|undefined>;
}

interface UseDataTableCascadeUpdateReturn {
    cascadeUpdateDataTable: (dataTableId: string) => Promise<void>;
}

export const useDataTableCascadeUpdate = ({ widgetId }: UseDataTableCascadeUpdateOptions): UseDataTableCascadeUpdateReturn => {
    const widgetGenerateStore = useWidgetGenerateStore();
    const widgetGenerateState = widgetGenerateStore.state;

    /* Query */
    const {
        dataTableList,
        fetcher,
        keys,
        queryClient,
    } = useWidgetFormQuery({
        widgetId: computed(() => widgetId.value),
    });
    const { namespaces: privateDataTableLoadNamespaces } = _useAPIQueryKey('dashboard', 'private-data-table', 'load');
    const { namespaces: publicDataTableLoadNamespaces } = _useAPIQueryKey('dashboard', 'public-data-table', 'load');


    const _state = reactive({
        isPrivate: computed(() => !!widgetId.value?.startsWith('private')),
        dataTableReferenceMap: computed<Record<string, DataTableReference>>(() => createDataTableReferenceMap(dataTableList.value)),
    });

    const _dataTableListQueryKey = computed(() => (_state.isPrivate
        ? keys.privateDataTableListQueryKey.value
        : keys.publicDataTableListQueryKey.value));
    const _dataTableLoadQueryNamespaces = computed(() => (_state.isPrivate
        ? privateDataTableLoadNamespaces.value
        : publicDataTableLoadNamespaces.value));


    const _invalidateLoadQueries = async (data: DataTableModel) => {
        await queryClient.invalidateQueries({
            queryKey: [
                ..._dataTableLoadQueryNamespaces.value,
                data.data_table_id,
            ],
        });
    };

    const cascadeUpdateDataTable = async (dataTableId: string) => {
        const children = _state.dataTableReferenceMap[dataTableId].children;
        return children.reduce((chain, childId) => chain.then(async () => {
            try {
                widgetGenerateStore.setDataTableCasCadeUpdateLoadingMap({
                    ...widgetGenerateState.dataTableCasCadeUpdateLoadingMap,
                    [childId]: true,
                });

                const currentDataTable = dataTableList.value.find(
                    (_dataTable) => _dataTable.data_table_id === childId,
                ) as DataTableModel;

                const result = await fetcher.updateDataTableFn({
                    data_table_id: childId,
                    name: currentDataTable?.name,
                    options: {
                        ...(currentDataTable?.options ?? {}),
                    },
                });

                await queryClient.setQueryData(_dataTableListQueryKey.value, (oldData: ListResponse<DataTableModel>) => {
                    if (oldData?.results) {
                        return {
                            ...oldData,
                            results: oldData.results.map((item) => (item.data_table_id === result.data_table_id ? result : item)),
                        };
                    }
                    return oldData;
                });

                await _invalidateLoadQueries(result);
                await cascadeUpdateDataTable(childId);
            } catch (error) {
                ErrorHandler.handleError(error);
            } finally {
                setTimeout(() => {
                    widgetGenerateStore.setDataTableCasCadeUpdateLoadingMap({
                        ...widgetGenerateState.dataTableCasCadeUpdateLoadingMap,
                        [childId]: false,
                    });
                }, 500);
            }
        }), Promise.resolve());
    };

    return {
        cascadeUpdateDataTable,
    };
};
