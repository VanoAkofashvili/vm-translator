import {CodeWriter} from "./CodeWriter";
import {CommandType} from "./constants";
import {Parser} from "./Parser";
import {getOutputPath, getVmFiles, isDirectory} from "./utils";

const filename = process.argv[2];

if (!filename) {
    console.error("Filename not provided");
    process.exit(1);
}


if (isDirectory(filename)) {
    const vmFilePaths = getVmFiles(filename)

    const outputPath = getOutputPath(filename)

    const codeWriter = new CodeWriter(outputPath)

    vmFilePaths.forEach(filePath => {
        const parser = new Parser(filePath)
        codeWriter.setFileName(filePath)
        translateSingleVmFile({
            parser,
            codeWriter
        })
    })

} else {
    const outputPath = getOutputPath(filename)
    const parser = new Parser(filename)
    const codeWriter = new CodeWriter(outputPath )
    translateSingleVmFile({
        parser,
        codeWriter
    })
}


function translateSingleVmFile(
    {
        parser,
        codeWriter
    }: {
        parser: Parser
        codeWriter: CodeWriter
    }
) {


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
            case CommandType.C_LABEL: {
                codeWriter.writeLabel(parser.arg1());
                break;
            }
            case CommandType.C_IF: {
                codeWriter.writeIf(parser.arg1());
                break;
            }
        }
    }

    // TODO: this should not be here
    // End program with an infinite loop
    codeWriter.endProgram();
}



