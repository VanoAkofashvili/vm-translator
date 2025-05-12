export enum CommandType {
  C_ARITHMETIC = "C_ARITHMETIC",
  C_PUSH = "C_PUSH",
  C_POP = "C_POP",
  C_LABEL = "C_LABEL",
  C_GOTO = "C_GOTO",
  C_IF = "C_IF",
  C_FUNCTION = "C_FUNCTION",
  C_RETURN = "C_RETURN",
  C_CALL = "C_CALL",
}

export enum VM_SEGMENTS {
  argument = "argument",
  local = "local",
  static = "static",
  constant = "constant",
  this = "this",
  that = "that",
  pointer = "pointer",
  temp = "temp",
}
export enum RAM_SEGMENTS {
  local = "LCL",
  argument = "ARG",
  this = "THIS",
  that = "THAT",
  temp = "TEMP",
}
