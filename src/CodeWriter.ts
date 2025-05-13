/**
The CodeWriter’s job is to translate the understood VM
command into assembly instructions that realize the desired operation on
the Hack platform
 */

import { writeFileSync } from "fs";
import { CommandType, RAM_SEGMENTS, VM_SEGMENTS } from "./constants";
import { ComparisonCW, CompCommand } from "./ComparisonCW";
import { ArithmeticCW } from "./ArithmeticCW";

export class CodeWriter {
  private output: string;
  constructor(outputFile: string) {
    // empty file
    writeFileSync(outputFile, "");
    this.output = outputFile;
  }

  writeLine(line: string) {
    writeFileSync(this.output, line + "\n", { flag: "a" });
  }

  writeArithmetic(command: string) {
    const arithmeticOps = ["add", "and", "or", "sub"];
    const comparisonCommands = ["lt", "gt", "eq"];
    let asm = [`// ${command}`];
    if (arithmeticOps.includes(command)) {
      asm = asm.concat(ArithmeticCW.translate(command));
    } else if (comparisonCommands.includes(command)) {
      asm = asm.concat(ComparisonCW.translate(command as CompCommand));
    } else {
      asm = asm.concat(this[command]());
    }
    this.writeLine(asm.join("\n"));
  }

  writePushPop(
    command: CommandType.C_PUSH | CommandType.C_POP,
    segment: string,
    index: number
  ) {
    // C_PUSH local 2
    switch (command) {
      case CommandType.C_PUSH:
        if (segment === VM_SEGMENTS.constant) {
          this.w_pushConstant(index);
        } else if (segment === VM_SEGMENTS.pointer) {
          this.w_pushPointer(
            index === 0 ? RAM_SEGMENTS["this"] : RAM_SEGMENTS["that"]
          );
        } else {
          this.w_pushSegment(RAM_SEGMENTS[segment], index);
        }
        break;
      case CommandType.C_POP:
        if (segment === VM_SEGMENTS.pointer) {
          this.w_popPointer(
            index === 0 ? RAM_SEGMENTS["this"] : RAM_SEGMENTS["that"]
          );
        } else {
          this.w_popSegment(RAM_SEGMENTS[segment], index);
        }
        break;
    }
  }

  // push stack value into this/that segment
  private w_popPointer(segment: RAM_SEGMENTS.this | RAM_SEGMENTS.that) {
    // pointer 0 - THIS
    // pointer 1 - THAT
    const asm = [
      `// push pointer "${segment}"`,
      `@SP`,
      "AM=M-1",
      "D=M",
      `@${segment}`,
      `M=D`,
    ].join("\n");
    this.writeLine(asm);
  }

  // push this/that segment onto the stack
  private w_pushPointer(segment: RAM_SEGMENTS.this | RAM_SEGMENTS.that) {
    // pointer 0 - THIS
    // pointer 1 - THAT
    const asm = [
      `// pop pointer "${segment}"`,
      `@${segment}`,
      `D=M`,
      `@SP`,
      `A=M`,
      `M=D`,
      `@SP`,
      `M=M+1`,
    ].join("\n");
    this.writeLine(asm);
  }

  private w_pushConstant(value: number) {
    const asm = [
      `// push constant ${value}`,
      `@${value}`,
      "D=A",
      "@SP",
      "A=M",
      `M=D`,
      "@SP",
      "M=M+1",
    ].join("\n");
    this.writeLine(asm);
  }

  // push local 10
  private w_pushSegment(segment: string, value: number) {
    if (segment === "TEMP") {
      const asm = [
        `// push ${segment} ${value}`,
        `@${5 + value}`,
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ].join("\n");
      return this.writeLine(asm);
    }
    const asm = [
      `// push ${segment} ${value}`,
      `@${value}`,
      `D=A`,
      `@${segment}`,
      `A=D+M`,
      `D=M`,
      `@SP`,
      `A=M`,
      `M=D`,
      `@SP`,
      `M=M+1`,
    ].join("\n");

    this.writeLine(asm);
  }

  private w_popSegment(segment: string, value: number) {
    if (segment === "TEMP") {
      const asm = [
        `// pop ${segment} ${value}`,
        "@SP",
        "AM=M-1",
        "D=M",
        `@${5 + value}`,
        "M=D",
      ].join("\n");
      return this.writeLine(asm);
    }

    const asm = [
      `// pop ${segment} ${value}`,
      `@${value}`,
      `D=A`,
      `@${segment}`,
      `D=D+M`,
      `@R13`,
      `M=D`,

      `@SP`,
      `AM=M-1`,
      `D=M`,
      `@R13`,
      `A=M`,
      `M=D`,
    ].join("\n");
    this.writeLine(asm);
  }

  private neg() {
    return ["@SP", "A=M-1", "M=-M"];
  }

  private not() {
    return ["@SP", "A=M-1", "M=!M"];
  }

  public endProgram() {
    this.writeLine(["(END)", "@END", "0;JMP"].join("\n"));
  }

  close() {}
}
