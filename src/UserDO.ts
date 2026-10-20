import { DurableObject } from "cloudflare:workers";
import { Update } from "grammy/types";
import { Bot, webhookCallback } from "grammy/web";

export class UserDO extends DurableObject<Env> {
  #bot: Bot;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.#bot = new Bot(env.BOT_TOKEN);

    this.#bot.command("start", (ctx) => {
      ctx.chat
      return ctx.reply("Hello! I'm UserDO internal bot.");
    });
  }

  handleUpdate(update: Request): Promise<Response> {
    return webhookCallback(this.#bot, "cloudflare-mod")(update);
  }
}
