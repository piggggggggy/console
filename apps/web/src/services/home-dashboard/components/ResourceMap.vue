<script lang="ts" setup>
import {
    computed, onUnmounted, reactive, ref, watch,
} from 'vue';
import type { Location } from 'vue-router';

import am4geodataWorldLow from '@amcharts/amcharts4-geodata/worldLow';
import {
    ease, Sprite, color, create, Circle,
} from '@amcharts/amcharts4/core';
import {
    MapImageSeries, projections, MapPolygonSeries, MapChart,
} from '@amcharts/amcharts4/maps';
import { PDataLoader, PProgressBar, PEmpty } from '@spaceone/design-system';

import { QueryHelper } from '@cloudforet/core-lib/query';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { store } from '@/store';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';
import type { RegionReferenceMap } from '@/store/modules/reference/region/type';

import config from '@/lib/config';

import WidgetLayout from '@/common/components/layouts/WidgetLayout.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import { coral, gray } from '@/styles/colors';

import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/routes/route-constant';

interface CloudService {
    cloud_service_group: string;
    cloud_service_type: string;
    count: number;
}

interface Resource {
    cloud_services: CloudService[];
    color: string;
    latitude: number;
    longitude: number;
    provider: string;
    region_code: string;
    title: string;
    total_count: number;
}

interface ProviderLegend {
    color: string;
    name: string;
    provider: string;
}
interface Props {
    extraParams?: object;
}

const props = withDefaults(defineProps<Props>(), {
    extraParams: () => ({}),
});

const chartContext = ref<HTMLElement|null>(null);
const state = reactive({
    chartRegistry: {},
    chart: null as MapChart|null,
    data: [] as Resource[],
    loading: true,
    providers: computed<ProviderReferenceMap>(() => store.getters['reference/providerItems']),
    regions: computed<RegionReferenceMap>(() => store.getters['reference/regionItems']),
    resourceDataByRegion: [] as CloudService[],
    selectedRegionLabel: '',
    selectedRegionCode: '',
    selectedProvider: '',
    maxValue: 0,
});

const chartState = reactive({
    marker: null,
    initialRegion: computed(() => ({
        title: state.regions[state.data[0]?.region_code]?.name || state.data[0]?.region_code,
        longitude: state.data[0]?.longitude,
        latitude: state.data[0]?.latitude,
        color: state.providers[state.data[0]?.provider]?.color,
    })),
    providerLegends: [] as ProviderLegend[],
    providerFilter: undefined as string[]|undefined,
    legendsLoading: true,
});

const animateBullet = (circle) => {
    const animation = circle.animate(
        [{ property: 'scale', from: 1, to: 5 }, { property: 'opacity', from: 1, to: 0 }],
        1000,
        ease.circleOut,
    );
    animation.events.on('animationended', (event) => {
        animateBullet(event.target.object);
    });
};

const getResourceByRegionData = async () => {
    try {
        state.loading = true;
        const { results } = await SpaceConnector.client.statistics.topic.resourceByRegion({
            ...props.extraParams,
            providers: chartState.providerFilter,
        });
        state.data = results.map((d) => ({
            ...d,
            title: state.regions[d.region_code]?.name || d.region_code,
            longitude: parseFloat(state.regions[d.region_code]?.longitude ?? 0),
            latitude: parseFloat(state.regions[d.region_code]?.latitude ?? 0),
            color: state.providers[d.provider]?.color ?? '',
        })) as Resource[];
    } catch (e) {
        ErrorHandler.handleError(e);
    } finally {
        state.loading = false;
    }
};

const initResourceInfo = () => {
    state.resourceDataByRegion = state.data[0]?.cloud_services ?? [];
    state.selectedProvider = state.data[0]?.provider ?? '';
    state.selectedRegionLabel = state.data[0]?.title ?? '';
    state.selectedRegionCode = state.data[0]?.region_code ?? '';
    state.maxValue = state.data[0]?.cloud_services[0]?.count ?? 0;
};

const disposeChart = (ctx) => {
    if (state.chartRegistry[ctx]) {
        state.chartRegistry[ctx].dispose();
        delete state.chartRegistry[ctx];
    }
};

const moveMarker = (coords, marker) => {
    marker.latitude = coords.latitude;
    marker.longitude = coords.longitude;
};

const drawMarker = (chart) => {
    const mapImageSeries = chart.series.push(new MapImageSeries());
    const mapImage = mapImageSeries.mapImages;
    const mapImageTemplate = mapImage.template;
    const mapMarker = mapImageTemplate.createChild(Sprite);
    mapMarker.path = 'M4 12 A12 12 0 0 1 28 12 C28 20, 16 32, 16 32 C16 32, 4 20 4 12 M11 12 A5 5 0 0 0 21 12 A5 5 0 0 0 11 12 Z';
    mapMarker.width = 24;
    mapMarker.height = 34;
    mapMarker.scale = 0.7;
    mapMarker.fill = color(coral[500]);
    mapMarker.fillOpacity = 1;
    mapMarker.horizontalCenter = 'middle';
    mapMarker.verticalCenter = 'bottom';
    mapMarker.nonScaling = true;
    chartState.marker = mapImage.create();
};

const hitCircle = async (event) => {
    const originTarget = state.selectedRegionCode;
    const target = event.target.dataItem?.dataContext;

    if (target) {
        state.selectedRegionCode = target.region_code;
        state.selectedRegionLabel = target.title;
        state.selectedProvider = target.provider;
        if (originTarget !== state.selectedRegionCode) {
            moveMarker({ latitude: target.latitude, longitude: target.longitude }, chartState.marker);
            state.resourceDataByRegion = target.cloud_services;
            if (target.cloud_services) state.maxValue = target.cloud_services[0]?.count ?? 0;
        }
    }
};

const drawChart = async (ctx) => {
    /* draw map */
    const createChart = () => {
        disposeChart(ctx);
        state.chartRegistry[ctx] = create(ctx, MapChart);
        return state.chartRegistry[ctx];
    };
    const chart = createChart();

    chart.geodata = am4geodataWorldLow;
    chart.projection = new projections.Miller();
    chart.responsive.enabled = true;
    if (!config.get('AMCHARTS_LICENSE.ENABLED')) chart.logo.disabled = true;
    chart.chartContainer.wheelable = true;

    const polygonSeries = chart.series.push(new MapPolygonSeries());
    polygonSeries.useGeodata = true;
    polygonSeries.exclude = ['AQ'];
    polygonSeries.mapPolygons.template.fill = color(gray[200]);
    polygonSeries.calculateVisualCenter = true;

    /* draw circles */
    const imageSeries = chart.series.push(new MapImageSeries());
    imageSeries.mapImages.template.propertyFields.longitude = 'longitude';
    imageSeries.mapImages.template.propertyFields.latitude = 'latitude';
    imageSeries.mapImages.template.tooltipText = '{title}';
    imageSeries.mapImages.template.nonScaling = true;
    const circle = imageSeries.mapImages.template.createChild(Circle);
    circle.radius = 3;
    circle.propertyFields.fill = 'color';
    const circle2 = imageSeries.mapImages.template.createChild(Circle);
    circle2.radius = 3;
    circle2.propertyFields.fill = 'color';
    circle2.events.on('inited', (event) => {
        animateBullet(event.target);
    });

    /* make marker */
    drawMarker(chart);

    /* click circle to move marker and get filtered data */
    circle2.events.on('hit', async (event) => {
        await hitCircle(event);
    });

    /* draw circles with region data */
    imageSeries.data = state.data;

    /* draw initial marker with initial coords */
    moveMarker({ longitude: chartState.initialRegion.longitude, latitude: chartState.initialRegion.latitude }, chartState.marker);
    initResourceInfo();

    state.chart = chart;
};

const handleClickLegends = async (provider: string) => {
    if (chartState.providerFilter === undefined) {
        chartState.providerFilter = [provider];
    } else if (!chartState.providerFilter.includes(provider)) {
        chartState.providerFilter.push(provider);
    } else {
        chartState.providerFilter = chartState.providerFilter.filter((item) => item !== provider);
    }
    await getResourceByRegionData();
};

const initLegends = () => {
    chartState.legendsLoading = true;
    chartState.providerLegends = state.data
        .map((d) => ({
            name: state.providers[d.provider]?.label,
            color: state.providers[d.provider]?.color as string,
            provider: d.provider,
        }))
        .filter((data, index, arr) => arr.findIndex((item) => item.name === data.name) === index);
    chartState.providerFilter = chartState.providerLegends.map((d) => d.provider);
    chartState.legendsLoading = false;
};

const queryHelper = new QueryHelper();
const goToCloudService = (item) => {
    const res: Location = {
        name: ASSET_INVENTORY_ROUTE.CLOUD_SERVICE.DETAIL._NAME,
        params: {
            provider: state.selectedProvider,
            group: item.cloud_service_group,
            name: item.cloud_service_type,
        },
        query: {
            filters: queryHelper.setFilters([
                { k: 'region_code', v: state.selectedRegionCode, o: '=' },
            ]).rawQueryStrings,
        },
    };
    return res;
};

watch([() => chartContext.value, () => state.loading], ([chartCtx, loading]) => {
    if (chartCtx && !loading) {
        requestIdleCallback(() => drawChart(chartCtx));
    }
}, { immediate: false });

onUnmounted(() => {
    if (state.chart) state.chart.dispose();
});

(async () => {
    await Promise.allSettled([
        store.dispatch('reference/provider/load'),
        store.dispatch('reference/region/load'),
    ]);
    await getResourceByRegionData();
    initLegends();
    initResourceInfo();
})();
</script>

<template>
    <widget-layout class="resource-map">
        <template #title>
            <p class="title">
                {{ $t('COMMON.WIDGETS.RESOURCE_BY_REGION_REGIONS') }}
            </p>
        </template>
        <div class="contents-wrapper">
            <div class="col-span-12 lg:col-span-9 chart-wrapper">
                <p-data-loader :loading="state.loading"
                               loader-type="skeleton"
                               disable-empty-case
                               class="col-span-12 lg:col-span-9 chart-wrapper"
                >
                    <div ref="chartContext"
                         class="chart w-full h-full"
                    />
                </p-data-loader>
                <div v-if="!chartState.legendsLoading"
                     class="circle-wrapper"
                >
                    <div v-for="(item) in chartState.providerLegends"
                         :key="item.name"
                    >
                        <div class="cursor-pointer"
                             @click="handleClickLegends(item.provider)"
                        >
                            <p class="circle"
                               :style="{background: chartState.providerFilter.includes(item.provider) ? item.color : 'gray'}"
                            />
                            <span>{{ item.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p-data-loader
                :loading="state.loading"
                class="col-span-12 lg:col-span-3 resource-info-wrapper"
                :data="state.data"
            >
                <div class="resource-info-wrapper">
                    <div class="resource-info-title">
                        <span class="resource-info-provider"
                              :style="{color: state.providers[state.selectedProvider] ? state.providers[state.selectedProvider].color : 'gray' }"
                        >
                            {{ state.providers[state.selectedProvider] ? state.providers[state.selectedProvider].label : '' }}</span>
                        <span class="resource-info-region">{{ state.selectedRegionLabel }}</span>
                    </div>
                    <div class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 progress-bar-wrapper">
                        <router-link v-for="(item, index) in state.resourceDataByRegion"
                                     :key="index"
                                     class="progress-bar-link"
                                     :to="goToCloudService(item)"
                        >
                            <div class="progress-bar-label">
                                <span class="label-text text-xs">{{ item.cloud_service_group }} > {{ item.cloud_service_type }}</span>
                                <span class="label-number text-xs text-gray-600">{{ item.count }}</span>
                            </div>
                            <p-progress-bar :percentage="(item.count / state.maxValue) * 100"
                                            class="progress-bar"
                                            :class="state.selectedProvider||'aws'"
                                            :color="state.providers[state.selectedProvider] ? state.providers[state.selectedProvider].color : 'gray'"
                            />
                        </router-link>
                    </div>
                </div>
                <template #no-data>
                    <p-empty
                        show-image
                        image-size="md"
                        :title="$t('COMMON.WIDGETS.RESOURCE_MAP.NO_REGION')"
                    >
                        <template #image>
                            <img src="../../../assets/images/illust_microscope.svg"
                                 alt="illust_microscope"
                            >
                        </template>
                    </p-empty>
                </template>
            </p-data-loader>
        </div>
    </widget-layout>
</template>

<style lang="postcss" scoped>
.resource-map {
    @apply flex flex-col;
    height: 53rem;

    @screen sm {
        height: 41rem;
    }

    @screen lg {
        height: 28.625rem;
    }
}
.title {
    @apply text-gray-900;
    margin-bottom: 0.875rem;
    font-size: 1.125rem;
    font-weight: bold;
    line-height: 120%;
    .count {
        font-weight: normal;
    }
}
.contents-wrapper {
    @apply grid grid-cols-12 grid-flow-row gap-4 w-full h-full;
    .chart-wrapper {
        @apply flex flex-col justify-between;
        flex-basis: 100%;
        margin-right: 1rem;
        .chart {
            @apply w-full h-full;
            flex-shrink: 0;
            flex-grow: 1;
            height: 21.625rem;
        }
    }
    .circle-wrapper {
        margin-top: 0.625rem;
        display: inline-flex;
        .circle {
            @apply inline-block rounded-full;
            margin-right: 0.25rem;
            width: 0.5rem;
            height: 0.5rem;
        }
        span {
            @apply mr-4 text-gray-500;
            font-size: 0.75rem;
            line-height: 1.5;
        }
    }
}
.resource-info-wrapper {
    width: 100%;
    height: 100%;
    .resource-info-title {
        @apply truncate;
        margin-bottom: 0.625rem;
        font-size: 0.875rem;
        font-weight: bold;
        line-height: 1.5;

        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        white-space: normal;

        @screen sm {
            white-space: nowrap;
        }

        @screen lg {
            @apply px-2;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            white-space: normal;
        }
        .resource-info-region {
            margin-left: 1ch;
        }
    }
    .progress-bar-wrapper {
        @apply grid;
        grid-column-gap: 0.5rem;

        @screen lg {
            grid-column-gap: 0;
        }
    }
}
.progress-bar-link {
    @apply py-1;

    @screen lg {
        @apply px-2;
    }

    .progress-bar-label {
        @apply mb-1 flex justify-between;
        font-size: 0.75rem;
        line-height: 1.2;
    }
    &:hover {
        @apply bg-blue-100 cursor-pointer underline rounded-xs;
    }

    /* custom design-system component - p-progress-bar */
    :deep(.progress-bar) {
        padding: 0;
        .background-bar {
            height: 0.25rem;
        }
        .tracker-bar {
            height: 0.25rem;
            margin-top: -0.25rem;
        }
    }
}

/* custom design-system component - p-data-loader */
:deep(.p-data-loader) {
    .no-data-wrapper {
        max-height: initial;
    }
}

/* custom design-system component - p-empty */
:deep(.p-empty) {
    @apply col-span-12 flex flex-col;
    justify-self: center;
}
</style>
