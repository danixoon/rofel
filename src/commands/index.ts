import * as Discord from "discord.js";

export type CommandValidator<T, C> = (command: {
  context: C;
  command: T;
}) => boolean | any;
export type CommandHandler<T, C> = (command: { context: C; command: T }) => any;

export class Command<T = string[], C = Discord.Message> {
  public _template: string;
  public constructor(template: string) {
    this._template = template;
  }
  public _validator: CommandValidator<T, C> = () => false;
  public check(validator: CommandValidator<T, C>): this {
    this._validator = validator;
    return this;
  }
  public _handler: CommandHandler<T, C> = () => {};
  public handler(handler: CommandHandler<T, C>): this {
    this._handler = handler;
    return this;
  }
}

interface ICommand<T, C> {
  handler(handler: CommandHandler<T, C>): this;
  check(validator: CommandValidator<T, C>): this;
}

export class Commandor {
  public readonly commands: Command<any>[] = [];
  public command<T = any>(command: "*" | string): ICommand<T, Discord.Message> {
    const newCommand = new Command<T>(command);
    this.commands.push(newCommand);
    return newCommand;
  }

  public parse(commandText: string, context: Discord.Message) {
    const commandArgs = commandText.trim().split(/\s+/gm);

    const targetCommands = [
      this.commands.find(
        (cmd) => cmd._template.match(/\S+/gm)[0] === commandArgs[0]
      ),
    ].filter((a) => a);

    if (targetCommands.length === 0)
      targetCommands.push(
        ...this.commands.filter((cmd) => cmd._template === "*")
      );

    targetCommands.forEach((targetCommand) => {
      const matches = Array.from(
        targetCommand._template.matchAll(/\[(.+?)\]/gm)
      );
      const args = commandArgs
        .slice(1, matches.length + 1)
        .reduce((args, cmd, i) => ({ ...args, [matches[i][1]]: cmd }), {});
      if (targetCommand._validator({ command: args, context })) return;
      targetCommand._handler({ command: args, context });
    });
  }
}

export const combineCommandors = (...commandors: Commandor[]) => {
  const commandor = new Commandor();
  commandor.commands.push(
    ...commandors.reduce(
      (commands, commandor) => commands.concat(commandor.commands),
      []
    )
  );
  return commandor;
};
