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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTimeEstimate = exports.fetchLegacyGasPriceEstimate = exports.fetchGasEstimates = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const util_1 = require("../util");
// import { handleFetch } from '../util';
// const GAS_FEE_API = 'https://gas-fee-api-goes-here';
const mockEIP1559ApiResponses = [
    {
        low: {
            minWaitTimeEstimate: 120000,
            maxWaitTimeEstimate: 300000,
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '35',
        },
        medium: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 30000,
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '40',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '60',
        },
        estimatedBaseFee: '30',
    },
    {
        low: {
            minWaitTimeEstimate: 180000,
            maxWaitTimeEstimate: 360000,
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '40',
        },
        medium: {
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '45',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '65',
        },
        estimatedBaseFee: '32',
    },
    {
        low: {
            minWaitTimeEstimate: 60000,
            maxWaitTimeEstimate: 240000,
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '42',
        },
        medium: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 30000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '47',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '4',
            suggestedMaxFeePerGas: '67',
        },
        estimatedBaseFee: '35',
    },
    {
        low: {
            minWaitTimeEstimate: 180000,
            maxWaitTimeEstimate: 300000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '53',
        },
        medium: {
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
            suggestedMaxPriorityFeePerGas: '7',
            suggestedMaxFeePerGas: '70',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '10',
            suggestedMaxFeePerGas: '100',
        },
        estimatedBaseFee: '50',
    },
    {
        low: {
            minWaitTimeEstimate: 120000,
            maxWaitTimeEstimate: 360000,
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '35',
        },
        medium: {
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
            suggestedMaxPriorityFeePerGas: '3',
            suggestedMaxFeePerGas: '40',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '4',
            suggestedMaxFeePerGas: '60',
        },
        estimatedBaseFee: '30',
    },
    {
        low: {
            minWaitTimeEstimate: 60000,
            maxWaitTimeEstimate: 600000,
            suggestedMaxPriorityFeePerGas: '1',
            suggestedMaxFeePerGas: '35',
        },
        medium: {
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 60000,
            suggestedMaxPriorityFeePerGas: '1.8',
            suggestedMaxFeePerGas: '38',
        },
        high: {
            minWaitTimeEstimate: 0,
            maxWaitTimeEstimate: 150000,
            suggestedMaxPriorityFeePerGas: '2',
            suggestedMaxFeePerGas: '50',
        },
        estimatedBaseFee: '28',
    },
];
const getMockApiResponse = () => {
    return mockEIP1559ApiResponses[Math.floor(Math.random() * 6)];
};
function fetchGasEstimates() {
    // return handleFetch(GAS_FEE_API)
    return new Promise((resolve) => {
        resolve(getMockApiResponse());
    });
}
exports.fetchGasEstimates = fetchGasEstimates;
function fetchLegacyGasPriceEstimate(ethQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const gasPrice = yield util_1.query(ethQuery, 'gasPrice');
        return {
            gasPrice,
        };
    });
}
exports.fetchLegacyGasPriceEstimate = fetchLegacyGasPriceEstimate;
function gweiHexToWEIBN(n) {
    const BN_1000 = new ethereumjs_util_1.BN(1000, 10);
    return new ethereumjs_util_1.BN(n, 16).mul(BN_1000);
}
function calculateTimeEstimate(maxPriorityFeePerGas, maxFeePerGas, gasFeeEstimates) {
    const { low, medium, high, estimatedBaseFee } = gasFeeEstimates;
    const maxPriorityFeePerGasInWEI = gweiHexToWEIBN(maxPriorityFeePerGas);
    const maxFeePerGasInWEI = gweiHexToWEIBN(maxFeePerGas);
    const estimatedBaseFeeInWEI = gweiHexToWEIBN(estimatedBaseFee);
    const effectiveMaxPriorityFee = ethereumjs_util_1.BN.min(maxPriorityFeePerGasInWEI, maxFeePerGasInWEI.sub(estimatedBaseFeeInWEI));
    const lowMaxPriorityFeeInWEI = gweiHexToWEIBN(low.suggestedMaxPriorityFeePerGas);
    const mediumMaxPriorityFeeInWEI = gweiHexToWEIBN(medium.suggestedMaxPriorityFeePerGas);
    const highMaxPriorityFeeInWEI = gweiHexToWEIBN(high.suggestedMaxPriorityFeePerGas);
    let lowerTimeBound;
    let upperTimeBound;
    if (effectiveMaxPriorityFee.lt(lowMaxPriorityFeeInWEI)) {
        lowerTimeBound = null;
        upperTimeBound = 'unknown';
    }
    else if (effectiveMaxPriorityFee.gte(lowMaxPriorityFeeInWEI) &&
        effectiveMaxPriorityFee.lt(mediumMaxPriorityFeeInWEI)) {
        lowerTimeBound = low.minWaitTimeEstimate;
        upperTimeBound = low.maxWaitTimeEstimate;
    }
    else if (effectiveMaxPriorityFee.gte(mediumMaxPriorityFeeInWEI) &&
        effectiveMaxPriorityFee.lt(highMaxPriorityFeeInWEI)) {
        lowerTimeBound = medium.minWaitTimeEstimate;
        upperTimeBound = medium.maxWaitTimeEstimate;
    }
    else if (effectiveMaxPriorityFee.eq(highMaxPriorityFeeInWEI)) {
        lowerTimeBound = high.minWaitTimeEstimate;
        upperTimeBound = high.maxWaitTimeEstimate;
    }
    else {
        lowerTimeBound = 0;
        upperTimeBound = high.maxWaitTimeEstimate;
    }
    return {
        lowerTimeBound,
        upperTimeBound,
    };
}
exports.calculateTimeEstimate = calculateTimeEstimate;
//# sourceMappingURL=gas-util.js.map