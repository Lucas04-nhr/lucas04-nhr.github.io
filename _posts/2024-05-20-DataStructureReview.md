---
layout: post
title: Data Structure-Reeview
date: 20240520
category: "Data Structure Review"
tags: [Data Structure, Review]
author: Lucas
comment: true
mathjax: true
published: true
---

## 二叉树的遍历

二叉树的遍历是指按照一定的顺序访问树中的每一个节点。常见的遍历方法有前序遍历、中序遍历和后序遍历。下面是这些遍历方法的定义和示例：

### 前序遍历（Preorder Traversal）

前序遍历的顺序是：根节点 -> 左子树 -> 右子树。

伪代码：

```
Preorder(node):
    if node is not None:
        visit(node)
        Preorder(node.left)
        Preorder(node.right)
```

### 中序遍历（Inorder Traversal）

中序遍历的顺序是：左子树 -> 根节点 -> 右子树。

伪代码：

```
Inorder(node):
    if node is not None:
        Inorder(node.left)
        visit(node)
        Inorder(node.right)
```

### 后序遍历（Postorder Traversal）

后序遍历的顺序是：左子树 -> 右子树 -> 根节点。

伪代码：

```
Postorder(node):
    if node is not None:
        Postorder(node.left)
        Postorder(node.right)
        visit(node)
```

## 求二叉树深度

二叉树的深度是指从根节点到叶子节点的最长路径的节点数。下面是求二叉树深度的伪代码：

```
MaxDepth(node):
    if node is None:
        return 0
    else:
        leftDepth = MaxDepth(node.left)
        rightDepth = MaxDepth(node.right)
        return max(leftDepth, rightDepth) + 1
```

## 统计叶子节点个数

叶子节点是指没有子节点的节点。下面是统计叶子节点个数的伪代码：

```
CountLeaf(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return CountLeaf(node.left) + CountLeaf(node.right)
```

## 求第`k`层节点个数

求第`k`层节点个数的伪代码：

```
CountKthLevel(node, k):
    if node is None or k < 1:
        return 0
    if k == 1:
        return 1
    return CountKthLevel(node.left, k - 1) + CountKthLevel(node.right, k - 1)
```

## 遍历确定二叉树

给定遍历结果，可以确定唯一的二叉树。而其中又有两种方式。

### 前序+中序

前序遍历的第一个节点是根节点，然后在中序遍历中找到根节点，根节点左边的是左子树，右边的是右子树。然后递归的构建左子树和右子树。

这种方法的伪代码如下：

```
BuildTree(preorder, inorder):
    if preorder is None or inorder is None:
        return None
    root = preorder[0]
    node = new Node(root)
    index = inorder.indexOf(root)
    node.left = BuildTree(preorder[1:index+1], inorder[0:index])
    node.right = BuildTree(preorder[index+1:], inorder[index+1:])
    return node
```

### 后序+中序

后序遍历的最后一个节点是根节点，然后在中序遍历中找到根节点，根节点左边的是左子树，右边的是右子树。然后递归的构建左子树和右子树。

这种方法的伪代码如下：

```
BuildTree(postorder, inorder):
    if postorder is None or inorder is None:
        return None
    root = postorder[-1]
    node = new Node(root)
    index = inorder.indexOf(root)
    node.left = BuildTree(postorder[0:index], inorder[0:index])
    node.right = BuildTree(postorder[index:-1], inorder[index+1:])
    return node
```

## 线索二叉树

线索二叉树是为了解决二叉树遍历时需要使用递归的问题。线索二叉树是在二叉树的基础上，增加了指向前驱节点和后继节点的指针。这样可以在不使用递归的情况下，实现二叉树的遍历。

线索二叉树的遍历分为前序线索化、中序线索化和后序线索化。

### 前序线索化

前序线索化的伪代码如下：

```
PreorderThread(node):
    if node is not None:
        if node.left is None:
            node.left = pre
            node.leftType = Thread
        if pre is not None and pre.right is None:
            pre.right = node
            pre.rightType = Thread
        pre = node
        if node.leftType == Link:
            PreorderThread(node.left)
        if node.rightType == Link:
            PreorderThread(node.right)
```

### 中序线索化

中序线索化的伪代码如下：

```
InorderThread(node):
    if node is not None:
        InorderThread(node.left)
        if node.left is None:
            node.left = pre
            node.leftType = Thread
        if pre is not None and pre.right is None:
            pre.right = node
            pre.rightType = Thread
        pre = node
        InorderThread(node.right)
```

### 后序线索化

后序线索化的伪代码如下：

```
PostorderThread(node):
    if node is not None:
        PostorderThread(node.left)
        PostorderThread(node.right)
        if node.left is None:
            node.left = pre
            node.leftType = Thread
        if pre is not None and pre.right is None:
            pre.right = node
            pre.rightType = Thread
        pre = node
```

## 哈夫曼树

哈夫曼树是一种带权路径长度最短的二叉树。哈夫曼树的构建过程是：首先将所有节点按照权值从小到大排序，然后选择权值最小的两个节点构建一个新的节点，新节点的权值为这两个节点的权值之和，然后将新节点插入到原节点中，重复这个过程，直到只剩下一个节点。

### 构建

哈夫曼树的构建伪代码如下：

```
HuffmanTree(weight):
    nodes = []
    for w in weight:
        nodes.append(new Node(w))
    while nodes.length > 1:
        nodes.sort()
        left = nodes.pop(0)
        right = nodes.pop(0)
        parent = new Node(left.weight + right.weight)
        parent.left = left
        parent.right = right
        nodes.append(parent)
    return nodes[0]
```

### 编码

哈夫曼树的编码是指将字符转换为二进制编码。编码的过程是：从根节点开始，左子树为0，右子树为1，遍历到叶子节点时，将路径上的编码保存下来。

编码哈夫曼树的伪代码如下：

```
EncodeHuffmanTree(root, code, result):
    if root is not None:
        if root.left is None and root.right is None:
            result[root.data] = code
        EncodeHuffmanTree(root.left, code + '0', result)
        EncodeHuffmanTree(root.right, code + '1', result)
```

### 解码

哈夫曼树的解码是指将二进制编码转换为字符。解码的过程是：从根节点开始，遍历二进制编码，遇到0就向左子树走，遇到1就向右子树走，直到遍历到叶子节点，输出对应的字符。

解码哈夫曼树的伪代码如下：

```
DecodeHuffmanTree(root, code):
    node = root
    result = ""
    for c in code:
        if c == '0':
            node = node.left
        else:
            node = node.right
        if node.left is None and node.right is None:
            result += node.data
            node = root
    return result
```

## 遍历

遍历的方法有深度优先遍历和广度优先遍历。

### 广度优先遍历（Breadth First Search）

广度优先遍历是从根节点开始，按照层次的顺序遍历树的节点。广度优先遍历使用队列来实现。

广度优先遍历的伪代码如下：

```
BFS(root):
    queue = []
    queue.push(root)
    while queue is not empty:
        node = queue.pop()
        visit(node)
        if node.left is not None:
            queue.push(node.left)
        if node.right is not None:
            queue.push(node.right)
```

### 深度优先遍历（Depth First Search）

深度优先遍历是从根节点开始，按照深度的顺序遍历树的节点。深度优先遍历使用递归来实现。

深度优先遍历的伪代码如下：

```
DFS(root):
    if root is not None:
        visit(root)
        DFS(root.left)
        DFS(root.right)
```

## 最小生成树

最小生成树是一个无向图的生成树，它包含图中所有顶点，但是只包含图中的一部分边，使得这些边的权值之和最小。最小生成树的算法有普里姆算法和克鲁斯卡尔算法。

### 普里姆算法

普里姆算法是一种贪心算法，它从一个顶点开始，逐步扩展生成树，直到包含所有顶点。普里姆算法的伪代码如下：

```
Prim(graph):
    n = graph.vertices.length
    visited = new Array(n)
    for i = 0 to n:
        visited[i] = false
    visited[0] = true
    edges = []
    while edges.length < n - 1:
        minEdge = null
        for i = 0 to n:
            if visited[i]:
                for j = 0 to n:
                    if !visited[j] and graph.edges[i][j] < minEdge:
                        minEdge = graph.edges[i][j]
                        from = i
                        to = j
        edges.push(minEdge)
        visited[to] = true
    return edges
```

### 克鲁斯卡尔算法

克鲁斯卡尔算法是一种贪心算法，它从所有边中选择权值最小的边，然后逐步扩展生成树，直到包含所有顶点。克鲁斯卡尔算法的伪代码如下：

```
Kruskal(graph):
    n = graph.vertices.length
    edges = []
    for i = 0 to n:
        for j = 0 to n:
            if graph.edges[i][j] != 0:
                edges.push({from: i, to: j, weight: graph.edges[i][j]})
    edges.sort()
    parent = new Array(n)
    for i = 0 to n:
        parent[i] = i
    result = []
    for edge in edges:
        if Find(parent, edge.from) != Find(parent, edge.to):
            result.push(edge)
            Union(parent, edge.from, edge.to)
    return result
```

## 排序

排序是一种将一组数据按照一定的顺序排列的操作。常见的排序算法有冒泡排序、选择排序、插入排序、希尔排序、归并排序、快速排序、堆排序、计数排序、桶排序和基数排序。

### 冒泡排序

冒泡排序是一种简单的排序算法，它重复地遍历要排序的列表，一次比较两个元素，如果它们的顺序错误就交换它们的位置。冒泡排序的伪代码如下：

```
BubbleSort(array):
    n = array.length
    for i = 0 to n:
        for j = 0 to n - i - 1:
            if array[j] > array[j + 1]:
                swap(array[j], array[j + 1])
```

### 选择排序

选择排序是一种简单的排序算法，它重复地从未排序的部分中选择最小的元素，然后将其放到已排序的部分的末尾。选择排序的伪代码如下：

```
SelectionSort(array):
    n = array.length
    for i = 0 to n:
        minIndex = i
        for j = i + 1 to n:
            if array[j] < array[minIndex]:
                minIndex = j
        swap(array[i], array[minIndex])
```

### 插入排序

插入排序是一种简单的排序算法，它将未排序的元素插入到已排序的部分中，使得已排序的部分仍然有序。插入排序的伪代码如下：

```
InsertionSort(array):
    n = array.length
    for i = 1 to n:
        key = array[i]
        j = i - 1
        while j >= 0 and array[j] > key:
            array[j + 1] = array[j]
            j = j - 1
        array[j + 1] = key
```

### 希尔排序

希尔排序是一种改进的插入排序算法，它将数组分成若干个子数组，然后对每个子数组进行插入排序，最后对整个数组进行插入排序。希尔排序的伪代码如下：

```
ShellSort(array):
    n = array.length
    gap = n / 2
    while gap > 0:
        for i = gap to n:
            key = array[i]
            j = i
            while j >= gap and array[j - gap] > key:
                array[j] = array[j - gap]
                j = j - gap
            array[j] = key
        gap = gap / 2
```

### 快速排序

快速排序是一种分治算法，它选择一个基准元素，然后将数组分成两个子数组，使得左子数组的元素都小于基准元素，右子数组的元素都大于基准元素，然后对每个子数组进行快速排序。快速排序的伪代码如下：

```
QuickSort(array, low, high):
    if low < high:
        pivot = Partition(array, low, high)
        QuickSort(array, low, pivot - 1)
        QuickSort(array, pivot + 1, high)

Partition(array, low, high):
    pivot = array[high]
    i = low - 1
    for j = low to high - 1:
        if array[j] < pivot:
            i = i + 1
            swap(array[i], array[j])
    swap(array[i + 1], array[high])
    return i + 1
```

### 堆排序

堆排序是一种选择排序算法，它使用堆数据结构来实现。堆排序的伪代码如下：

```
HeapSort(array):
    n = array.length
    for i = n / 2 - 1 to 0:
        Heapify(array, n, i)
    for i = n - 1 to 0:
        swap(array[0], array[i])
        Heapify(array, i, 0)

Heapify(array, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2
    if left < n and array[left] > array[largest]:
        largest = left
    if right < n and array[right] > array[largest]:
        largest = right
    if largest != i:
        swap(array[i], array[largest])
        Heapify(array, n, largest)
```

### 拓扑排序

拓扑排序是一种对有向无环图进行排序的算法。拓扑排序的伪代码如下：

```
TopologicalSort(graph):
    n = graph.vertices.length
    visited = new Array(n)
    for i = 0 to n:
        visited[i] = false
    stack = []
    for i = 0 to n:
        if !visited[i]:
            TopologicalSortUtil(graph, i, visited, stack)
    return stack

TopologicalSortUtil(graph, v, visited, stack):
    visited[v] = true
    for u in graph.adj[v]:
        if !visited[u]:
            TopologicalSortUtil(graph, u, visited, stack)
    stack.push(v)
```

## 二叉排序树

二叉排序树是一种特殊的二叉树，它满足以下性质：

1. 左子树上所有节点的值均小于根节点的值。
2. 右子树上所有节点的值均大于根节点的值。
3. 左右子树也分别为二叉排序树。

二叉排序树的插入操作是将新节点插入到二叉排序树中的适当位置，使得插入后的树仍然是二叉排序树。二叉排序树的删除操作是删除指定节点，并保持二叉排序树的性质。

二叉排序树的查找操作是在二叉排序树中查找指定值的节点。二叉排序树的查找操作可以使用递归或迭代的方式实现。

### 插入

二叉排序树的插入操作的伪代码如下：

```
Insert(root, key):
    if root is None:
        return new Node(key)
    if key < root.key:
        root.left = Insert(root.left, key)
    else if key > root.key:
        root.right = Insert(root.right, key)
    return root
```

### 删除

二叉排序树的删除操作的伪代码如下：

```
Delete(root, key):
    if root is None:
        return root
    if key < root.key:
        root.left = Delete(root.left, key)
    else if key > root.key:
        root.right = Delete(root.right, key)
    else:
        if root.left is None:
            return root.right
        else if root.right is None:
            return root.left
        root.key = MinValue(root.right)
        root.right = Delete(root.right, root.key)
    return root
```

### 查找

二叉排序树的查找操作的伪代码如下：

```
Search(root, key):
    if root is None or root.key == key:
        return root
    if key < root.key:
        return Search(root.left, key)
    return Search(root.right, key)
```

## 平衡二叉树

平衡二叉树是一种特殊的二叉树，它满足以下性质：

1. 左子树和右子树的高度差不超过1。
2. 左右子树也分别为平衡二叉树。

平衡二叉树的插入操作是将新节点插入到平衡二叉树中的适当位置，使得插入后的树仍然是平衡二叉树。平衡二叉树的删除操作是删除指定节点，并保持平衡二叉树的性质。

平衡二叉树的查找操作是在平衡二叉树中查找指定值的节点。平衡二叉树的查找操作可以使用递归或迭代的方式实现。

### 插入

平衡二叉树的插入操作的伪代码如下：

```
Insert(root, key):
    if root is None:
        return new Node(key)
    if key < root.key:
        root.left = Insert(root.left, key)
    else if key > root.key:
        root.right = Insert(root.right, key)
    root.height = 1 + max(Height(root.left), Height(root.right))
    balance = Balance(root)
    if balance > 1 and key < root.left.key:
        return RightRotate(root)
    if balance < -1 and key > root.right.key:
        return LeftRotate(root)
    if balance > 1 and key > root.left.key:
        root.left = LeftRotate(root.left)
        return RightRotate(root)
    if balance < -1 and key < root.right.key:
        root.right = RightRotate(root.right)
        return LeftRotate(root)
    return root
```

### 删除

平衡二叉树的删除操作的伪代码如下：

```
Delete(root, key):
    if root is None:
        return root
    if key < root.key:
        root.left = Delete(root.left, key)
    else if key > root.key:
        root.right = Delete(root.right, key)
    else:
        if root.left is None or root.right is None:
            temp = root.left if root.left is not None else root.right
            if temp is None:
                temp = root
                root = None
            else:
                root = temp
        else:
            temp = MinValueNode(root.right)
            root.key = temp.key
            root.right = Delete(root.right, temp.key)
    if root is None:
        return root
    root.height = 1 + max(Height(root.left), Height(root.right))
    balance = Balance(root)
    if balance > 1 and Balance(root.left) >= 0:
        return RightRotate(root)
    if balance < -1 and Balance(root.right) <= 0:
        return LeftRotate(root)
    if balance > 1 and Balance(root.left) < 0:
        root.left = LeftRotate(root.left)
        return RightRotate(root)
    if balance < -1 and Balance(root.right) > 0:
        root.right = RightRotate(root.right)
        return LeftRotate(root)
    return root
```

### 查找

平衡二叉树的查找操作的伪代码如下：

```
Search(root, key):
    if root is None or root.key == key:
        return root
    if key < root.key:
        return Search(root.left, key)
    return Search(root.right, key)
```

## 哈希

哈希是一种将任意长度的输入数据转换为固定长度的输出数据的方法。哈希函数是将输入数据映射到哈希值的函数。哈希表是一种数据结构，它使用哈希函数将键映射到值。

### 插入

哈希表的插入操作的伪代码如下：

```
Insert(hashTable, key, value):
    index = HashFunction(key)
    while hashTable[index] is not None:
        index = (index + 1) % size
    hashTable[index] = {key: key, value: value}
```

### 删除

哈希表的删除操作的伪代码如下：

```
Delete(hashTable, key):
    index = HashFunction(key)
    while hashTable[index] is not None:
        if hashTable[index].key == key:
            hashTable[index] = None
            return
        index = (index + 1) % size
```

### 查找

哈希表的查找操作的伪代码如下：

```
Search(hashTable, key):
    index = HashFunction(key)
    while hashTable[index] is not None:
        if hashTable[index].key == key:
            return hashTable[index].value
        index = (index + 1) % size
    return None
```

### 删除

哈希表的删除操作的伪代码如下：

```
Delete(hashTable, key):
    index = HashFunction(key)
    while hashTable[index] is not None:
        if hashTable[index].key == key:
            hashTable[index] = None
            return
        index = (index + 1) % size
```
