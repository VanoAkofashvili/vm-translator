/**
 The CodeWriter’s job is to translate the understood VM
 command into assembly instructions that realize the desired operation on
 the Hack platform
 */

import {writeFileSync} from "fs";
import path from "path";
import {ArithmeticCW} from "./ArithmeticCW";
import {ComparisonCW, CompCommand} from "./ComparisonCW";
import {CommandType, RAM_SEGMENTS, VM_SEGMENTS} from "./constants";

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
    public writeLabel(label: string) {
        this.writeLine(`(${label})`)
    }

    public writeGoto(label: string) {
        const asm = [
            `@${label}`,
            '0;JMP'
        ].join('\n')

        this.writeLine(asm)
    }

    public writeIf(label: string) {
        const asm = this.getTopValue().concat([
            `@${label}`,
            `D;JNE`
        ]).join("\n")

        this.writeLine(asm)
    }

    public writeFunction(functionName: string, nVars: number) {
        // Create function label
        this.writeLabel(functionName)

        // initialize local variables(n) to 0
        for (let i = 0; i < nVars; i++) {
           this.writePushPop(CommandType.C_PUSH, VM_SEGMENTS.local, 0)
        }
    }

    public writeCall(functionName: string, nArgs: number) {
        const asm = [
            `// call ${functionName} ${nArgs}`,
            // push returnAddress onto the stack
            '@RETURN_ADDRESS',
            'D=A',
            '@SP',
            'A=M',
            'M=D',
            '@SP',
            'M=M+1',
            // save LCL
            '@LCL',
            'D=M',
            '@SP',
            'A=M',
            'M=D',
            '@SP',
            'M=M+1',
            // save ARG
            '@ARG',
            'D=M',
            '@SP',
            'A=M',
            'M=D',
            '@SP',
            'M=M+1',
            // save THIS
            '@THIS',
            'D=M',
            '@SP',
            'A=M',
            'M=D',
            '@SP',
            'M=M+1',
            // save THAT
            '@THAT',
            'D=M',
            '@SP',
            'A=M',
            'M=D',
            '@SP',
            'M=M+1',
            // ARG = SP - 5 - nArgs
            '@SP',
            'D=M',
            '@5',
            'D=D-A',
            `@${nArgs}`,
            'D=D-A',
            '@ARG',
            'M=D',
            // LCL = SP
            '@SP',
            'D=M',
            '@LCL',
            'M=D',
            // goto functionName
            `@${functionName}`,
            '0;JMP',
            // inject returnAddress label
            '(RETURN_ADDRESS)',
        ].join('\n')

        this.writeLine(asm)
    }

    public writeReturn() {
        const asm = [
            '// return',
            // save LCL into local variable
            '@LCL',
            'D=M',
            '@frame',
            'M=D',
            // save return address in temp variable
            '@frame',
            'D=M',
            '@5',
            'A=D-A',
            'D=M',
            '@retAddr',
            'M=D',
            // reposition the return value of the caller - *ARG = pop()
        ].concat(this.getTopValue()).concat([
            // D includes the stack value
            '@ARG',
            'A=M',
            'M=D',
            // SP=ARG+1
            '@ARG',
            'D=M',
            '@1',
            'D=D+1',
            '@SP',
            'M=D',
            // THAT = *(frame - 1)
            '@frame',
            'D=M',
            '@1',
            'A=D-A',
            'D=M',
            '@THAT',
            'M=D',
            // THIS = *(frame - 2)
            '@frame',
            'D=M',
            '@2',
            'A=D-A',
            'D=M',
            '@THIS',
            'M=D',
            // ARG = *(frame - 3)
            '@frame',
            'D=M',
            '@3',
            'A=D-A',
            'D=M',
            '@ARG',
            'M=D',
            // LCL = *(frame - 4)
            '@frame',
            'D=M',
            '@4',
            'A=D-A',
            'D=M',
            '@LCL',
            'M=D',
            // goto retAddr
            '@retAddr',
            'A=M',
            '0;JMP'
        ]).join('\n')
        this.writeLine(asm)
    }

    // /

    writeLine(line: string) {
        writeFileSync(this.output, line + "\n", {flag: "a"});
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

    private getTopValue() {
        return [
            `@SP`,
            "AM=M-1",
            "D=M",
        ]
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
            `// pop pointer "${segment}"`,
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
            `// push pointer "${segment}"`,
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

    private log(log: string) {
        this.writeLine('// ' + log)
    }

    close() {
    }
}
