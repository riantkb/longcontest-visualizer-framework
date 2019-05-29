# Visualizer - Travelling Salesman Problem

## URL
https://riantkb.github.io/tsp-visualizer/

## input

```
N
x_0 y_0
x_1 y_1
 :
x_{N-1} y_{N-1}
```

- N >= 3
- x_i, y_i は実数


## output

```
p_1 p_2 ... p_N
```

- 空白区切り
- 0 <= p_i < N
- { p_1, p_2, ... , p_N } は順列


## tips
- 全然テストをしていないのでバグ報告大歓迎です．
- kmyk さんの [longcontest visualizer framework](https://github.com/kmyk/longcontest-visualizer-framework) を参考にさせていただきました．
