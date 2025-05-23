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
    // Generate the path
    return path.format({
        ext: ".asm",
        name: path.basename(inputVmFile, ".vm"),
        dir: path.dirname(inputVmFile),
    })

}


export {
    isDirectory,
    getVmFiles,
    getOutputPath
}
