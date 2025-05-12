// push constant 10
@10
D=A
@SP
A=M
M=D
@SP
M=M+1
// push constant 20
@20
D=A
@SP
A=M
M=D
@SP
M=M+1
// lt
@SP
AM=M-1
D=M
@SP
AM=M-1
D=M-D
@LT_TRUE
D;JLT
D=0
@LT_END
0;JMP
(LT_TRUE)
D=-1
(LT_END)
