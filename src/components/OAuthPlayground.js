'use client';

import axios from 'axios';
import { useState } from 'react';

const secrets = {
  clientId: process.env.NEXT_PUBLIC_INTUIT_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_INTUIT_CLIENT_SECRET,
};
const redirectUri = 'http://localhost:3000/redirect';
const state = '';
const baseUrl = 'http://localhost:8080';
const db = 'dev';

async function authorizeUri() {
  try {
    const jsonBody = {
      ...secrets,
      environment: 'sandbox',
      redirectUri,
      state,
    };
    const resp = await axios.get(
      `${baseUrl}/api/quickbooks/authorize-uri?db=${db}`,
      {
        params: jsonBody,
      }
    );
    return resp.data;
  } catch (err) {
    console.warn({ err });
  }

  return authUri;
}
export default function OAuthPlayground() {
  const [authUri, setAuthUri] = useState('');
  return (
    <div>
      <h1>OAuth Playground</h1>
      <h2>Step 0 - obtain client id/secret</h2>
      <pre>{JSON.stringify(secrets, null, 1)}</pre>
      <h2>Step 1 - redir to auth uri</h2>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          const uri = await authorizeUri();
          setAuthUri(uri?.authUri || '');
        }}
      >
        Get auth URI
      </button>
      {authUri !== '' ? (
        <a
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          href={authUri}
        >
          Redirect on auth uri
        </a>
      ) : null}
    </div>
  );
}
