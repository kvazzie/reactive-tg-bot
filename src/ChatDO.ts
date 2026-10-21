import { DurableObject } from "cloudflare:workers";
import { Bot, InlineKeyboard, webhookCallback } from "grammy/web";

type Msg = { text: string } & ({ author: "user" | "bot", id: number })

export class ChatDO extends DurableObject<Env> {
  #bot: Bot;

  #current: [];
  #dirty = false;
  #workInProgress: [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.#bot = new Bot(env.BOT_TOKEN);

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages(
        msgId INTEGER PRIMARY KEY,
        text  TEXT
      );
    `);

    this.#bot.command("start", (updCtx) => {
      this.sendMessage("Hello! I'm ChatDO #bot.");
      return this.renderToEvents();
    });

    this.#bot.command("widget", (updCtx) => {
      
      updCtx.reply(...toReply(
        _jsx(CreateButtons, {counter: 1})
      ));
      // reply(<CreateButtons counter={1}/>)
      // reply(...[text, {...}])
    });

    /* Вот этого вообще не должно быть, виджет выше должен обновляться "сам" */
    this.#bot.callbackQuery(/^widget:*/, (ctx) => {
      ctx.answerCallbackQuery()

      function editMessageText(jsx: ReturnType<typeof CreateButtons>) {
        const {text, buttons} = jsx;

        ctx.editMessageText(text, {
          reply_markup: buttons
        })
      }

      editMessageText(CreateButtons(1))
    })
  }

  handleUpdate(update: Request): Promise<Response> {
    return webhookCallback(this.#bot, "cloudflare-mod")(update);
  }

  sendMessage = async (text: string) => {
    this.#appendToHistory({ text, author: "bot", id: message.message_id });
    const events = await this.renderToEvents();
    return this.#commit(events);
  }

  async #add() {

  }
  async #commit(events: []) {
    const returned = await this.#bot.api.sendMessage(this.ctx.id.toString(), message);
  }
  async #appendToHistory(message: Msg) {
    const { text, author, id } = message;

    const r = await this.ctx.storage.sql.exec(`
      INSERT INTO messages (msgId, text) VALUES
      (?, ?);
      `, [id, text]);
    }
    
    async getHistory() {
      // Implement logic to retrieve the message history for the chat
      return []; // Placeholder return valcreateButtons
    }
    
    async renderToEvents() {
      // const history = await this.getHistory();

  }
  async historyCount(): Promise<number> {
    // Implement logic to count the number of messages in the chat
    return 0; // Placeholder return value
  }
}

// Можно регистрировать каждый компонент в каком-то реестре, типа DI контейнера, который будет вытягивать из них экшены и затем использоваться как middleware. При использовании компонента (как jsx) он будет просто единоразово рендериться
function registerComponent(name: string, component: any) {
  // Сохранить компонент в реестре
  // componentsRegistry[name] = component;
  const {actions} = component
}
function _jsx(component: any, props: {
  children?: any,
  onClick?: () => void,
  [_: string]: any,
}) {
  return component(props);
}
function toReply(obj: ReturnType<_jsx>): [string, { reply_markup: ReturnType<_jsx>["buttons"] }] {
  const {text, buttons} = obj;
  return [text, { reply_markup: buttons }]
}

function CreateButtons(counter: number) {
  // const [count, setCount] = useState(counter);
  
  const text = `hello! i'm chatdo #bot. counter: ${counter}`;
  const buttons = new InlineKeyboard()
  .add(InlineKeyboard.text("inc", "widget:INC")).success()
  .add(InlineKeyboard.text("dec", "widget:DEC")).primary()
  .row()
  .add(InlineKeyboard.text("reset", "widget:RES"));
  
  // function res() {
  //   setCount(0)
  // }
    
    return {text, buttons} as const;
    
    // const buttons = new inlinekeyboard()
    //   .add(inlinekeyboard.text("inc", "widget:inc")).success()
    //   .add(inlinekeyboard.text("dec", "widget:dec")).primary()
    //   .row()
    //   .add(inlinekeyboard.text("reset", "widget:res"));
    
  // <message>
  //   <Text>hello! i'm chatdo #bot. counter: {count}</Text>
  //   <keyboard>
  //     <Button onClick={inc}>inc</Button>
  //     <Button onClick={dec}>dec</Button>
  //     <Br/>
  //     <Button onClick={res}>reset</Button>
  //   </keyboard>
  // </message>
  //
  // <button callback_data="inc"></button>
  //
  // {
    //   text: "...",
    //   inline_keyboard: [
  //     {  }
  //   ]
  // }
}
type CallbackQueryFn =Parameters<Bot["callbackQuery"]>[1];

function callbackQuery(fn: CallbackQueryFn) {
  
}
const act = callbackQuery(ctx => {
  ctx.answerCallbackQuery()

  ctx.editMessageText(...toReply(
    _jsx(CreateButtons, {counter: 1})
  ))
})

type Actions = {
  [_:string]: [string, Parameters<Bot["callbackQuery"]>[1]],
};
const actions: Actions = {
  inc: ["callbackQuery", ctx => {
    ctx.answerCallbackQuery()

    ctx.editMessageText(...toReply(
      _jsx(CreateButtons, {counter: 0})
    ))
  }],
  dec: ["callbackQuery", ctx => {
    ctx.answerCallbackQuery()

    const {text, buttons} = CreateButtons(1)

    ctx.editMessageText(text, {
      reply_markup: buttons
    })
  }],
  res: ["callbackQuery", ctx => {
    ctx.answerCallbackQuery()

    const {text, buttons} = CreateButtons(1)

    ctx.editMessageText(...toReply(
      _jsx(CreateButtons, {counter: 0})
    ))
  }],
}
CreateButtons.actions = actions;
