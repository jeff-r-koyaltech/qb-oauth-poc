import OAuthClient from 'intuit-oauth';

// these caches should keep re-using an OAuth client / tokens at a per user level
const clientCache = {};
const defaultUserId = 'default'; // TODO - cache these OAuth client objects by user ID once we move to JWT

// facilitate secure OAuth 2.0 sign-on to Quickbooks
// TODO - implement CSRF (basically `${envName}|${someUuid}` will do...just have to have a
// unique not guessable number that we compare on the redirect after successful auth)
// ideally generated by the frontend code
// https://developer.intuit.com/app/developer/qbpayments/docs/develop/authentication-and-authorization/oauth-2.0#step-1-prepare-authorization-request
export const authorizeUri = async (req, res) => {
  // console.time('authorizeUri');
  const userId = defaultUserId;
  // init the oauth client
  const { clientId, clientSecret, environment, redirectUri } = req.query;
  clientCache[userId] = new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri,
    logging: true,
  });

  const authUri = clientCache[userId].authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: req?.query?.state || 'dev',
  });
  // console.timeEnd('authorizeUri');

  console.log({
    authUri,
  });
  res.json({
    authUri, // a URL for the popup window (https://*.intuit.com....)
  });
};

export const onAuthorizeCB = async (req, res, next) => {
  console.log('AUTH CB!!!');
  // console.time('onAuthorizeCB');
  const userId = defaultUserId;
  // req.url example:
  // '/callback?code=AB123&state=localhost&realmId=876'
  try {
    if (clientCache[userId] == null) {
      throw new Error('No OAuth client context');
    }
    const isValid = clientCache[userId].isAccessTokenValid();
    let token = clientCache[userId].getToken();
    if (isValid) {
      res.send({
        status: 'success',
        type: 'cached',
        token,
      });
    } else if (token.realmId !== '' && isValid == false) {
      // needs a refresh
      await clientCache[userId].refresh();
      token = clientCache[userId].getToken();
      res.send({
        status: 'success',
        type: 'refreshed',
        token,
      });
    } else {
      // fetch a new starting token
      const urlParams = new URLSearchParams(req.url);
      // const companyId = urlParams.get('realmId');
      urlParams.delete('db'); // remove our Timbersite-specific parameter(s)
      const qbUrl = decodeURIComponent(urlParams.toString()).replace(
        '/api/quickbooks/authorize-uri-cb',
        '/redirect'
      );
      console.log({
        url: req.url,
        qbUrl,
      });
      const authResponse = await clientCache[userId].createToken(qbUrl);
      // console.timeEnd('onAuthorizeCB');
      res.send({
        status: 'success',
        type: 'new',
        token: authResponse.json,
      });
    }
  } catch (err) {
    console.error({
      message: err?.message || '',
      data: err?.response?.data || {},
      headers: err?.response?.headers || [],
    });
    // console.timeEnd('onAuthorizeCB');
    next(new Error('Unable to complete OAuth token creation'));
  }
};

export const getToken = async (req, res, next) => {
  try {
    const userId = defaultUserId;
    if (clientCache[userId] == null) {
      throw new Error('No OAuth client context');
    }
    const token = clientCache[userId].getToken();
    if (token.length === 0) {
      console.warn(`No token for user ${userId}`);
    }
    /*
    Example:
    {
      "x_refresh_token_expires_in": 8726400,
      "refresh_token": "AB11730665...n7iFDcV3UGVHpst6AFIu",
      "token_type": "bearer",
      "access_token": "eyJlbmM....n0..zDsdTjbmP3tJpxqEKaT3lQ.qGo-E-lE....rzbLnRto2w",
      "expires_in": 3600
    }
    */
    res.send({
      token,
    });
  } catch (err) {
    console.error({
      message: err?.message || '',
      data: err?.response?.data || {},
      headers: err?.response?.headers || [],
    });
    // console.timeEnd('onAuthorizeCB');
    next(new Error('Unable to get token'));
  }
};

export const refreshToken = async (req, res, next) => {
  // console.time('refreshToken');
  const userId = defaultUserId;
  try {
    if (clientCache[userId] == null) {
      throw new Error('No OAuth client context');
    }
    await clientCache[userId].refresh();
    const token = clientCache[userId].getToken();
    // console.timeEnd('refreshToken');
    res.send({ status: 'success', token });
  } catch (err) {
    console.error(err?.message);
    // console.timeEnd('refreshToken');
    next(new Error('Unable to complete OAuth token refresh'));
  }
};

// Quickbooks apparently only allows API calls from a backend where oauth client is
export const proxyApiCall = async (req, res, next) => {
  // console.time('proxyApiCall');
  const userId = defaultUserId;
  try {
    if (clientCache[userId] == null) {
      throw new Error('No OAuth client context');
    }
    const { params } = req.body;
    const baseUrl =
      clientCache[userId].environment === 'sandbox'
        ? OAuthClient.environment.sandbox
        : OAuthClient.environment.production;
    const fullUrl = `${baseUrl}${params?.url || '/'}`;
    const result = await clientCache[userId].makeApiCall({
      ...params,
      url: fullUrl,
    });
    console.log({
      result,
    });
    // console.timeEnd('proxyApiCall');
    res.send({ status: 'success', json: result.json });
  } catch (err) {
    console.error(err?.message);
    // console.timeEnd('proxyApiCall');
    next(new Error('Unable to call api'));
  }
};

// TODO - implement CSRF (basically `${envName}|${someUuid}` will do...just have to have a
// TODO - do we even need this route? It seems like a half-baked example from the Intuit dev SDK
export const disconnectUri = async (req, res) => {
  // console.time('disconnectUri');
  const userId = defaultUserId;
  if (clientCache[userId] == null) {
    throw new Error('No OAuth client context');
  }

  const authUri = clientCache[userId].authorizeUri({
    scope: [OAuthClient.scopes.OpenId, OAuthClient.scopes.Email],
    state: req?.query?.state || 'dev',
  });
  // console.timeEnd('disconnectUri');

  res.json({
    authUri, // a URL for the popup window (https://*.intuit.com....)
  });
};

export default {};
