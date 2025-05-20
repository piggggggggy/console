import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { createImmutableObjectKeyItem, normalizeQueryKeyPart } from '@/query/query-key/_helpers/query-key-helper';

import { useQueryKeyAppContext } from './_composable/use-app-context-query-key';
import type { QueryKeyArray } from './_types/query-key-type';



type ContextKeyType = string|unknown[]|object;

type UseReferenceQueryKeyResult = {
    key: ComputedRef<QueryKeyArray>;
    withSuffix: (arg: ContextKeyType) => QueryKeyArray;
};

export const useReferenceQueryKey = (resource: string): UseReferenceQueryKeyResult => {
    // Runtime validation for development environment
    if (import.meta.env.DEV) {
        if (!resource) {
            console.warn('Required parameters (service, resource, verb) must be provided');
        }
    }

    const queryKeyAppContext = useQueryKeyAppContext();

    const queryKey = computed(() => [
        ...queryKeyAppContext.value,
        resource,
    ]);

    const suffixCache = new WeakMap<object, QueryKeyArray>();
    return {
        key: queryKey,
        withSuffix: (arg) => {
            if (typeof arg === 'object' && arg !== null) {
                const cached = suffixCache.get(arg);
                if (cached) return cached;

                const result = [...queryKey.value, ...normalizeQueryKeyPart(createImmutableObjectKeyItem(arg))];
                suffixCache.set(arg, result);
                return result;
            }
            return [...queryKey.value, arg];
        },
    };
};
