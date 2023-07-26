Script for printing stack trace from simulate response. Truncated TEAL lines end with `...`
```
TEAL                           | PC   | STACK
-------------------------------|------|-------
#pragma version 8              | 1    | []
txn ApplicationID      // o... | 4    | [1005]
bz end                         | 6    | []
txn NumAppArgs                 | 9    | [1]
int 1                          | 11   | [1,1]
==                             | 12   | [1]
assert                         | 13   | []
txn ApplicationArgs 0          | 14   | [0x000000000000000a]
btoi                           | 17   | [10]
callsub subroutine_manipula... | 18   | [10]
proto 1 1                      | 26   | [10]
int 0                      ... | 29   | [10,0]
dup                        ... | 31   | [10,0,0]
dupn 4                     ... | 32   | [10,0,0,0,0,0,0]
frame_dig -1               ... | 34   | [10,0,0,0,0,0,0,10]
frame_bury 0               ... | 36   | [10,10,0,0,0,0,0]
dig 5                      ... | 38   | [10,10,0,0,0,0,0,10]
cover 5                    ... | 40   | [10,10,10,0,0,0,0,0]
frame_dig 0                ... | 42   | [10,10,10,0,0,0,0,0,10]
frame_dig 1                ... | 44   | [10,10,10,0,0,0,0,0,10,10]
+                          ... | 46   | [10,10,10,0,0,0,0,0,20]
bury 7                     ... | 47   | [10,20,10,0,0,0,0,0]
popn 5                     ... | 49   | [10,20,10]
uncover 1                  ... | 51   | [10,10,20]
swap                       ... | 53   | [10,20,10]
+                          ... | 54   | [10,30]
pushbytess "1!" "5!"       ... | 55   | [10,30,0x3121,0x3521]
pushints 0 2 1 1 5 18446744... | 63   | [10,30,0x3121,0x3521,0,2,1,1,5,18446744073709552000]
store 1                    ... | 80   | [10,30,0x3121,0x3521,0,2,1,1,5]
load 1                     ... | 82   | [10,30,0x3121,0x3521,0,2,1,1,5,18446744073709552000]
stores                     ... | 84   | [10,30,0x3121,0x3521,0,2,1,1]
load 1                     ... | 85   | [10,30,0x3121,0x3521,0,2,1,1,18446744073709552000]
store 1                    ... | 87   | [10,30,0x3121,0x3521,0,2,1,1]
retsub                         | 89   | [30]
itob                           | 21   | [0x000000000000001e]
log                            | 22   | []
b end                          | 23   | []
int 1                          | 90   | [1]
return                         | 91   | [1]
```