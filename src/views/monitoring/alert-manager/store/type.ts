import { AlertDataModel } from '@/views/monitoring/alert-manager/type';

export interface AlertStoreState {
	alertData: Partial<AlertDataModel>|null;
}

export interface UpdateAlertParams {
	alertId: string;
	updateParams: object;
}
