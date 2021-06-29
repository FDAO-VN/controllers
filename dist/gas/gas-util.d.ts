import { GasFeeEstimates, LegacyGasPriceEstimate, EstimatedGasFeeTimeBounds } from './GasFeeController';
export declare function fetchGasEstimates(): Promise<GasFeeEstimates>;
export declare function fetchLegacyGasPriceEstimate(ethQuery: any): Promise<LegacyGasPriceEstimate>;
export declare function calculateTimeEstimate(maxPriorityFeePerGas: string, maxFeePerGas: string, gasFeeEstimates: GasFeeEstimates): EstimatedGasFeeTimeBounds;
