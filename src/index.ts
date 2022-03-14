import { GroupMessageEvent } from 'oicq';
import { Extension, Bot, Order, getOption, getOrder, Option } from 'kokkoro';

interface GroupOption extends Option {
  title_level: number;
}

export default class Group implements Extension {
  bot: Bot;
  option: GroupOption = {
    title_level: 2,
  }
  orders: Order[] = [
    {
      func: this.applyTitle,
      regular: /^申请头衔[\s]?.+$/,
    },
  ];

  constructor(bot: Bot) {
    this.bot = bot;
  }

  onGroupMessage(event: GroupMessageEvent) {
    const raw_message = event.raw_message;
    const option = getOption(event);
    const order = getOrder(this.orders, raw_message);

    if (option.apply) {
      order && order.call(this, event, option);
    }
  }

  async applyTitle(event: GroupMessageEvent, option: GroupOption) {
    const { uin } = this.bot;
    const { group_id, raw_message, sender } = event;
    const { user_id } = sender;
    const { title_level } = option;

    const gl = this.bot.getGroupList();
    const level = this.bot.getUserLevel(event);

    let message = null;

    switch (true) {
      case gl.get(group_id)!.owner_id !== uin:
        message = `申请头衔需要 bot 拥有群主权限才能正常使用`;
        break;
      case level < title_level:
        message = `你当前为 Level ${level}，申请头衔需要达到 Level ${title_level}`;
        break;
    }

    if (message) {
      return event.reply(message, true);
    }

    const title = raw_message.replace('申请头衔', '').trim();

    try {
      await this.bot.setGroupSpecialTitle(group_id, user_id, title);
      event.reply('申请成功', true);
    } catch (error) {
      event.reply('申请失败', true);
    }
  }
}
