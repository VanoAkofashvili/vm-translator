/**
The CodeWriter’s job is to translate the understood VM
command into assembly instructions that realize the desired operation on
the Hack platform
 */

import { writeFileSync } from "fs";
import path from "path";
import { CommandType, RAM_SEGMENTS, VM_SEGMENTS } from "./constants";
import { ComparisonCW, CompCommand } from "./ComparisonCW";
import { ArithmeticCW } from "./ArithmeticCW";

export class CodeWriter {
  private output: string;
  private symbolPrefix: string;
  constructor(outputFile: string) {
    // clear the file
    writeFileSync(outputFile, "");
    this.output = outputFile;
    this.setFileName(outputFile)
  }

  // Set's the prefix for the static variables
  public setFileName(outputPath: string) {
    this.log(`setFileName: ${outputPath}`)
    this.symbolPrefix = path.basename(outputPath, ".vm");
  }

  // /
  private writeLabel(label: string) {}
  private writeGoto(label: string) {}
  private writeIf(label: string) {}

  private writeFunction(functionName:string, nVars: number) {}
  private writeCall(functionName:string, nArgs:number) {}
  private writeReturn() {}

  // /

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
        } else if (segment === VM_SEGMENTS.static) {
          this.w_pushStatic(index);
        } else {
          this.w_pushSegment(RAM_SEGMENTS[segment], index);
        }
        break;
      case CommandType.C_POP:
        if (segment === VM_SEGMENTS.pointer) {
          this.w_popPointer(
            index === 0 ? RAM_SEGMENTS["this"] : RAM_SEGMENTS["that"]
          );
        } else if (segment === VM_SEGMENTS.static) {
          this.w_popStatic(index);
        } else {
          this.w_popSegment(RAM_SEGMENTS[segment], index);
        }
        break;
    }
  }

  // pop the stack's value into static field
  private w_popStatic(value: number) {
    const asm = [
      `// pop static ${value}`,
      `@SP`,
      "AM=M-1",
      "D=M",
      `@${this.symbolPrefix}.${value}`,
      `M=D`,
    ].join("\n");
    this.writeLine(asm);
  }

  // push static value onto the stack
  private w_pushStatic(value: number) {
    const asm = [
      `// push static ${value}`,
      `@${this.symbolPrefix}.${value}`,
      `D=M`,
      `@SP`,
      `A=M`,
      `M=D`,
      `@SP`,
      `M=M+1`,
    ].join("\n");
    this.writeLine(asm);
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

  public endProgram() {
    this.writeLine(["(END)", "@END", "0;JMP"].join("\n"));
  }

  private log(log: string) {
    this.writeLine('// ' + log)
  }

  close() {}
}
