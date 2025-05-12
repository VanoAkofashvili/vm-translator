export type CompCommand = "eq" | "gt" | "lt";

export class ComparisonCW {
  private static compIndex = 0;

  static translate(command: CompCommand): string[] {
    const index = this.compIndex++;
    const jump = {
      eq: "JEQ",
      gt: "JGT",
      lt: "JLT",
    }[command];

    const labelTrue = `${command.toUpperCase()}_TRUE_${index}`;
    const labelEnd = `${command.toUpperCase()}_END_${index}`;

    return [
      "@SP",
      "AM=M-1", // y
      "D=M",
      "@SP",
      "AM=M-1", // x
      "D=M-D",
      `@${labelTrue}`,
      `D;${jump}`, // if x ? y
      "D=0", // false (0)
      `@${labelEnd}`,
      "0;JMP",
      `(${labelTrue})`,
      "D=-1", // true (-1)
      `(${labelEnd})`,
      "@SP",
      "A=M",
      "M=D",
      "@SP",
      "M=M+1",
    ];
  }
}
