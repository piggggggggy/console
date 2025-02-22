<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { Location } from 'vue-router';

import { PCollapsibleToggle, PDataTable, PLink } from '@spaceone/design-system';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';

import type { ConsoleFilter } from '@cloudforet/core-lib/query/type';

import type { BudgetUsageModel } from '@/schema/cost-analysis/budget-usage/model';
import type { BudgetModel } from '@/schema/cost-analysis/budget/model';
import { i18n } from '@/translations';


import { currencyMoneyFormatter } from '@/lib/helper/currency-helper';
import { arrayToQueryString, objectToQueryString, primitiveToQueryString } from '@/lib/router-query-string';

import { GRANULARITY, GROUP_BY } from '@/services/cost-explorer/constants/cost-explorer-constant';
import { DYNAMIC_COST_QUERY_SET_PARAMS } from '@/services/cost-explorer/constants/managed-cost-analysis-query-sets';
import { getStackedChartData } from '@/services/cost-explorer/helpers/cost-explorer-chart-data-helper';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/routes/route-constant';
import { useBudgetDetailPageStore } from '@/services/cost-explorer/stores/budget-detail-page-store';
import type { Period } from '@/services/cost-explorer/types/cost-explorer-query-type';



const defaultTableKey = [{ name: 'Actual Cost', path: 'cost' }, { name: 'Current vs Budget.', path: 'ratio' }];
const monthlyPlanningTableKey = { name: 'Budgeted', path: 'limit' };

const firstColumnData = {
    date: '',
    limit: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BUDGETED'),
    cost: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.ACTUAL_COST'),
    ratio: i18n.t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BUDGET_SPENT'),
};

interface EnrichedBudgetUsageData {
    date: string;
    limit: number|string;
    cost: number;
    ratio: number;
    link?: Location | string;
}


interface BudgetTarget {
    projectId?: string;
    projectGroupId?: string;
}

type Providers = BudgetModel['provider_filter']['providers'];
type BudgetTimeUnit = BudgetModel['time_unit'];

const budgetPageStore = useBudgetDetailPageStore();
const budgetPageState = budgetPageStore.$state;

const getAccumulatedBudgetUsageData = (budgetUsageData: BudgetUsageModel[], period: Period) => getStackedChartData(budgetUsageData, GRANULARITY.MONTHLY, period);

const getBudgetRatio = (budgetTimeUnit: BudgetTimeUnit, usdCost: number, totalBudgetLimit: number, monthlyLimit: number) => {
    if (totalBudgetLimit === 0 || monthlyLimit === 0) return '-';
    return (budgetTimeUnit === 'TOTAL') ? `${Math.round((usdCost / totalBudgetLimit) * 100)}%`
        : `${Math.round((usdCost / monthlyLimit) * 100)}%`;
};
const getConvertedConsoleFilters = (budgetFilter: Record<string, string[]>): ConsoleFilter[] => {
    const consoleFilters: ConsoleFilter[] = [];
    Object.entries(budgetFilter).forEach(([k, v]) => {
        if (v.length) {
            consoleFilters.push({ k, v, o: '=' });
        }
    });
    return consoleFilters;
};

const getBudgetUsageDataWithRatioAndLink = (accumulatedBudgetData, budgetTimeUnit: BudgetTimeUnit, totalBudgetLimit: number, providers: Providers, budgetTarget: BudgetTarget) => {
    const costTypeFilters = {
        provider: providers,
    };
    let targetFilters = {};
    if (budgetTarget.projectGroupId) targetFilters = { project_group_id: [budgetTarget.projectGroupId] };
    else if (budgetTarget.projectId) targetFilters = { project_id: [budgetTarget.projectId] };
    return accumulatedBudgetData.map((d) => {
        const period = {
            start: dayjs.utc(d.date).format('YYYY-MM'),
            end: dayjs.utc(d.date).format('YYYY-MM'),
        };
        const ratio = getBudgetRatio(budgetTimeUnit, d.cost, totalBudgetLimit, d.limit);
        // const ratio = (budgetTimeUnit === 'TOTAL') ? `${Math.round((d.cost / totalBudgetLimit) * 100)}%`
        //     : `${Math.round((d.cost / d.limit) * 100)}%`;
        const link = {
            name: COST_EXPLORER_ROUTE.COST_ANALYSIS.QUERY_SET._NAME,
            params: {
                dataSourceId: state.budgetData?.data_source_id,
                costQuerySetId: DYNAMIC_COST_QUERY_SET_PARAMS,
            },
            query: {
                granularity: primitiveToQueryString(GRANULARITY.DAILY),
                group_by: arrayToQueryString([GROUP_BY.PRODUCT]),
                period: objectToQueryString(period),
                filters: objectToQueryString(getConvertedConsoleFilters({ ...costTypeFilters, ...targetFilters })),
            },
        };
        return {
            ...d, ratio, link,
        };
    });
};

const getEnrichedBudgetUsageData = (
    budgetUsageData: BudgetUsageModel[],
    period: Period,
    budgetTimeUnit: BudgetTimeUnit,
    totalBudgetLimit: number,
    providers: Providers,
    budgetTarget: BudgetTarget,
): EnrichedBudgetUsageData[] => {
    const _budgetUsageData = cloneDeep(budgetUsageData);
    const accumulatedBudgetData = getAccumulatedBudgetUsageData(_budgetUsageData, period);
    const budgetUsageDataWithRatioAndLink = getBudgetUsageDataWithRatioAndLink(
        accumulatedBudgetData,
        budgetTimeUnit,
        totalBudgetLimit,
        providers,
        budgetTarget,
    );
    return [firstColumnData, ...budgetUsageDataWithRatioAndLink] as unknown as EnrichedBudgetUsageData[];
};

const state = reactive({
    budgetUsageData: computed<BudgetUsageModel[]|null>(() => budgetPageState.budgetUsageData),
    budgetData: computed<BudgetModel|null>(() => budgetPageState.budgetData),
    budgetTimeUnit: computed<BudgetTimeUnit>(() => state.budgetData?.time_unit),
    budgetPeriod: computed<Period>(() => ({
        start: state.budgetData?.start,
        end: state.budgetData?.end,
    })),
    providers: computed<Providers>(() => state.budgetData?.provider_filter?.providers ?? []),
    budgetTarget: computed<BudgetTarget>(() => ({
        projectId: state.budgetData?.project_id,
        projectGroupId: state.budgetData?.project_group_id,
    })),
    totalBudgetLimit: computed<number>(() => state.budgetData?.limit ?? 0),
    enrichedBudgetUsageData: computed<EnrichedBudgetUsageData[]>(
        () => getEnrichedBudgetUsageData(
            state.budgetUsageData,
            state.budgetPeriod,
            state.budgetTimeUnit,
            state.totalBudgetLimit,
            state.providers,
            state.budgetTarget,
        ),
    ),
    data: [],
    fields: computed(() => state.enrichedBudgetUsageData.map((d) => ({
        name: d.date,
        label: d.date ? dayjs.utc(d.date).format('MMM YYYY') : ' ',
        // textAlign: 'right',
    }))),
    loading: true,
    showFormattedBudgetData: true,
});

const setTableItems = (name, path) => {
    const items = { name };
    state.enrichedBudgetUsageData.forEach((d) => {
        items[d.date] = { ...d, path };
    });
    return items;
};

const setTableKeysAndItems = () => {
    // set keys and items
    const tableKeys = state.budgetTimeUnit === 'TOTAL' ? defaultTableKey : [monthlyPlanningTableKey, ...defaultTableKey];
    tableKeys.forEach((key) => {
        state.data.push(setTableItems(key.name, key.path));
    });
};
setTableKeysAndItems();


</script>
<template>
    <fragment>
        <p class="toggle">
            {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.ORIGINAL_DATA') }}
            <p-collapsible-toggle :toggle-type="'switch'"
                                  :is-collapsed.sync="state.showFormattedBudgetData"
                                  class="collapsible-toggle"
            />
        </p>
        <p-data-table :fields="state.fields"
                      :items="state.data"
                      :skeleton-rows="3"
                      :stripe="false"
                      :selectable="false"
                      :disable-copy="true"
                      :disable-hover="true"
                      class="budget-summary-table"
        >
            <template #col-format="{field, value}">
                <template v-if="field.name && value.path === 'limit'">
                    {{ currencyMoneyFormatter(
                        value[value.path],
                        { currency: state.budgetData?.currency, notation: state.showFormattedBudgetData ? 'compact': 'standard' }
                    ) }}
                </template>
                <template v-else-if="field.name && value.path === 'cost'">
                    <p-link v-if="dayjs.utc(value.date).isSameOrBefore(dayjs.utc())"
                            :to="value.link"
                            highlight
                    >
                        {{ currencyMoneyFormatter(
                            value[value.path],
                            { currency: state.budgetData?.currency, notation: state.showFormattedBudgetData ? 'compact': 'standard' }
                        ) }}
                    </p-link>
                    <span v-else>--</span>
                </template>
                <span v-else>{{ value[value.path] }}</span>
            </template>
        </p-data-table>
    </fragment>
</template>
<style lang="postcss" scoped>
.toggle {
    @apply font-bold flex items-center;
    font-size: 0.875rem;
    line-height: 125%;
    margin-bottom: 0.75rem;
    gap: 0.5rem;
}
</style>
