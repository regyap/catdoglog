# Pawprint

Pawprint is an iOS-ready community care app for recording approximate stray-animal sightings, building a personal field guide, coordinating real-world feeding, and sending virtual treats.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npx expo start` and scan the QR code with Expo Go on an iPhone.

## Ship to iOS

1. Create an Expo account and Apple Developer account.
2. Run `npx eas-cli login`, then `npx eas-cli init` (this replaces the placeholder project ID in `app.json`).
3. Run `npx eas-cli build --platform ios --profile production`.
4. Run `npx eas-cli submit --platform ios` to upload the build to App Store Connect.

Apple credentials, App Store privacy details, screenshots, support URLs, and review submission must be completed by the account owner. A Mac is not required for EAS cloud builds.

## Production architecture

The included build is a polished local prototype. Before public release, connect the UI to a backend with authentication, friend permissions, image moderation, push notification delivery, and an immutable care log. Store only coarse public coordinates; reveal more precise data solely to vetted rescuers. Rate-limit confirmations, prevent duplicate feeding, expire stale sightings, and provide abuse/reporting workflows.

Virtual treats and real-world feeding confirmations must remain distinct. A virtual action can encourage engagement but must never update the physical feeding timestamp.

## Telegram channel ingestion

The `server/` service accepts Telegram `channel_post` and `edited_channel_post` webhook updates. When a channel post contains a location or venue, it stores the Telegram timestamp, caption, detected species, channel, and coordinates in PostgreSQL. The public API returns displaced coordinates rather than the exact animal location.

1. Create a bot by messaging `@BotFather`, keep its token private, and add the bot as an administrator in each participating channel so it can receive channel posts.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and the public HTTPS API URL.
3. Run `npm run db:migrate`, then `npm run server`.
4. Register the webhook:

   ```bash
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://YOUR_API/telegram/webhook","secret_token":"YOUR_SECRET","allowed_updates":["channel_post","edited_channel_post"]}'
   ```

Channel members post a Telegram location pin with a caption such as `Cat name: Miso` or `Dog #Pepper`. Telegram supplies the server timestamp; the bot must not infer a device location from ordinary text or silently track channel members.

The app/backend integration endpoint is `GET /api/sightings`. Set `EXPO_PUBLIC_API_URL` for the mobile build, then replace the prototype animal array with this endpoint's results when deploying the production backend.
