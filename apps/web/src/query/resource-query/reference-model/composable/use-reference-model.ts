
import { useReferenceMap } from '@/query/reference/core/reference-map/use-reference-map';
import type { ReferenceKeyType } from '@/query/reference/types/reference-type';


interface ReferenceModelOptions {
    forceFetch?: boolean;
}

export const useReferenceModel = <T, R extends Record<string, any>>(
    resourceKey: ReferenceKeyType,
    options: ReferenceModelOptions,
) => {
    const { forceFetch = false } = options;

    const { referenceMap } = useReferenceMap<T, R>(resourceKey, forceFetch);

    return {
        map: referenceMap,
    };
};
