import { Composer } from "grammy";

export const userComposer = new Composer();

userComposer.command("hello", async (ctx) => {
  await ctx.reply("Hello from userComposer!");
});