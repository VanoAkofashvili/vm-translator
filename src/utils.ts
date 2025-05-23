import fs from "fs";
import path from "path";

const isDirectory = (path:string) => {
    return fs.lstatSync(path).isDirectory()
}

const getVmFiles = (dirPath:string) => {
   return fs.readdirSync(dirPath)
       .filter(file => file.endsWith('.vm'))
       .map(file => path.join(dirPath, file))
}

const getOutputPath = (inputVmFile: string) => {
    // Generate output filename
    const outputFilename = path.basename(inputVmFile, ".vm");

    // Generate the path
    const outputPath = path.format({
        ext: ".asm",
        name: outputFilename,
        dir: path.dirname(inputVmFile),
    })

    return {
        outputFilename,
        path: outputPath
    }
}


export {
    isDirectory,
    getVmFiles,
    getOutputPath
}
