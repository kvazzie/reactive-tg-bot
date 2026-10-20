# Reactive TG Bot

A simple hello world Telegram bot using Cloudflare Durable Objects and Grammy.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy example files and fill in your values:
   ```bash
   pnpm setup
   ```
   - Edit `.vars` and add your Telegram Bot Token from [@BotFather](https://t.me/BotFather)
   - Edit `.env` and add your Ngrok Authtoken from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)

3. Start the development environment:
   ```bash
   pnpm dev
   ```
   This will:
   - Start an ngrok tunnel to expose your local worker
   - Set up the Telegram webhook
   - Start wrangler dev to run your Cloudflare Worker locally
   - On shutdown (Ctrl+C or SIGTERM), it will:
     * Delete the webhook
     * Close the ngrok tunnel
     * Exit gracefully

## Project Structure

- `src/index.ts` - Main worker code with Telegram bot logic and Durable Object
- `wrangler.toml` - Cloudflare Worker configuration
- `.vars.example` - Template for Telegram bot token (used by wrangler)
- `.env.example` - Template for ngrok authtoken and dev port (used by dev script)
- `scripts/dev.js` - Development script that starts ngrok and wrangler with graceful shutdown
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `README.md` - Setup and usage instructions

## Available Commands

Once the bot is running, you can interact with it on Telegram:
- `/start` - Start the bot and get a hello world message
- `/help` - Show available commands
- `/counter` - Get the current counter value (demonstrates Durable Object usage)

## Notes

- The bot uses a simple in-memory counter stored in a Durable Object to demonstrate state persistence
- In production, you would deploy to Cloudflare Workers and set up a permanent webhook
- For development, ngrok provides a public URL that Telegram can use to send updates
- The dev script ensures graceful shutdown by cleaning up webhooks and ngrok tunnels