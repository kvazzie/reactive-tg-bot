import { Bot, Composer, Context, webhookCallback } from "grammy";
import { DurableObject } from "cloudflare:workers";
import { Update } from "grammy/types";
import { UserDO } from "./UserDO";
import { userComposer } from "./userComposer";

export { UserDO } from "./UserDO";
export { ChatDO } from "./ChatDO";

/**
 * Request Storage to pass context across the bot logic.
 * This allows using a single global Bot instance with multiple Durable Objects.
 */
interface BotRequestStore {
  env: Env;
  chatDO: UserDO;
}

/**
 * Custom context type for the bot.
 */
interface MyContext extends Context {
  // We'll attach the Durable Object instance here
  userDO: UserDO;
  // Environment variables
  env: Env;
}

// Cached bot instance
let bot: Bot<MyContext> | undefined;
const composer = new Composer<MyContext>();
/**
 * Initializes the global bot instance with shared handlers.
 */
function setupBot(token: string) {
  // if (bot) return bot;

  const bot = new Bot<MyContext>(token);

  return bot;
}

/**
 * Main Worker: Routes updates to the correct Durable Object.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/webhook") 
      try {
        const currentBot = setupBot(env.BOT_TOKEN);
        // currentBot.use(userComposer);

        // Ensure bot is initialized (once per isolate)
        if (!currentBot.botInfo) {
          await currentBot.init();
        }

        if (env.USER === undefined) {
          console.error("USER Durable Object namespace is not defined in the environment.");
          return new Response("Internal Server Error", { status: 500 });
        }

        currentBot.use(async (ctx, next) => {
          if (!ctx.chat || !ctx.chatId) return await next();

          ctx.chat.DO = env.CHATS!.getByName(ctx.chatId.toString());
          ctx.env = env;
        });

        currentBot.chatType("private").use()

        currentBot.command("message", async (ctx) => {
          currentBot.api.sendMessage(ctx.chatId, `
            Hello, ${ctx.chat?.first_name || 'there'}!
            It's your ${await ctx.chat.DO.historyCount()} message
          `);
        });

        const stub = env.USER.getByName(chatId.toString());

        return webhookCallback(currentBot, "cloudflare-mod")(request);
      } catch (err) {
        console.error("Worker error:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    

    return new Response("Telegram Bot Active", { status: 200 });
  },
} satisfies ExportedHandler<Env>;

// Keep the old Counter for backwards compatibility if needed
export class Counter extends DurableObject<Env> {
  private count = 0;
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
  async fetch() {
    return new Response(`${++this.count}`);
  }
}
