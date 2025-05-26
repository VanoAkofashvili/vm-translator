/*
The Parser’s job is to make sense out of each VM command
*/

import {readFileSync} from "fs";
import {CommandType} from "./constants";

export class Parser {
  private currentCommand: string[] | null = null;
  private srcLines: Array<string> = [];
  private lineCounter: number = 0;

  constructor(filename: string) {
    const srcCode = readFileSync(filename, "utf-8");
    srcCode.split("\n").forEach((line) => {
      if (!line || line.trim().startsWith("//")) return;
      console.log('widget::line ', line)

      this.srcLines.push(line);
    });
  }

  public hasMoreLines(): boolean {
    return !(this.lineCounter >= this.srcLines.length);
  }

  public advance() {
    if (this.hasMoreLines()) {
      const line = this.srcLines[this.lineCounter]
      const sanitized = line.split('//')[0].trim();
      this.currentCommand = sanitized.split(" ")
      this.lineCounter++;
    } else {
      console.log("EOF");
    }
  }

  public commandType(): CommandType {
    switch (this.currentCommand.at(0)) {
      case "push":
        return CommandType.C_PUSH;
      case "pop":
        return CommandType.C_POP;
      case "add":
      case "sub":
      case "neg":
      case "eq":
      case "gt":
      case "lt":
      case "and":
      case "or":
      case "not":
        return CommandType.C_ARITHMETIC;
      case 'label':
        return CommandType.C_LABEL
      case 'if-goto':
        return CommandType.C_IF
      case 'goto':
        return CommandType.C_GOTO
      case 'function':
        return CommandType.C_FUNCTION
      case 'return':
        return CommandType.C_RETURN
      default:
        throw new Error('Not implemented')
    }
  }

  // Should not be called if the current command is C_RETURN
  public arg1(): string {
    if (this.commandType() === CommandType.C_RETURN)
      // TODO
      return;
    // throw new InvalidMethodCall(CommandType.C_RETURN);

    if (this.commandType() === CommandType.C_ARITHMETIC)
      return this.currentCommand.at(0); // add, sub ...

    return this.currentCommand.at(1);
  }

  // Should be called only if the current command is C_PUSH/POP/FUNCTION/CALL
  public arg2(): number {
    const VALID_COMMANDS_FOR_ARG2 = [
      CommandType.C_PUSH,
      CommandType.C_POP,
      CommandType.C_FUNCTION,
      CommandType.C_CALL,
    ];

    if (!VALID_COMMANDS_FOR_ARG2.includes(this.commandType()))
      // TODO
      return;
    // throw new InvalidMethodCall(this.commandType());

    return Number(this.currentCommand.at(2));
  }
}
