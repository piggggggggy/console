import type { TimeUnit } from '@amcharts/amcharts4/core';
import type { DataTableFieldType } from '@spaceone/design-system/types/data-display/tables/data-table/type';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';

import type { ConsoleFilter } from '@cloudforet/core-lib/query/type';

import { FILTER } from '@/services/cost-explorer/lib/config';
import type {
    Period, Granularity, CostFiltersMap,
} from '@/services/cost-explorer/type';


export const getConvertedFilter = (filters: CostFiltersMap): ConsoleFilter[] => {
    const results: ConsoleFilter[] = [];
    Object.entries(filters).forEach(([category, filterItems]) => {
        const keys = [...new Set(filterItems.map((d) => d.k))];
        if (keys[0] === category) { // ex. provider
            results.push({
                k: category,
                v: filterItems.map((d) => d.v),
                o: '=',
            });
        } else { // ex. tags.Name
            keys.forEach((key) => {
                results.push({
                    k: key,
                    v: filterItems.filter((d) => d.k === key).map((d) => d.v),
                    o: '=',
                });
            });
        }
    });
    return results;
};

export const getConvertedBudgetFilter = (filters: CostFiltersMap): ConsoleFilter[] => {
    // there's no tag filters in budget widgets
    const results: ConsoleFilter[] = [];
    Object.entries(filters).forEach(([category, filterItems]) => {
        if ((category === FILTER.PROJECT || category === FILTER.PROJECT_GROUP)) {
            results.push({
                k: category,
                v: filterItems.map((d) => d.v),
                o: '=',
            });
        } else if (filterItems.length) {
            const values = [] as Array<string|null>;
            filterItems.forEach((f) => {
                values.push(f.v);
            });
            results.push({
                k: `cost_types.${category}`,
                v: [null, ...values],
                o: '=',
            });
        }
    });
    return results;
};

export const getTimeUnitByPeriod = (granularity: Granularity, start: Dayjs, end: Dayjs): TimeUnit => {
    if (end.diff(start, 'month') < 2) return 'day';
    if (end.diff(start, 'year') < 2) return 'month';
    return 'year';
};

export const getInitialDates = (): Period => {
    const start = dayjs.utc().subtract(5, 'month').startOf('month').format(); // 6 months ago
    const end = dayjs.utc().endOf('month').format();
    return { start, end };
};

/* data table field */
const getDataTableDateFields = (granularity: Granularity, period: Period): DataTableFieldType[] => {
    const dateFields: DataTableFieldType[] = [];
    const start = dayjs.utc(period.start);
    const end = dayjs.utc(period.end);

    const timeUnit = getTimeUnitByPeriod(granularity, dayjs.utc(period.start), dayjs.utc(period.end));

    let labelDateFormat = 'M/D';
    if (timeUnit === 'month') {
        labelDateFormat = 'MMM';
    } else if (timeUnit === 'year') {
        labelDateFormat = 'YYYY';
    }

    let now = start;
    let index = 0;
    while (now.isSameOrBefore(end, timeUnit)) {
        dateFields.push({
            name: `cost_sum.${index}.value`,
            label: now.locale('en').format(labelDateFormat),
            textAlign: 'right',
            sortable: true,
        });
        now = now.add(1, timeUnit);
        index += 1;
    }
    return dateFields;
};
export const getDataTableCostFields = (granularity: Granularity, period: Period, hasGroupBy: boolean): DataTableFieldType[] => {
    const costFields: DataTableFieldType[] = [];
    if (!hasGroupBy) {
        costFields.push({
            name: 'totalCost', label: ' ', textAlign: 'right',
        });
    }
    const dateFields = getDataTableDateFields(granularity, period);
    return costFields.concat(dateFields);
};

// TODO: will be deprecated someday
interface OldType {
    [key: string]: string[];
}
export const convertFiltersInToNewType = (filters: OldType | CostFiltersMap): CostFiltersMap => {
    const _filters: OldType | CostFiltersMap = cloneDeep(filters);
    Object.entries(_filters).forEach(([category, values]) => {
        if (values?.length && typeof values[0] === 'string') {
            _filters[category] = values.map((d) => ({
                k: category, v: d as string, o: '=',
            }));
        }
    });
    return _filters as CostFiltersMap;
};
