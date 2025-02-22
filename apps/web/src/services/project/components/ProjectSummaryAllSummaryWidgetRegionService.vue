<script lang="ts" setup>
import {
    reactive, watch, onUnmounted, computed, ref,
} from 'vue';
import type { Location } from 'vue-router';

import { PieChart } from '@amcharts/amcharts4/charts';
import {
    create, percent, color, Label,
} from '@amcharts/amcharts4/core';
import {
    PSkeleton, PDataLoader,
} from '@spaceone/design-system';
import bytes from 'bytes';
import { range, orderBy } from 'lodash';

import { QueryHelper } from '@cloudforet/core-lib/query';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { store } from '@/store';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';
import type { RegionReferenceMap } from '@/store/modules/reference/region/type';

import config from '@/lib/config';
import { arrayToQueryString, primitiveToQueryString } from '@/lib/router-query-string';

import ErrorHandler from '@/common/composables/error/errorHandler';

import {
    gray, white, coral, yellow, secondary1,
} from '@/styles/colors';

import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/routes/route-constant';


interface Data {
    provider: string;
    region_code: string;
    total: number;
}
interface Props {
    projectId: string;
    label?: string;
    count?: number;
}
const props = withDefaults(defineProps<Props>(), {
    label: undefined,
    count: undefined,
});

const chartContext = ref<HTMLElement|null>(null);
const queryHelper = new QueryHelper();
const state = reactive({
    loading: true,
    skeletons: range(3),
    providers: computed<ProviderReferenceMap>(() => store.getters['reference/providerItems']),
    regions: computed<RegionReferenceMap>(() => store.getters['reference/regionItems']),
    data: [] as Data[],
    chart: null as null | any,
    chartRegistry: {},
});

/* util */
const byteFormatter = (num, option = {}) => bytes(num, { ...option, unitSeparator: ' ', decimalPlaces: 1 });
const disposeChart = (ctx) => {
    if (state.chartRegistry[ctx]) {
        state.chartRegistry[ctx].dispose();
        delete state.chartRegistry[ctx];
    }
};
const drawChart = (ctx) => {
    const createChart = () => {
        disposeChart(ctx);
        state.chartRegistry[ctx] = create(ctx, PieChart);
        return state.chartRegistry[ctx];
    };
    const chart = createChart();
    state.chart = chart;
    if (!config.get('AMCHARTS_LICENSE.ENABLED')) chart.logo.disabled = true;
    chart.responsive.enabled = true;
    chart.innerRadius = percent(63);

    chart.data = state.data;

    const series = chart.series.create();
    series.slices.template.togglable = false;
    series.slices.template.clickable = false;
    series.dataFields.value = 'total';
    series.dataFields.category = 'region';
    series.slices.template.fill = color(gray[400]);
    series.slices.template.propertyFields.fill = 'color';
    series.slices.template.stroke = color(white);
    series.slices.template.strokeWidth = 2;
    series.slices.template.strokeOpacity = 1;
    series.slices.template.states.getKey('hover').properties.scale = 1;
    series.tooltip.disabled = true;
    series.ticks.template.disabled = true;
    series.labels.template.text = '';

    const label = new Label();
    label.parent = series;
    label.horizontalCenter = 'middle';
    label.verticalCenter = 'middle';
    label.fontSize = 16;
    label.fontWeight = 'lighter';
    label.fill = color(gray[900]);
    if (props.count) {
        if (props.label === 'Storage') {
            label.text = byteFormatter(props.count).split(' ')[0];
        } else {
            label.text = props.count;
        }
    } else {
        label.text = '{values.value.sum}';
    }

    state.chart = chart;
};

const getLocation = (provider: string, region: string, projectId: string, label: string) => {
    const query: Location['query'] = {
        provider: primitiveToQueryString(provider),
        region: arrayToQueryString([region]),
    };
    if (label !== 'All') query.service = arrayToQueryString([label]);

    // set filters
    queryHelper.setFilters([{ k: 'project_id', o: '=', v: projectId }]);

    const location: Location = {
        name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE._NAME,
        query: {
            filters: queryHelper.rawQueryStrings,
            ...query,
        },
    };
    return location;
};

/* api */
const getData = async () => {
    try {
        state.loading = true;
        state.data = [];
        const param: any = {
            project_id: props.projectId,
            aggregation: 'inventory.Region',
            labels: [props.label],
        };
        const res = await SpaceConnector.client.statistics.topic.cloudServiceSummary(param);
        const colors = [coral[500], yellow[400], secondary1];
        let data = orderBy(res.results, ['total'], ['desc']);
        data = data.map((d, idx) => ({
            provider: state.providers[d.provider]?.label,
            region: d.region_code,
            total: d.total,
            count: d.label === 'Storage' ? byteFormatter(d.total) : d.total,
            providerColor: state.providers[d.provider]?.color,
            color: colors[idx] || gray[400],
            to: getLocation(d.provider, d.region_code, props.projectId, props.label),
        }));
        state.data = data;
    } catch (e) {
        ErrorHandler.handleError(e);
        state.data = [];
    } finally {
        state.loading = false;
    }
};

watch([() => state.loading, () => chartContext.value], ([loading, chartCtx]) => {
    if (!loading && chartCtx) {
        drawChart(chartCtx);
    }
}, { immediate: true });
watch(() => props.label, async () => {
    await getData();
}, { immediate: false });

onUnmounted(() => {
    if (state.chart) state.chart.dispose();
});

// LOAD REFERENCE STORE
(async () => {
    await Promise.allSettled([
        store.dispatch('reference/provider/load'),
        store.dispatch('reference/region/load'),
    ]);
    await getData();
})();
</script>

<template>
    <div class="project-summary-all-summary-widget-region-service">
        <div v-if="!state.loading && state.data.length === 0"
             class="no-data-wrapper grid"
        >
            <div class="m-auto">
                <img src="@/assets/images/illust_cloud.svg"
                     class="empty-image hidden lg:block"
                >
                <p class="text">
                    {{ $t('COMMON.WIDGETS.ALL_SUMMARY.NO_SERVICE', { service: $t('COMMON.WIDGETS.ALL_SUMMARY.REGION_SERVICE') }) }}
                </p>
            </div>
        </div>
        <div v-else
             class="grid grid-cols-12"
        >
            <div class="col-span-3 chart-wrapper">
                <p-data-loader :loading="state.loading">
                    <div ref="chartContext"
                         class="chart"
                    />
                </p-data-loader>
            </div>
            <div class="col-span-9 summary-content-wrapper">
                <template v-if="state.loading">
                    <div v-for="v in state.skeletons"
                         :key="v"
                         class="flex items-center p-2 col-span-3"
                    >
                        <p-skeleton class="flex-grow" />
                    </div>
                </template>
                <template v-else>
                    <router-link v-for="(d, idx) of state.data"
                                 :key="idx"
                                 :to="d.to"
                                 class="summary-row col-span-3 md:col-span-1 lg:col-span-3"
                    >
                        <span class="circle"
                              :style="{ 'background-color': d.color }"
                        />
                        <div class="text-group">
                            <span :style="{ color: d.providerColor }">{{ d.provider }}</span>
                            <span class="type truncate">{{ d.region }}</span>
                        </div>
                        <span class="count">{{ d.count }}</span>
                    </router-link>
                </template>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.project-summary-all-summary-widget-region-service {
    .no-data-wrapper {
        height: 13rem;
        .empty-image {
            margin: 0 auto 0.5rem auto;
        }

        .text {
            @apply text-primary2;
            font-size: 0.875rem;
            font-weight: bold;
            line-height: 1.5;
            text-align: center;
            opacity: 0.7;
            margin-bottom: 0.625rem;
        }
    }
    .chart-wrapper {
        .chart {
            max-width: 6rem;
            max-height: 6rem;
            margin: auto;

            @screen md {
                position: absolute;
                top: -1rem;
            }
        }
    }
    .summary-content-wrapper {
        overflow-y: auto;
        height: 13rem;
    }
    .summary-row {
        position: relative;
        display: block;
        font-size: 0.875rem;
        line-height: 1.2;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        margin: auto 0;

        &:hover {
            @apply bg-secondary2;
            .provider {
                text-decoration: underline;
            }
            .type {
                text-decoration: underline;
            }
            .count {
                text-decoration: underline;
            }
        }

        .circle {
            @apply rounded-full;
            display: inline-block;
            width: 0.5rem;
            height: 0.5rem;
            margin-bottom: 0.25rem;
            margin-right: 0.25rem;
        }

        .text-group {
            display: inline-block;
            width: 75%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            .type {
                padding-left: 0.5rem;
            }
        }

        .count {
            @apply text-gray-600;
            position: absolute;
            right: 0.5rem;
        }
    }

    .p-data-loader {
        height: 100%;
    }

    @screen mobile {
        .summary-content-wrapper {
            height: auto;
        }
    }
}
</style>
