type Ops = "+" | "-" | "&" | "|";

const OpMap: Record<string, Ops> = {
  add: "+",
  and: "&",
  or: "|",
  sub: "-",
};

export class ArithmeticCW {
  static translate(command: keyof typeof OpMap) {
    const operator = OpMap[command];

    switch (operator) {
      case "-":
        return ArithmeticCW.sub();
      default:
        return ArithmeticCW.binaryOp(operator);
    }
  }

  private static sub() {
    return ["@SP", "AM=M-1", "D=M", "@SP", "AM=M-1", `M=M-D`, "@SP", "M=M+1"];
  }

  private static binaryOp(op: "+" | "&" | "|") {
    return [
      "@SP",
      "AM=M-1",
      "D=M",
      "@SP",
      "AM=M-1",
      `M=D${op}M`,
      "@SP",
      "M=M+1",
    ];
  }
}
