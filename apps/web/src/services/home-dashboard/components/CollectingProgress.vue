<script lang="ts" setup>
import {
    computed, reactive,
} from 'vue';
import { useRouter } from 'vue-router/composables';

import { PSkeleton, PI, PEmpty } from '@spaceone/design-system';
import dayjs from 'dayjs';
import { range } from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { AnalyzeResponse } from '@/schema/_common/api-verbs/analyze';
import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { CollectorListParameters } from '@/schema/inventory/collector/api-verbs/list';
import type { CollectorModel } from '@/schema/inventory/collector/model';
import type { JobModel } from '@/schema/inventory/job/model';
import { store } from '@/store';
import { i18n } from '@/translations';

import type { ProviderReferenceMap } from '@/store/modules/reference/provider/type';

import WidgetLayout from '@/common/components/layouts/WidgetLayout.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import { ASSET_INVENTORY_ROUTE } from '@/services/asset-inventory/routes/route-constant';

const router = useRouter();

interface Props {
    extraParams?: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {
    extraParams: () => ({}),
});
interface JobItem extends JobModel {
    progress: string;
    color?: string;
    provider?: string;
    collector?: string;
}

const state = reactive({
    loading: false,
    skeletons: range(2),
    timezone: computed(() => store.state.user.timezone || 'UTC'),
    providers: computed<ProviderReferenceMap>(() => store.getters['reference/providerItems']),
    jobs: [] as JobModel[],
    collectors: [] as CollectorModel[],
    collectorsMap: computed<Record<string, CollectorModel>>(() => {
        const map = {} as Record<string, CollectorModel>;
        state.collectors.forEach((collector) => {
            map[collector.collector_id] = collector;
        });
        return map;
    }),
    items: computed<JobItem[]>(() => {
        const collectorsMap = state.collectorsMap;
        const providersMap = state.providers;
        return state.jobs.map((job) => {
            const collector = collectorsMap[job.collector_id];
            const provider = providersMap[collector?.provider];
            return {
                ...job,
                progress: `${(Math.round((job.total_tasks - job.remained_tasks) / job.total_tasks) * 100)}%`,
                color: provider?.color,
                provider: provider?.label,
                collector: collector?.name,
            };
        });
    }),
    fields: computed(() => [
        { label: i18n.t('COMMON.WIDGETS.COLLECTING_JOBS_TITLE_TIME'), name: 'collector_info' },
        { label: i18n.t('COMMON.WIDGETS.COLLECTING_JOBS_STATUS'), name: 'progress' },
    ]),
});

/* util */
const timeFormatter = (value) => {
    let time = dayjs(dayjs(value)).utc();
    if (state.timezone !== 'UTC') {
        time = dayjs(dayjs(value)).tz(state.timezone);
    }
    return time.format('MM-DD HH:mm ~');
};

/* api */
const fetchCollectors = async () => {
    try {
        const res = await SpaceConnector.clientV2.inventory.collector.list<CollectorListParameters, ListResponse<CollectorModel>>({
            query: {
                page: {
                    start: 1,
                    limit: 5,
                },
            },
        });
        state.collectors = res.results;
    } catch (e) {
        ErrorHandler.handleError(e);
        state.collectors = [];
    }
};
const fetchJobs = async (collectorIdList: string[]) => {
    try {
        const { results }: AnalyzeResponse<JobModel> = await SpaceConnector.clientV2.inventory.job.analyze({
            ...props.extraParams,
            query: {
                filter: [
                    {
                        k: 'collector_id',
                        v: collectorIdList,
                        o: 'in',
                    },
                    {
                        k: 'status',
                        v: ['IN_PROGRESS'],
                        o: 'in',
                    },
                ],
                group_by: ['collector_id'],
                fields: {
                    job_status: {
                        operator: 'push',
                        fields: {
                            job_id: 'job_id',
                            total_tasks: 'total_tasks',
                            remained_tasks: 'remained_tasks',
                        },
                    },
                },
            },
        });
        state.jobs = results ?? [];
    } catch (e) {
        ErrorHandler.handleError(e);
        state.jobs = [];
    }
};

const getData = async () => {
    state.loading = true;
    try {
        await fetchCollectors();
        await fetchJobs(state.collectors.map((d) => d.collector_id));
    } catch (e) {
        ErrorHandler.handleError(e);
    } finally {
        state.loading = false;
    }
};

const goToCollectorHistory = async (item) => {
    await router.push({
        name: ASSET_INVENTORY_ROUTE.COLLECTOR.HISTORY._NAME,
        hash: item.job_id,
    });
};

const init = async () => {
    await Promise.allSettled([
        store.dispatch('reference/provider/load'),
        getData(),
    ]);
};
init();
</script>

<template>
    <widget-layout>
        <template #title>
            <div class="top">
                <p class="title">
                    {{ $t('COMMON.WIDGETS.COLLECTING_JOBS') }}
                </p>
                <router-link
                    :to="{ name: ASSET_INVENTORY_ROUTE.COLLECTOR.HISTORY._NAME }"
                    class="more-btn"
                >
                    <div class="more">
                        <span class="text-xs">{{ $t('COMMON.WIDGETS.CLOUD_SERVICE.SEE_MORE') }}</span>
                        <p-i name="ic_chevron-right"
                             width="1rem"
                             height="1rem"
                             color="inherit transparent"
                        />
                    </div>
                </router-link>
            </div>
        </template>
        <template v-if="state.loading">
            <div v-for="skeleton in state.skeletons"
                 :key="skeleton"
                 class="grid grid-cols-1 gap-1 my-4 w-full"
            >
                <p-skeleton width="80%"
                            height="0.625rem"
                />
                <p-skeleton width="100%"
                            height="0.625rem"
                />
            </div>
        </template>
        <div v-else-if="!state.loading && state.items.length > 0">
            <div v-for="(item, index) in state.items"
                 :key="index"
                 class="card grid grid-cols-12 cursor-pointer"
                 @click="goToCollectorHistory(item)"
            >
                <div class="left-part col-span-10">
                    <span class="collector-provider"
                          :style="{color: item.color }"
                    >{{ item.provider }}</span>
                    <span class="collector-title">{{ item.collector }}</span>
                    <br><span class="time">{{ timeFormatter(item.created_at) }}</span>
                </div>
                <div class="right-part col-span-2">
                    <p-i name="ic_settings-filled"
                         animation="spin"
                         width="1.5rem"
                         height="1.5rem"
                    />
                </div>
            </div>
        </div>
        <div v-else
             class="no-data-wrapper"
        >
            <p-empty
                show-image
                :title="$t('COMMON.WIDGETS.COLLECTING_JOBS_NO_RUNNING')"
            >
                <template #image>
                    <img src="@/assets/images/illust_star.svg"
                         alt="empty-image"
                    >
                </template>
            </p-empty>
        </div>
    </widget-layout>
</template>

<style lang="postcss" scoped>
.top {
    @apply flex justify-between pb-4;
    .title {
        @apply text-gray-900;
        font-size: 1rem;
        line-height: 1.2;
        font-weight: bold;
    }
    .more-btn {
        @apply flex-shrink-0 flex justify-end;
        font-size: 0.75rem;
        .more {
            @apply text-sm text-blue-600 font-normal float-right inline-flex items-center cursor-pointer;
            &:hover {
                @apply text-secondary underline;
            }
        }
    }
}
.widget-layout {
    @apply border border-gray-100 rounded-lg;
    position: relative;
    min-height: 18.75rem;
}

.no-data-wrapper {
    position: absolute;
    width: 100%;
    left: 0;
    top: 6rem;
}
.card {
    @apply rounded-md;
    padding: 0.75rem 1rem;
    &:nth-child(odd) {
        @apply bg-primary4;
    }
    .left-part {
        .collector-provider {
            font-size: 0.875rem;
            line-height: 1.4;
            margin-right: 0.25rem;
        }
        .collector-title {
            @apply truncate;
            display: inline-block;
            max-width: 9rem;
            line-height: 1.4;
            vertical-align: top;
            font-size: 0.875rem;

            @media screen and (width < 576px) {
                max-width: initial;
            }
        }
        .time {
            @apply text-gray-500;
            font-size: 0.75rem;
            line-height: 1.5;
        }
    }
    .right-part {
        margin: auto;
    }
}
</style>

