import type { ListResponse } from '@/api-clients/_common/schema/api-verbs/list';

import type { REFRENCE_KEY_MAP } from '../constants/reference-constant';

export type ReferenceKeyType = keyof typeof REFRENCE_KEY_MAP;

export interface ReferenceFetchInfo<T> {
    listFetchFn: (params: any) => Promise<ListResponse<T>>;
    statFetchFn?: (params: any) => Promise<ListResponse<any>>;
    name: string;
    idKey: string;
    nameKey?: string;
    only?: string[];
    searchTargets?: string[];
    nameFormatter?: (...args: any) => string;
}
