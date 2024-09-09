'use client';

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const baseUrl = 'http://localhost:8080';
const db = 'dev';

async function authorizeUriCb({ code, state, realmId }) {
  try {
    // const parseRedirect = req.url;

    const resp = await axios.get(
      `${baseUrl}/api/quickbooks/authorize-uri-cb?db=${db}&code=${code}&state=${state}&realmId=${realmId}`
    );
    console.log({
      d: resp.data,
    });
    return resp.data;
  } catch (err) {
    console.warn({ err });
  }
  return {};
}

export default function Redirect() {
  const [token, setToken] = useState({});
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const realmId = searchParams.get('realmId');
  return (
    <div id="redirect">
      <h1>Redirection callback</h1>
      <p>redirected</p>
      <pre>
        {code}, {state}, {realmId}
      </pre>
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          const resp = await authorizeUriCb({
            code,
            state,
            realmId,
          });
          console.log({
            resp,
          });
          let token = resp.token;
          try {
            token = JSON.parse(resp.token);
            setToken(token);
          } catch {
            setToken(resp.token);
          }
        }}
      >
        Callback for token
      </button>
      <pre>{JSON.stringify(token, null, 1)}</pre>
      <a href="/">home</a>
    </div>
  );
}
