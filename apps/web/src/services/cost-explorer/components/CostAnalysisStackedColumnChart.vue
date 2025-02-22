<script lang="ts" setup>
import {
    nextTick, ref, watch,
} from 'vue';

import { color } from '@amcharts/amcharts5';
import type { TimeUnit } from '@amcharts/amcharts5/.internal/core/util/Time';
import type * as am5xy from '@amcharts/amcharts5/xy';
import {
    PDataLoader, PSkeleton,
} from '@spaceone/design-system';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';

import { numberFormatter } from '@cloudforet/utils';

import { currencyMoneyFormatter } from '@/lib/helper/currency-helper';

import { useAmcharts5 } from '@/common/composables/amcharts5';

import { gray } from '@/styles/colors';

import { GRANULARITY } from '@/services/cost-explorer/constants/cost-explorer-constant';
import { getStackedChartData } from '@/services/cost-explorer/helpers/cost-explorer-chart-data-helper';
import { getPeriodByGranularity } from '@/services/cost-explorer/helpers/cost-explorer-period-helper';
import { useCostAnalysisPageStore } from '@/services/cost-explorer/stores/cost-analysis-page-store';
import type { Legend, XYChartData } from '@/services/cost-explorer/types/cost-explorer-chart-type';
import type { Granularity } from '@/services/cost-explorer/types/cost-explorer-query-type';


interface Props {
    loading: boolean;
    chart: null | am5xy.XYChart;
    chartData: XYChartData[];
    legends: Legend[];
}

const DATE_FIELD_NAME = 'date';

const props = withDefaults(defineProps<Props>(), {
    loading: true,
    chart: null,
    chartData: () => ([]),
    legends: () => ([]),
});
const emit = defineEmits<{(e: 'update:chart', value): void;
}>();

const costAnalysisPageStore = useCostAnalysisPageStore();
const costAnalysisPageGetters = costAnalysisPageStore.getters;
const costAnalysisPageState = costAnalysisPageStore.state;

const chartContext = ref<HTMLElement | null>(null);
const chartHelper = useAmcharts5(chartContext);

const getTooltipDateFormatByGranularity = (granularity: Granularity) => {
    if (granularity === GRANULARITY.MONTHLY) return 'MMM, YYYY';
    if (granularity === GRANULARITY.YEARLY) return 'YYYY';
    return 'MMM D, YYYY';
};
const drawChart = () => {
    // set date formatter for tooltip text
    if (costAnalysisPageState.granularity === GRANULARITY.DAILY) {
        chartHelper.root.value?.dateFormatter.setAll({
            dateFormat: 'd MMM, yyyy',
        });
    } else if (costAnalysisPageState.granularity === GRANULARITY.YEARLY) {
        chartHelper.root.value?.dateFormatter.setAll({
            dateFormat: 'yyyy',
        });
    }

    // set min, max date of xAxis (for daily chart)
    const _period = getPeriodByGranularity(costAnalysisPageState.granularity, costAnalysisPageState.period ?? {});
    const _dateAxisSettings = costAnalysisPageState.granularity === GRANULARITY.DAILY ? {
        min: dayjs.utc(_period.start).valueOf(),
        max: dayjs.utc(_period.end).add(1, 'day').valueOf(),
    } : {};
    const { chart, xAxis, yAxis } = chartHelper.createXYDateChart({}, _dateAxisSettings);

    // set base interval of xAxis
    let timeUnit: TimeUnit = 'month';
    if (costAnalysisPageState.granularity === GRANULARITY.DAILY) timeUnit = 'day';
    else if (costAnalysisPageState.granularity === GRANULARITY.YEARLY) timeUnit = 'year';
    xAxis.get('baseInterval').timeUnit = timeUnit;

    // get stacked chart data of daily chart
    let _chartData = cloneDeep(props.chartData);
    if (costAnalysisPageState.granularity === GRANULARITY.DAILY) {
        _chartData = getStackedChartData(props.chartData, costAnalysisPageState.granularity, costAnalysisPageState.period ?? {});
    }

    // set date format for daily chart
    if (costAnalysisPageState.granularity === GRANULARITY.DAILY) {
        xAxis.setAll({
            dateFormats: {
                day: 'd',
            },
        });
    }

    // set label adapter of yAxis
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    yAxis.get('renderer').remove('labels');
    yAxis.get('renderer').labels.template.adapters.add('text', (text) => {
        if (text) {
            const convertedText = text.replace(/,/g, '');
            const num = Number(convertedText);
            if (Number.isNaN(num)) return text;
            return numberFormatter(num) ?? '';
        }
        return text;
    });

    // set min value of yAxis
    const _tooltipDateFormat = getTooltipDateFormatByGranularity(costAnalysisPageState.granularity);
    props.legends.forEach((legend) => {
        // create series
        const seriesSettings: Partial<am5xy.IXYSeriesSettings> = {
            name: legend.label as string,
            valueYField: legend.name,
            stacked: true,
            stroke: undefined,
        };
        if (legend.color) seriesSettings.fill = chartHelper.color(legend.color);
        const series = chartHelper.createXYColumnSeries(chart, seriesSettings);

        chart.series.push(series);

        // set data processor
        let dateFormat = 'yyyy-MM';
        if (costAnalysisPageState.granularity === GRANULARITY.DAILY) dateFormat = 'yyyy-MM-dd';
        else if (costAnalysisPageState.granularity === GRANULARITY.YEARLY) dateFormat = 'yyyy';
        series.data.processor = chartHelper.createDataProcessor({
            dateFormat,
            dateFields: [DATE_FIELD_NAME],
        });

        // set data
        series.data.setAll(_chartData);

        // set tooltip
        const tooltip = chartHelper.createTooltip();
        tooltip.label.setAll({
            fill: color(gray[900]),
            fontSize: 14,
        });
        const seriesColor = series.get('fill')?.toString();
        tooltip.label.adapters.add('text', (text, target) => {
            const dataContext = target?.dataItem?.dataContext as XYChartData|undefined;
            if (dataContext) {
                const date = dayjs.utc(dataContext.date).format(_tooltipDateFormat);
                let value = dataContext[legend.name];
                value = currencyMoneyFormatter(value, { currency: costAnalysisPageGetters.currency, style: 'decimal' });
                return `${date}\n[${seriesColor}; fontSize: 10px]●[/] {name}: [bold]${value}[/]`;
            }
            return text;
        });
        series.set('tooltip', tooltip);

        // set opacity if today / this month / this year
        const today = dayjs.utc();
        series.columns.template.adapters.add('fillOpacity', (fillOpacity, target) => {
            const _targetData = (target.dataItem?.dataContext as XYChartData|undefined)?.date;
            if (_targetData && today.isSame(dayjs.utc(_targetData), timeUnit)) {
                return 0.5;
            }
            return fillOpacity;
        });
    });
    return chart;
};

watch([() => chartContext.value, () => props.loading, () => props.chartData], async ([_chartContext, loading, chartData]) => {
    if (_chartContext && !loading && chartData.length) {
        chartHelper.refreshRoot();
        await nextTick();
        const chart = drawChart();
        emit('update:chart', chart);
    }
}, { immediate: false });
</script>

<template>
    <p-data-loader :loading="props.loading"
                   :data="props.chartData"
                   class="cost-analysis-stacked-column-chart"
    >
        <template #loader>
            <p-skeleton height="100%" />
        </template>
        <div ref="chartContext"
             class="chart"
        />
    </p-data-loader>
</template>

<style lang="postcss" scoped>
.cost-analysis-stacked-column-chart {
    height: 25rem;
    padding-bottom: 1rem;

    /* custom design-system component - p-data-loader */
    :deep(.data-loader-container) {
        .no-data-wrapper {
            max-height: inherit;
        }
    }
    .chart {
        height: 100%;
    }
}
</style>
