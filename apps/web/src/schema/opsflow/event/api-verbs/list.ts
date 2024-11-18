import type { Query } from '@cloudforet/core-lib/space-connector/type';

import type { EventType } from '@/schema/opsflow/event/type';

export interface EventListParameters {
    query?: Query;
    task_id?: string;
    event_type?: EventType;
    user_type: 'USER'|'APP'; // TODO: replace with UserType
}
