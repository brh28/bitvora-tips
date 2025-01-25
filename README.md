Simple WebApp that listens for a tip and triggers an animation.

## Getting started

1. If using an external lightning node (e.g Bitvora), you'll need a reverse proxy to accept traffic. This can be done using [ngrok](https://dashboard.ngrok.com/get-started/setup/linux). To do so, create an account and a domain. 
2. Once you have a public IP or domain, add it as a webhook in the [Bitvora API settings](https://console.bitvora.com/settings/api-keys) with the path `/tip`. For example, `https://my-ip-or-domain/tip`.
3. Copy the `sample.env` to `.env`
```
cp sample.env .env
```
and modify values accordingly.
4. With reverse proxy running (see link in step 1 if using ngrok), run the server:
```
npm run start
```