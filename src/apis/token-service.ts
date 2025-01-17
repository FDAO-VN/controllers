import { timeoutFetch } from '../util';

const END_POINT = 'https://token-api.airswap-prod.codefi.network';

function syncTokensURL(chainId: string) {
  return `${END_POINT}/sync/${chainId}`;
}
function getTokensURL(chainId: string) {
  return `${END_POINT}/tokens/${chainId}`;
}
function getTokenMetadataURL(chainId: string, tokenAddress: string) {
  return `${END_POINT}/token/${chainId}?address=${tokenAddress}`;
}

// Token list averages 1.6 MB in size
// timeoutFetch by default has a 500ms timeout, which will almost always timeout given the response size.
const timeout = 10000;

/**
 * Fetches the list of token metadata for a given network chainId
 *
 * @returns - Promise resolving token List
 */
export async function fetchTokenList(chainId: string): Promise<unknown> {
  const tokenURL = getTokensURL(chainId);
  const response = await queryApi(tokenURL);
  return parseJsonResponse(response);
}

/**
 * Fetch metadata for the token address provided for a given network chainId
 *
 * @return Promise resolving token metadata for the tokenAddress provided
 */
export async function fetchTokenMetadata(
  chainId: string,
  tokenAddress: string,
): Promise<unknown> {
  const tokenMetadataURL = getTokenMetadataURL(chainId, tokenAddress);
  const response = await queryApi(tokenMetadataURL);
  return parseJsonResponse(response);
}

/**
 * Forces a sync of token metadata for a given network chainId.
 * Syncing happens every 1 hour in the background, this api can
 * be used to force a sync from our side
 */
export async function syncTokens(chainId: string): Promise<void> {
  const syncURL = syncTokensURL(chainId);
  queryApi(syncURL);
}

/**
 * Perform fetch request against the api
 *
 * @return Promise resolving request response
 */
async function queryApi(apiURL: string): Promise<Response> {
  const fetchOptions: RequestInit = {
    referrer: apiURL,
    referrerPolicy: 'no-referrer-when-downgrade',
    method: 'GET',
    mode: 'cors',
  };
  fetchOptions.headers = new window.Headers();
  fetchOptions.headers.set('Content-Type', 'application/json');
  return await timeoutFetch(apiURL, fetchOptions, timeout);
}

/**
 * Parse response
 *
 * @return Promise resolving request response json value
 */
async function parseJsonResponse(apiResponse: Response): Promise<unknown> {
  const responseObj = await apiResponse.json();
  // api may return errors as json without setting an error http status code
  if (responseObj?.error) {
    throw new Error(`TokenService Error: ${responseObj.error}`);
  }
  return responseObj;
}
