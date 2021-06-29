import type { Patch } from 'immer';
import { BaseController } from '../BaseControllerV2';
import type { RestrictedControllerMessenger } from '../ControllerMessenger';
import type { NetworkController, NetworkState } from '../network/NetworkController';
import { fetchGasEstimates as defaultFetchGasEstimates, fetchLegacyGasPriceEstimate as defaultFetchLegacyGasPriceEstimate } from './gas-util';
export declare type unknownString = 'unknown';
export interface EstimatedGasFeeTimeBounds {
    lowerTimeBound: number | null;
    upperTimeBound: number | unknownString;
}
/**
 * @type LegacyGasPriceEstimate
 *
 * A single gas price estimate for networks and accounts that don't support EIP-1559
 *
 * @property gasPrice - A GWEI hex number, the result of a call to eth_gasPrice
 */
export interface LegacyGasPriceEstimate {
    gasPrice: string;
}
/**
 * @type Eip1559GasFee
 *
 * Data necessary to provide an estimate of a gas fee with a specific tip
 *
 * @property minWaitTimeEstimate - The fastest the transaction will take, in milliseconds
 * @property maxWaitTimeEstimate - The slowest the transaction will take, in milliseconds
 * @property suggestedMaxPriorityFeePerGas - A suggested "tip", a GWEI hex number
 * @property suggestedMaxFeePerGas - A suggested max fee, the most a user will pay. a GWEI hex number
 */
interface Eip1559GasFee {
    minWaitTimeEstimate: number;
    maxWaitTimeEstimate: number;
    suggestedMaxPriorityFeePerGas: string;
    suggestedMaxFeePerGas: string;
}
/**
 * @type GasFeeEstimates
 *
 * Data necessary to provide multiple GasFee estimates, and supporting information, to the user
 *
 * @property low - A GasFee for a minimum necessary combination of tip and maxFee
 * @property medium - A GasFee for a recommended combination of tip and maxFee
 * @property high - A GasFee for a high combination of tip and maxFee
 * @property estimatedNextBlockBaseFee - An estimate of what the base fee will be for the pending/next block. A GWEI hex number
 */
export interface GasFeeEstimates {
    low: Eip1559GasFee;
    medium: Eip1559GasFee;
    high: Eip1559GasFee;
    estimatedBaseFee: string;
}
/**
 * @type GasFeeState
 *
 * Gas Fee controller state
 *
 * @property gasFeeEstimates - Gas fee estimate data based on new EIP-1559 properties
 * @property estimatedGasFeeTimeBounds - Estimates representing the minimum and maximum
 */
export declare type GasFeeState = {
    gasFeeEstimates: GasFeeEstimates | LegacyGasPriceEstimate | Record<string, never>;
    estimatedGasFeeTimeBounds: EstimatedGasFeeTimeBounds | Record<string, never>;
};
declare const name = "GasFeeController";
export declare type GasFeeStateChange = {
    type: `${typeof name}:stateChange`;
    payload: [GasFeeState, Patch[]];
};
export declare type GetGasFeeState = {
    type: `${typeof name}:getState`;
    handler: () => GasFeeState;
};
/**
 * Controller that retrieves gas fee estimate data and polls for updated data on a set interval
 */
export declare class GasFeeController extends BaseController<typeof name, GasFeeState> {
    private intervalId?;
    private intervalDelay;
    private pollTokens;
    private fetchGasEstimates;
    private fetchLegacyGasPriceEstimate;
    private getCurrentNetworkEIP1559Compatibility;
    private getCurrentAccountEIP1559Compatibility;
    private ethQuery;
    /**
     * Creates a GasFeeController instance
     *
     */
    constructor({ interval, messenger, state, fetchGasEstimates, fetchLegacyGasPriceEstimate, getCurrentNetworkEIP1559Compatibility, getCurrentAccountEIP1559Compatibility, getProvider, onNetworkStateChange, }: {
        interval?: number;
        messenger: RestrictedControllerMessenger<typeof name, GetGasFeeState, GasFeeStateChange, never, never>;
        state?: Partial<GasFeeState>;
        fetchGasEstimates?: typeof defaultFetchGasEstimates;
        fetchLegacyGasPriceEstimate?: typeof defaultFetchLegacyGasPriceEstimate;
        getCurrentNetworkEIP1559Compatibility: () => Promise<boolean>;
        getCurrentAccountEIP1559Compatibility?: () => boolean;
        getProvider: () => NetworkController['provider'];
        onNetworkStateChange: (listener: (state: NetworkState) => void) => void;
    });
    fetchGasFeeEstimates(): Promise<GasFeeState | undefined>;
    getGasFeeEstimatesAndStartPolling(pollToken: string | undefined): Promise<string>;
    /**
     * Gets and sets gasFeeEstimates in state
     *
     * @returns GasFeeEstimates
     */
    _fetchGasFeeEstimateData(): Promise<GasFeeState | undefined>;
    /**
     * Remove the poll token, and stop polling if the set of poll tokens is empty
     */
    disconnectPoller(pollToken: string): void;
    stopPolling(): void;
    /**
     * Prepare to discard this controller.
     *
     * This stops any active polling.
     */
    destroy(): void;
    private _startPolling;
    private _poll;
    private resetState;
    private getEIP1559Compatibility;
    getTimeEstimate(maxPriorityFeePerGas: string, maxFeePerGas: string): EstimatedGasFeeTimeBounds | Record<string, never>;
}
export default GasFeeController;
