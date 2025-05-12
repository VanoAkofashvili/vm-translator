import path from "path";
import { Parser } from "./Parser";
import { CodeWriter } from "./CodeWriter";
import { CommandType } from "./constants";

const filename = process.argv[2];

if (!filename) {
  console.error("Filename not provided");
  process.exit(1);
}

const output = path.format({
  ext: ".asm",
  name: path.basename(filename, ".vm"),
  dir: path.dirname(filename),
});

const parser = new Parser(filename);
const codeWriter = new CodeWriter(output);

while (parser.hasMoreLines()) {
  parser.advance();
  switch (parser.commandType()) {
    case CommandType.C_POP:
    case CommandType.C_PUSH: {
      codeWriter.writePushPop(
        parser.commandType() as CommandType.C_POP | CommandType.C_PUSH,
        parser.arg1(),
        parser.arg2()
      );
      break;
    }
    case CommandType.C_ARITHMETIC: {
      codeWriter.writeArithmetic(parser.arg1());
      break;
    }
  }
}
codeWriter.endProgram();
