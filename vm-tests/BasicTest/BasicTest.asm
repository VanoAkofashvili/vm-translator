// push constant 10
@10
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop LCL 0
@0
D=A
@LCL
D=M+D
@R13
M=D
@SP
AM=M-1
D=M
@R13
A=M
M=D
(END)
@END
0;JMP
