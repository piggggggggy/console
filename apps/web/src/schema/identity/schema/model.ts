import type { JsonSchema } from '@spaceone/design-system/types/inputs/forms/json-schema-form/type';

import type { Tags, TimeStamp } from '@/schema/_common/model';
import type { SchemaType } from '@/schema/identity/schema/type';

export interface SchemaModel {
    schema_id: string,
    name:string,
    schema_type: SchemaType,
    schema: JsonSchema,
    provider: string,
    related_schemas: string[],
    options: {
        help: {
            en: string,
            ko: string
        },
        external_link: string,
    },
    tags: Tags,
    is_managed: boolean,
    created_at: TimeStamp,
    updated_at: TimeStamp
}
