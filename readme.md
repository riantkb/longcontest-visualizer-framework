# Visualizer - Travelling Salesman Problem

## input

```
N
x_0 y_0
x_1 y_1
 :
x_{N-1} y_{N-1}
```

- 入力は全て整数
- N >= 3
- -10^8 <= x_i, y_i <= 10^8 とか


## output

```
p_1 p_2 ... p_N
```

- 空白区切り（そのうち改行区切りにするかも）
- 0 <= p_i < N （そのうち 1 <= p_i <= N にするかも）
- { p_1, p_2, ... , p_N } は順列


## tips
- 全然テストをしていないのでバグ報告大歓迎です．
- kmyk さんの [longcontest visualizer framework](https://github.com/kmyk/longcontest-visualizer-framework) を参考にさせていただきました．
