# Se'kret Bip auth.md

This discovery document is for software agents that need to understand Se'kret Bip authentication before attempting an authenticated request.

## Agent audience

Se'kret Bip supports agents acting on behalf of an existing, confirmed Se'kret Bip user. It does not currently issue autonomous agent identities or support unattended agent account creation.

## Registration and provisioning

- User registration URI: `https://sekretbip.net/signup`
- User sign-in URI: `https://sekretbip.net/login`
- Supported registration method: email and password through the Se'kret Bip user flow, followed by email confirmation and the applicable onboarding requirements.
- Agent provisioning: none. A human user must create and confirm the account before an agent can act with that user's authorization.
- Passive discovery clients must not submit registration or authentication requests just to test this document.

## Credential use

- Protected API resource: `https://api.sekretbip.net`
- Authenticated API requests use `Authorization: Bearer <access-token>`.
- The supported user credential is the current Supabase session access token issued after successful user authentication.
- Account passwords must not be sent to `api.sekretbip.net`.
- Missing bearer credentials are rejected; invalid bearer credentials are rejected.
- Shared application/backend credentials are implementation details and are not public agent-registration credentials.

## Agent registration methods

Current supported provisioning is `human_email_password`: a user-managed email/password account with email confirmation. Se'kret Bip does not currently advertise OAuth dynamic client registration, ID-JAG registration, verified-email assertion registration, or anonymous agent credentials.

## OAuth discovery status

Se'kret Bip does not currently publish OAuth Protected Resource Metadata or OAuth Authorization Server Metadata for agent registration. Supabase user-session JWT verification is used by the API, but that alone is not treated as a public agent OAuth registration service.

When a real OAuth authorization server and supported agent-registration flow are available, this document can advertise them together with authoritative `/.well-known/oauth-protected-resource` and authorization-server metadata.
