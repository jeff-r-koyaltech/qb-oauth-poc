'use client'

const secrets = {
  clientId: process.env.NEXT_PUBLIC_INTUIT_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_INTUIT_CLIENT_SECRET,
};

export default function OAuthPlayground() {

  return (
    <div>
      <h1>OAuth Playground</h1>
      <h2>Step 0 - obtain client id/secret</h2>
      <pre>{JSON.stringify(secrets, null, 1)}</pre>
      <h2>Step 1 - redir to auth uri</h2>
      <a
            href="#"
            onClick={() => {
              const uri = authorizeUri();

            }}
          >
            Get auth URI
            </a>
    </div>
  );

}