<script setup lang="ts">
import {
    computed, defineExpose, defineProps, nextTick, reactive, ref,
} from 'vue';

import { PDataLoader } from '@spaceone/design-system';
import {
    isEqual, uniqWith,
} from 'lodash';

import { getPageStart } from '@cloudforet/core-lib/component-util/pagination';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import { COST_DATA_FIELD_MAP } from '@/schema/dashboard/_constants/widget-constant';
import { store } from '@/store';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';
import type { RegionReferenceMap } from '@/store/modules/reference/region/type';

import { useAmcharts5 } from '@/common/composables/amcharts5';
import ErrorHandler from '@/common/composables/error/errorHandler';

import WidgetDataTable from '@/services/dashboards/widgets/_components/WidgetDataTable.vue';
import WidgetFrame from '@/services/dashboards/widgets/_components/WidgetFrame.vue';
import { useWidgetLifecycle } from '@/services/dashboards/widgets/_composables/use-widget-lifecycle';
import { useWidgetPagination } from '@/services/dashboards/widgets/_composables/use-widget-pagination';
// eslint-disable-next-line import/no-cycle
import { useWidget } from '@/services/dashboards/widgets/_composables/use-widget/use-widget';
import { getXYChartLegends } from '@/services/dashboards/widgets/_helpers/widget-chart-helper';
import type { Field } from '@/services/dashboards/widgets/_types/widget-data-table-type';
import type {
    WidgetExpose, WidgetProps, WidgetEmit, Legend, CostAnalyzeResponse,
} from '@/services/dashboards/widgets/_types/widget-type';
import type {
    Data,
    MapChartData,
} from '@/services/dashboards/widgets/cost-widgets/cost-by-region/cost-by-region-data-hleper';
import {
    getRefinedMapChartData,
} from '@/services/dashboards/widgets/cost-widgets/cost-by-region/cost-by-region-data-hleper';


type FullData = CostAnalyzeResponse<Data>;


const props = defineProps<WidgetProps>();
const emit = defineEmits<WidgetEmit>();

const { widgetState, widgetFrameProps, widgetFrameEventHandlers } = useWidget(props, emit);

const state = reactive({
    loading: true,
    data: null as FullData | null,
    tableFields: computed<Field[]>(() => [
        {
            label: 'Provider', name: COST_DATA_FIELD_MAP.PROVIDER.name, textOptions: { type: 'reference', referenceType: 'provider' }, width: '20%',
        },
        {
            label: 'Region', name: COST_DATA_FIELD_MAP.REGION.name, textOptions: { type: 'reference', referenceType: 'region' }, width: '50%',
        },
        {
            label: 'Cost', name: 'value_sum', textOptions: { type: 'cost' }, textAlign: 'right', width: '30%',
        },
    ]),
    legends: computed<Legend[]>(() => getXYChartLegends(state.data?.results, COST_DATA_FIELD_MAP.PROVIDER.name, props.allReferenceTypeInfo)),
    chartLegends: computed(() => uniqWith(state.legends, isEqual)),
    chartData: computed<MapChartData[]>(() => getRefinedMapChartData(state.data?.results, storeState.regions, storeState.providers)),
});

const { pageSize, thisPage } = useWidgetPagination(widgetState);

const storeState = reactive({
    providers: computed<ProviderReferenceMap>(() => store.getters['reference/providerItems']),
    regions: computed<RegionReferenceMap>(() => store.getters['reference/regionItems']),
});

const chartContext = ref<HTMLElement|null>(null);
const chartHelper = useAmcharts5(chartContext);


/* Api */
const apiQueryHelper = new ApiQueryHelper();
const fetchCostAnalyze = getCancellableFetcher<object, FullData>(SpaceConnector.clientV2.costAnalysis.cost.analyze);
const fetchData = async (): Promise<FullData> => {
    try {
        apiQueryHelper.setFilters(widgetState.consoleFilters);
        if (pageSize.value) apiQueryHelper.setPage(getPageStart(thisPage.value, pageSize.value), pageSize.value);
        const { status, response } = await fetchCostAnalyze({
            data_source_id: widgetState.options.cost_data_source,
            query: {
                granularity: widgetState.granularity,
                group_by: [widgetState.dataField, COST_DATA_FIELD_MAP.PROVIDER.name],
                start: widgetState.dateRange.start,
                end: widgetState.dateRange.end,
                fields: {
                    value_sum: {
                        key: 'cost',
                        operator: 'sum',
                    },
                },
                sort: [{ key: 'value_sum', desc: true }],
                ...apiQueryHelper.data,
            },
        });
        if (status === 'succeed') return response;
        return state.data;
    } catch (e) {
        ErrorHandler.handleError(e);
        return { results: [], more: false };
    }
};

const drawChart = (chartData: MapChartData[]) => {
    const chart = chartHelper.createMapChart();
    const polygonSeries = chartHelper.createMapPolygonSeries();
    chart.series.push(polygonSeries);
    const pointSeries = chartHelper.createMapPointSeries();
    chart.series.push(pointSeries);
    pointSeries.bullets.push((root, series, dataItem) => {
        const _chartData = (dataItem?.dataContext as any)?.data;
        const pieChart = chartHelper.createPieChart({
            width: 32,
            height: 32,
        });
        const pieSeries = chartHelper.createPieSeries({
            categoryField: 'category',
            valueField: 'value',
        });
        pieChart.series.push(pieSeries);
        pieSeries.data.setAll(_chartData.pieChartData);
        pieSeries.slices.template.setAll({
            templateField: 'pieSettings',
        });

        const tooltip = chartHelper.createTooltip();
        chartHelper.setPieTooltipText(pieSeries, tooltip, widgetState.currency);
        pieSeries.slices.template.set('tooltip', tooltip);

        return chartHelper.createBullet({
            sprite: pieChart,
        });
    });

    chartData.forEach((d) => {
        pointSeries.data.push({
            geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
            title: d.title,
            data: d,
        });
    });
};

const initWidget = async (data?: FullData): Promise<FullData> => {
    state.loading = true;
    state.data = data ?? await fetchData();
    chartHelper.clearChildrenOfRoot();
    await nextTick();
    if (chartHelper.root.value) drawChart(state.chartData);
    state.loading = false;
    return state.data;
};
const refreshWidget = async (_thisPage = 1): Promise<FullData> => {
    state.loading = true;
    thisPage.value = _thisPage;
    state.data = await fetchData();
    chartHelper.clearChildrenOfRoot();
    await nextTick();
    if (chartHelper.root.value) drawChart(state.chartData);
    state.loading = false;
    return state.data;
};

/* Event */
const handleUpdateThisPage = (_thisPage: number) => {
    thisPage.value = _thisPage;
    state.data = null;
    refreshWidget(_thisPage);
};

useWidgetLifecycle({
    disposeWidget: chartHelper.disposeRoot,
    initWidget,
    refreshWidget,
    props,
    emit,
    widgetState,
    onCurrencyUpdate: async () => {
        if (!state.data) return;
        chartHelper.clearChildrenOfRoot();
        await nextTick();
        if (chartHelper.root.value) drawChart(state.chartData);
    },
});

defineExpose<WidgetExpose<FullData>>({
    initWidget,
    refreshWidget,
});
</script>

<template>
    <widget-frame v-bind="widgetFrameProps"
                  class="cost-by-region"
                  v-on="widgetFrameEventHandlers"
    >
        <div class="content-wrapper">
            <p-data-loader class="chart-loader"
                           :loading="props.loading || state.loading"
                           :data="state.data"
                           :loader-backdrop-opacity="1"
                           loader-type="skeleton"
                           show-data-from-scratch
            >
                <div ref="chartContext"
                     class="chart"
                />
                <div class="legend-wrapper">
                    <span v-for="(legend, idx) in state.chartLegends"
                          :key="`${legend.name}-${idx}`"
                          class="circle-wrapper"
                    >
                        <span v-if="legend.name"
                              class="circle"
                              :style="{background: storeState.providers[legend.name]?.color}"
                        /><span class="label">{{ storeState.providers[legend.name]?.label }}</span>
                    </span>
                </div>
            </p-data-loader>
            <widget-data-table :loading="props.loading || state.loading"
                               :fields="state.tableFields"
                               :items="state.data ? state.data.results : []"
                               :currency="widgetState.currency"
                               :all-reference-type-info="props.allReferenceTypeInfo"
                               :legends="state.legends"
                               :this-page="thisPage"
                               :show-next-page="state.data ? state.data.more : false"
                               @update:thisPage="handleUpdateThisPage"
            />
        </div>
    </widget-frame>
</template>

<style lang="postcss" scoped>
.cost-by-region {
    .content-wrapper {
        @apply grid grid-cols-12;
        grid-column-gap: 1rem;
        height: 100%;
        .chart-loader {
            @apply col-span-5;
            height: 100%;
            padding-bottom: 1rem;
            min-height: 22.5rem;
            .chart {
                @apply border border-gray-200;
                height: calc(90% - 2px);
                width: calc(100% - 2px);
            }
            .legend-wrapper {
                .circle-wrapper {
                    display: inline-flex;
                    align-items: center;
                    width: 100%;
                    .circle {
                        @apply inline-block rounded-full;
                        margin-right: 0.25rem;
                        width: 0.5rem;
                        height: 0.5rem;
                    }
                    .label {
                        @apply mr-4 text-label-sm text-gray-700;
                        white-space: nowrap;
                    }
                }
            }
        }
        .widget-data-table {
            @apply col-span-7;
        }
    }
    &.full {
        min-height: 29rem;
    }
}
</style>
