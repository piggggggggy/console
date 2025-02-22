<script lang="ts" setup>
import {
    reactive, watch,
} from 'vue';

import type { XYChart } from '@amcharts/amcharts5/xy';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { getCancellableFetcher } from '@cloudforet/core-lib/space-connector/cancallable-fetcher';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import { hideAllSeries, showAllSeries, toggleSeries } from '@/common/composables/amcharts5/concepts-helper';
import ErrorHandler from '@/common/composables/error/errorHandler';

import CostAnalysisChartLegends
    from '@/services/cost-explorer/components/CostAnalysisChartLegends.vue';
import CostAnalysisStackedColumnChart
    from '@/services/cost-explorer/components/CostAnalysisStackedColumnChart.vue';
import {
    GRANULARITY,
} from '@/services/cost-explorer/constants/cost-explorer-constant';
import {
    getLegends, getXYChartData,
} from '@/services/cost-explorer/helpers/cost-explorer-chart-data-helper';
import { useCostAnalysisPageStore } from '@/services/cost-explorer/stores/cost-analysis-page-store';
import type { Legend, XYChartData } from '@/services/cost-explorer/types/cost-explorer-chart-type';
import type {
    CostAnalyzeResponse,
    Period,
} from '@/services/cost-explorer/types/cost-explorer-query-type';


type CostAnalyzeRawData = {
    [groupBy: string]: string | any;
    value_sum?: Array<{
        date: string;
        value: number
    }>;
    _total_value_sum?: number;
};

const costAnalysisPageStore = useCostAnalysisPageStore();
const costAnalysisPageGetters = costAnalysisPageStore.getters;
const costAnalysisPageState = costAnalysisPageStore.state;

const state = reactive({
    loading: true,
    legends: [] as Legend[],
    chartData: [] as XYChartData[],
    chart: null as XYChart | null,
});

/* api */
const fetchCostAnalyze = getCancellableFetcher<object, CostAnalyzeResponse<CostAnalyzeRawData>>(SpaceConnector.clientV2.costAnalysis.cost.analyze);
const analyzeApiQueryHelper = new ApiQueryHelper().setPage(1, 15);
const listCostAnalysisData = async (period:Period): Promise<CostAnalyzeResponse<CostAnalyzeRawData>> => {
    try {
        analyzeApiQueryHelper.setFilters(costAnalysisPageGetters.consoleFilters);
        let dateFormat = 'YYYY-MM';
        if (costAnalysisPageState.granularity === GRANULARITY.YEARLY) dateFormat = 'YYYY';
        const { status, response } = await fetchCostAnalyze({
            data_source_id: costAnalysisPageGetters.selectedDataSourceId,
            query: {
                granularity: costAnalysisPageState.granularity,
                group_by: costAnalysisPageState.chartGroupBy ? [costAnalysisPageState.chartGroupBy] : [],
                start: dayjs.utc(period.start).format(dateFormat),
                end: dayjs.utc(period.end).format(dateFormat),
                fields: {
                    value_sum: {
                        key: 'cost',
                        operator: 'sum',
                    },
                },
                sort: [{ key: '_total_value_sum', desc: true }],
                field_group: ['date'],
                ...analyzeApiQueryHelper.data,
            },
        });
        if (status === 'succeed') return response;
        return { more: false, results: [] };
    } catch (e) {
        ErrorHandler.handleError(e);
        return { more: false, results: [] };
    }
};
const setChartData = debounce(async (period:Period) => {
    state.loading = true;

    const rawData = await listCostAnalysisData(period);
    const { granularity, chartGroupBy } = costAnalysisPageState;
    state.legends = getLegends<CostAnalyzeRawData>(rawData, granularity, chartGroupBy);
    state.chartData = getXYChartData<CostAnalyzeRawData>(rawData, granularity, period, chartGroupBy);
    state.loading = false;
}, 300);

/* event */
const handleToggleSeries = (index) => {
    toggleSeries(state.chart as XYChart, index);
};
const handleAllSeries = (type) => {
    if (type === 'show') {
        showAllSeries(state.chart as XYChart);
    } else {
        hideAllSeries(state.chart as XYChart);
    }
};

watch([
    () => costAnalysisPageState,
    () => costAnalysisPageGetters.selectedDataSourceId,
    () => costAnalysisPageGetters.selectedQueryId,
], ([, selectedDataSourceId]) => {
    if (costAnalysisPageState.period && selectedDataSourceId) setChartData(costAnalysisPageState.period);
}, { immediate: true, deep: true });
</script>

<template>
    <div class="cost-analysis-chart">
        <cost-analysis-stacked-column-chart :loading="state.loading"
                                            :chart.sync="state.chart"
                                            :chart-data="state.chartData"
                                            :legends="state.legends"
                                            class="cost-analysis-stacked-column-chart"
        />
        <cost-analysis-chart-legends :loading="state.loading"
                                     :legends.sync="state.legends"
                                     class="cost-analysis-chart-legends"
                                     @toggle-series="handleToggleSeries"
                                     @show-all-series="handleAllSeries('show')"
                                     @hide-all-series="handleAllSeries('hide')"
        />
    </div>
</template>

<style lang="postcss" scoped>
.cost-analysis-chart {
    @apply grid grid-cols-12 border border-gray-200 rounded-md;
    grid-gap: 1rem;
    height: 26rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .cost-analysis-stacked-column-chart {
        @apply col-span-9;
    }
    .cost-analysis-chart-legends {
        @apply col-span-3;
    }
}
</style>
