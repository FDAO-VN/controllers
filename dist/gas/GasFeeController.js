"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasFeeController = void 0;
const eth_query_1 = __importDefault(require("eth-query"));
const uuid_1 = require("uuid");
const BaseControllerV2_1 = require("../BaseControllerV2");
const util_1 = require("../util");
const gas_util_1 = require("./gas-util");
function isEIP1559GasFeee(object) {
    return ('minWaitTimeEstimate' in object &&
        'maxWaitTimeEstimate' in object &&
        'suggestedMaxPriorityFeePerGas' in object &&
        'suggestedMaxFeePerGas' in object &&
        Object.keys(object).length === 4);
}
function isEIP1559Estimate(object) {
    return ('low' in object &&
        isEIP1559GasFeee(object.low) &&
        'medium' in object &&
        isEIP1559GasFeee(object.medium) &&
        'high' in object &&
        isEIP1559GasFeee(object.high) &&
        'estimatedBaseFee' in object);
}
const metadata = {
    gasFeeEstimates: { persist: true, anonymous: false },
    estimatedGasFeeTimeBounds: { persist: true, anonymous: false },
};
const name = 'GasFeeController';
const defaultState = {
    gasFeeEstimates: {},
    estimatedGasFeeTimeBounds: {},
};
/**
 * Controller that retrieves gas fee estimate data and polls for updated data on a set interval
 */
class GasFeeController extends BaseControllerV2_1.BaseController {
    /**
     * Creates a GasFeeController instance
     *
     */
    constructor({ interval = 15000, messenger, state, fetchGasEstimates = gas_util_1.fetchGasEstimates, fetchLegacyGasPriceEstimate = gas_util_1.fetchLegacyGasPriceEstimate, getCurrentNetworkEIP1559Compatibility, getCurrentAccountEIP1559Compatibility, getProvider, onNetworkStateChange, }) {
        super({
            name,
            metadata,
            messenger,
            state: Object.assign(Object.assign({}, defaultState), state),
        });
        this.intervalDelay = interval;
        this.fetchGasEstimates = fetchGasEstimates;
        this.fetchLegacyGasPriceEstimate = fetchLegacyGasPriceEstimate;
        this.pollTokens = new Set();
        this.getCurrentNetworkEIP1559Compatibility = getCurrentNetworkEIP1559Compatibility;
        this.getCurrentAccountEIP1559Compatibility = getCurrentAccountEIP1559Compatibility;
        const provider = getProvider();
        this.ethQuery = new eth_query_1.default(provider);
        onNetworkStateChange(() => {
            const newProvider = getProvider();
            this.ethQuery = new eth_query_1.default(newProvider);
        });
    }
    fetchGasFeeEstimates() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._fetchGasFeeEstimateData();
        });
    }
    getGasFeeEstimatesAndStartPolling(pollToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pollTokens.size === 0) {
                yield this._fetchGasFeeEstimateData();
            }
            const _pollToken = pollToken || uuid_1.v1();
            this._startPolling(_pollToken);
            return _pollToken;
        });
    }
    /**
     * Gets and sets gasFeeEstimates in state
     *
     * @returns GasFeeEstimates
     */
    _fetchGasFeeEstimateData() {
        return __awaiter(this, void 0, void 0, function* () {
            let estimates;
            let estimatedGasFeeTimeBounds = {};
            let isEIP1559Compatible;
            try {
                isEIP1559Compatible = yield this.getEIP1559Compatibility();
            }
            catch (e) {
                console.error(e);
                isEIP1559Compatible = false;
            }
            if (isEIP1559Compatible) {
                try {
                    estimates = yield this.fetchGasEstimates();
                    const { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas, } = estimates.medium;
                    estimatedGasFeeTimeBounds = this.getTimeEstimate(suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas);
                }
                catch (error) {
                    try {
                        estimates = yield this.fetchLegacyGasPriceEstimate(this.ethQuery);
                    }
                    catch (error2) {
                        throw new Error(`Gas fee/price estimation failed. Message: ${error2.message}`);
                    }
                }
            }
            else {
                try {
                    estimates = yield this.fetchLegacyGasPriceEstimate(this.ethQuery);
                }
                catch (error2) {
                    throw new Error(`Gas fee/price estimation failed. Message: ${error2.message}`);
                }
            }
            const newState = {
                gasFeeEstimates: estimates,
                estimatedGasFeeTimeBounds,
            };
            this.update(() => {
                return newState;
            });
            return newState;
        });
    }
    /**
     * Remove the poll token, and stop polling if the set of poll tokens is empty
     */
    disconnectPoller(pollToken) {
        this.pollTokens.delete(pollToken);
        if (this.pollTokens.size === 0) {
            this.stopPolling();
        }
    }
    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.pollTokens.clear();
        this.resetState();
    }
    /**
     * Prepare to discard this controller.
     *
     * This stops any active polling.
     */
    destroy() {
        super.destroy();
        this.stopPolling();
    }
    // should take a token, so we know that we are only counting once for each open transaction
    _startPolling(pollToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pollTokens.size === 0) {
                this._poll();
            }
            this.pollTokens.add(pollToken);
        });
    }
    _poll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            this.intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                yield util_1.safelyExecute(() => this._fetchGasFeeEstimateData());
            }), this.intervalDelay);
        });
    }
    resetState() {
        this.update(() => {
            return defaultState;
        });
    }
    getEIP1559Compatibility() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const currentNetworkIsEIP1559Compatible = yield this.getCurrentNetworkEIP1559Compatibility();
            const currentAccountIsEIP1559Compatible = (_b = (_a = this.getCurrentAccountEIP1559Compatibility) === null || _a === void 0 ? void 0 : _a.call(this)) !== null && _b !== void 0 ? _b : true;
            return (currentNetworkIsEIP1559Compatible && currentAccountIsEIP1559Compatible);
        });
    }
    getTimeEstimate(maxPriorityFeePerGas, maxFeePerGas) {
        if (!this.state.gasFeeEstimates ||
            !isEIP1559Estimate(this.state.gasFeeEstimates)) {
            return {};
        }
        return gas_util_1.calculateTimeEstimate(maxPriorityFeePerGas, maxFeePerGas, this.state.gasFeeEstimates);
    }
}
exports.GasFeeController = GasFeeController;
exports.default = GasFeeController;
//# sourceMappingURL=GasFeeController.js.map