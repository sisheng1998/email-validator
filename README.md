# Email Validator

Verify the validity of email address and confirms whether it exists or not

## Environment Variables

- `API_TOKEN` - Random token that will be used in the "Authorization" header to make authenticated calls to your email validator.

For `API_TOKEN`, use `openssl rand -base64 32` command in Linux/MacOS to generate random tokens quickly.

## Usage

Send emails by making a `POST` request to the server on the `/verify` endpoint with the following parameters:

You need to pass an `Authorization` header with the [authorization token](#environment-variables). Like the following: `Authorization: Bearer {API_TOKEN}`

### Request

The request should look like this:

```json
{
  "email": "john@example.com"
}
```

### Response

If everything is correct, the response should look like this:

```json
{
  "success": true,
  "result": {
    "email": "john@example.com",
    "isEmailValid": true,
    "isDisposable": false,
    "isMxRecordFound": true,
    "isSMTPConnected": true,
    "isEmailExist": true,
    "isCatchAll": true
  }
}
```

### Result

- `email` - email that you send in request body.
- `isEmailValid` - check if the format of the email is valid.
- `isDisposable` - check if the email is disposable / temporary.
- `isMxRecordFound` - check if the email has at least 1 mail exchange (MX) record.
- `isSMTPConnected` - check if the SMTP server can be connected.
- `isEmailExist` - check if the email exists.
- `isCatchAll` - check if the email is catch-all.

For `isSMTPConnected`, some server might block port 25, thus the server will be timeout in 3 seconds and return as `false`.

## Development

Copy `.env.example`, rename the new file to `.env`, and fill in the variables from [Environment Variables](#environment-variables).

Run `npm install` command to install dependencies.

Start a local server with `npm run dev`, the server will run at `http://localhost:3000`.

### Disposable Email Blocklist

To update the disposable email blocklist, add new domain(s) in `disposable_email_blocklist.conf` under `/scripts` folder.

Run `npm run populate-disposable-email-list` command, `disposableEmailList.ts` under `/src` folder will be updated.

## Deployment

Run `npm run build` command, all TypeScript files under `/src` folder will build into JavaScript files under `/dist` folder.

Start a local server with `npm run start`, the server will run at `http://localhost:3000` using `/dist/index.js` as entry point.

### Debug

Error `ERR_REQUIRE_ESM` might appear if the NodeJS server under CommonJS environment.

To fix the error, use `app.cjs` file as entry point to run the server, it should be placed same level as the `/dist` folder.

## Technology Stack

- TypeScript
- Hono
- NodeJS
