---
layout: post
title: Data Structure-Online Job 04
date: 20240515
category: "Data Structure OJ"
tags: [Data Structure, OJ, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

## 希尔排序

希尔排序是一种基于插入排序的算法，通过比较相距一定间隔的元素来工作，各趟比较所用的距离随着算法的进行而减小，直到只比较相邻元素的最后一趟排序为止。

### 代码实现

```cpp
void shellSort(int arr[], int n) {
    // Start with a big gap, then reduce the gap
    for (int gap = n/2; gap > 0; gap /= 2) {
        // Do a gapped insertion sort for this gap size.
        // The first gap elements a[0..gap-1] are already in gapped order
        // keep adding one more element until the entire array is gap sorted
        for (int i = gap; i < n; i += 1) {
            // add a[i] to the elements that have been gap sorted
            // save a[i] in temp and make a hole at position i
            int temp = arr[i];

            // shift earlier gap-sorted elements up until the correct location for a[i] is found
            int j;           
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap)
                arr[j] = arr[j - gap];
           
            // put temp (the original a[i]) in its correct location
            arr[j] = temp;
        }
    }
}
```

在这个函数中，我们首先定义一个间隔`gap`，然后在数组中进行间隔为`gap`的插入排序。每次迭代后，我们都会减小`gap`的值，直到`gap`为1，此时的排序就是普通的插入排序。

### 输出结果

```
Array before sorting: 
12 34 54 2 3 
Array after sorting: 
2 3 12 34 54 
Process finished with exit code 0
```

### 性能分析

希尔排序的时间复杂度和空间复杂度如下：

#### 时间复杂度

- 最好情况：如果原始数组已经基本有序，那么希尔排序的时间复杂度可以达到$O(n)$。
- 最坏情况：在最坏的情况下，希尔排序的时间复杂度为$O(n^2)$。
- 平均情况：平均情况下，希尔排序的时间复杂度为$O(n^1.3)$。

#### 空间复杂度

希尔排序是一种原地排序算法，不需要额外的存储空间，所以其空间复杂度为$O(1)$。

#### 性能

希尔排序的性能取决于`gap`序列的选择。对于不同的`gap`序列，希尔排序的时间复杂度不同。在实际应用中，希尔排序对于中等大小的数组还是非常有效的。尽管它的时间复杂度比$O(n \log n)$的排序算法（如快速排序、堆排序、归并排序）要差一些，但是由于其实现简单，因此在某些情况下还是被广泛使用。

## 快速排序

快速排序是一种常用的排序算法，其基本思想是通过一趟排序将待排记录分隔成独立的两部分，其中一部分记录的关键字均比另一部分的关键字小，然后分别对这两部分记录继续进行排序，以达到整个序列有序的目的。

### 代码实现

```cpp
void swap(int* a, int* b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int partition (int arr[], int low, int high) {
    int pivot = arr[high]; 
    int i = (low - 1); 

    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++; 
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
```

### 输出结果

```
Array before sorting: 
12 34 54 2 3 
Array after sorting: 
2 3 12 34 54 
Process finished with exit code 0
```

### 性能分析

快速排序是一种非常高效的排序算法，其性能分析如下：

#### 时间复杂度

- 最好情况：当数据正好可以每次都均匀分配，即每次选取的基准都能将数据分为两个长度相等的子序列时，快速排序的时间复杂度为$O(n \log n)$。
- 最坏情况：当数据已经是有序的（正序或者逆序），每次选取的基准只能将数据分为一个长度为n-1的子序列和一个长度为0的子序列，这样就形成了递归树最深的情况，此时的时间复杂度为$O(n^2)$。
- 平均情况：在平均情况下，快速排序的时间复杂度为$O(n \log n)$。

####  空间复杂度

快速排序是一种原地排序算法，不需要额外的存储空间，所以其空间复杂度为$O(1)$。但是由于快速排序是递归实现的，需要使用递归栈，所以实际的空间复杂度为$O( \log n)$，这里的n是递归的深度。

#### 性能

快速排序在实际应用中是非常高效的，因为其平均时间复杂度为$O(n \log n)$，并且是原地排序，不需要额外的存储空间。但是在最坏情况下，其时间复杂度会退化为$O(n^2)$，所以在实际应用中，为了避免这种情况，通常会采用一些策略来选择基准，比如随机选择、取中位数等。

## 二分查找

二分查找（Binary Search）是一种在有序数组中查找特定元素的搜索算法。搜索过程从数组的中间元素开始，如果中间元素正好是要查找的元素，则搜索过程结束；如果某一特定元素大于或者小于中间元素，则在数组大于或小于中间元素的那一半中查找，而且跟开始一样从中间元素开始比较。如果在某一步骤数组为空，则代表找不到。

### 代码实现

```cpp
int binarySearch(int arr[], int l, int r, int x) {
    if (r >= l) {
        int mid = l + (r - l) / 2;

        // If the element is present at the middle itself
        if (arr[mid] == x)
            return mid;

        // If element is smaller than mid, then it can only be present in left subarray
        if (arr[mid] > x)
            return binarySearch(arr, l, mid - 1, x);

        // Else the element can only be present in right subarray
        return binarySearch(arr, mid + 1, r, x);
    }

    // We reach here when the element is not present in array
    return -1;
}
```

在这个代码中，`binarySearch`函数接受一个数组，一个左索引，一个右索引和一个要查找的元素。如果元素在数组中，函数返回其索引，否则返回-1。

### 输出结果

```
The original array is: 2 3 4 10 40 
Enter the element you want to search: 
10
Element is present at index 4
Process finished with exit code 0
```

### 性能分析

二分查找算法的时间复杂度和空间复杂度如下：

#### 时间复杂度

二分查找每次都会将问题规模减半，因此其时间复杂度为$O(\log n)$，其中n为数组的长度。这是因为每次查找都会将搜索范围缩小一半，直到找到目标元素或者搜索范围为空。

#### 空间复杂度

在实现二分查找时，我们并没有使用额外的存储空间，因此空间复杂度为$O(1)$。但是，如果使用递归实现二分查找，那么空间复杂度就是$O( \log n)$，因为递归调用会在调用栈中占用空间。

#### 性能

二分查找是一种非常高效的搜索算法，特别是在处理大数据集时。但是，它有一个前提条件，那就是数据集必须是有序的。如果数据集是无序的，那么在进行二分查找之前，你可能需要先对数据集进行排序，这将增加额外的时间复杂度。此外，二分查找不适合用于链表等线性数据结构，因为这些数据结构不支持快速的随机访问。

## 构建二叉排序树及平衡二叉树

**（选做）** 在C++中，我们可以创建一个类来表示二叉排序树（Binary Search Tree，BST）和平衡二叉树（Balanced Binary Tree，通常是AVL树）。以下是创建这两种树的基本代码。

### 代码实现

#### 二叉排序树

```cpp
class Node {
public:
    int key;
    Node* left;
    Node* right;
};

// Function to create a new node
Node* newNode(int item) {
    Node* temp = new Node();
    temp->key = item;
    temp->left = temp->right = nullptr;
    return temp;
}

// Function to insert a new node with given key in BST
Node* insert(Node* node, int key) {
    // If the tree is empty, assign a new node address
    if (node == nullptr) return newNode(key);

    // Otherwise, recur down the tree
    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);

    // return the (unchanged) node pointer
    return node;
}
```

#### 平衡二叉树

```cpp
class AVLNode {
public:
    int key;
    AVLNode* left;
    AVLNode* right;
    int height;
};

// Function to create a new node
AVLNode* newAVLNode(int item) {
    AVLNode* temp = new AVLNode();
    temp->key = item;
    temp->left = temp->right = nullptr;
    temp->height = 1;  // new node is initially added at leaf
    return temp;
}

// Function to get the height of the tree
int height(AVLNode* N) {
    if (N == nullptr)
        return 0;
    return N->height;
}

// Function to get maximum of two integers
int max(int a, int b) {
    return (a > b) ? a : b;
}

// Function to right rotate subtree rooted with y
AVLNode* rightRotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;

    // Perform rotation
    x->right = y;
    y->left = T2;

    // Update heights
    y->height = max(height(y->left), height(y->right)) + 1;
    x->height = max(height(x->left), height(x->right)) + 1;

    // Return new root
    return x;
}

// Function to left rotate subtree rooted with x
AVLNode* leftRotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;

    // Perform rotation
    y->left = x;
    x->right = T2;

    // Update heights
    x->height = max(height(x->left), height(x->right)) + 1;
    y->height = max(height(y->left), height(y->right)) + 1;

    // Return new root
    return y;
}

// Function to get Balance factor of node N
int getBalance(AVLNode* N) {
    if (N == nullptr)
        return 0;
    return height(N->left) - height(N->right);
}

// Function to insert a node
AVLNode* insertAVL(AVLNode* node, int key) {
    // Perform the normal BST insertion
    if (node == nullptr)
        return (newAVLNode(key));

    if (key < node->key)
        node->left = insertAVL(node->left, key);
    else if (key > node->key)
        node->right = insertAVL(node->right, key);
    else  // Equal keys are not allowed in BST
        return node;

    // Update height of this ancestor node
    node->height = 1 + max(height(node->left), height(node->right));

    // Get the balance factor
    int balance = getBalance(node);

    // If this node becomes unbalanced, then there are 4 cases

    // Left Left Case
    if (balance > 1 && key < node->left->key)
        return rightRotate(node);

    // Right Right Case
    if (balance < -1 && key > node->right->key)
        return leftRotate(node);

    // Left Right Case
    if (balance > 1 && key > node->left->key) {
        node->left = leftRotate(node->left);
        return rightRotate(node);
    }

    // Right Left Case
    if (balance < -1 && key < node->right->key) {
        node->right = rightRotate(node->right);
        return leftRotate(node);
    }

    // return the (unchanged) node pointer
    return node;
}
```

### 输出结果

```
Binary Search Tree: 

                    80

          70

                    60

50

                    40

          30

                    20
AVL Tree: 

                    50

          40

30

                    25

          20

                    10

Process finished with exit code 0
```

### 性能分析

这两个算法（二叉搜索树和AVL树）的时间和空间复杂度分析如下：

#### 二叉搜索树（BST）

- 时间复杂度：在最好的情况下（即树完全平衡），插入、删除和查找操作的时间复杂度都是$O(\log n)$，其中n是树中节点的数量。然而，在最坏的情况下（即树完全不平衡，变成了一个链表），这些操作的时间复杂度都变成了$O(n)$。
- 空间复杂度：存储树需要$O(n)$的空间。

#### 平衡二叉树（AVL树）

- 时间复杂度：由于AVL树始终保持平衡，所以插入、删除和查找操作的时间复杂度都是$O(\log n)$，这是在所有情况下都保证的。
- 空间复杂度：存储树需要$O(n)$的空间。

#### 性能

性能方面，AVL树由于其平衡特性，对于查找密集型的操作会有更好的性能，因为它能保证最大的搜索深度（即时间复杂度）为$O(\log n)$。然而，如果插入和删除操作非常频繁，AVL树需要频繁调整来保持平衡，可能会有一些性能损失。

另一方面，对于二叉搜索树，如果数据插入的顺序恰好能保持树的平衡，那么它的性能可能会优于AVL树，因为它不需要进行额外的平衡操作。然而，如果数据插入的顺序导致树变得不平衡，那么它的性能可能会大大降低。

## 哈希表

**（选做）** 哈希表（Hash table，也叫散列表），是根据关键码值(Key value)而直接进行访问的数据结构。也就是说，它通过把关键码值映射到表中一个位置来访问记录，以加快查找的速度。这个映射函数叫做散列函数，存放记录的数组叫做散列表。

### 代码实现

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    // Create a hash table
    std::unordered_map<std::string, int> hashTable;

    // Insert elements
    hashTable["apple"] = 1;
    hashTable["banana"] = 2;
    hashTable["cherry"] = 3;

    // Access elements
    std::cout << "apple: " << hashTable["apple"] << std::endl;
    std::cout << "banana: " << hashTable["banana"] << std::endl;
    std::cout << "cherry: " << hashTable["cherry"] << std::endl;

    // Check if an element exists
    if (hashTable.find("apple") != hashTable.end()) {
        std::cout << "apple exists in the hash table" << std::endl;
    } else {
        std::cout << "apple does not exist in the hash table" << std::endl;
    }

    // Erase an element
    hashTable.erase("apple");

    // Check if an element exists
    if (hashTable.find("apple") != hashTable.end()) {
        std::cout << "apple exists in the hash table" << std::endl;
    } else {
        std::cout << "apple does not exist in the hash table" << std::endl;
    }

    return 0;
}
```

这个例子中，我使用了`std::unordered_map`，它是C++标准库中的一个哈希表实现。我们可以使用它来存储键值对，并且可以快速地根据键来查找值。

### 输出结果

```
apple: 1
banana: 2
cherry: 3
Now find an element that exists in the hash table...
apple exists in the hash table
Now delete an element...
Now find an element that does not exist in the hash table...
apple does not exist in the hash table

Process finished with exit code 0
```

### 性能分析

这个算法主要使用了C++的`unordered_map`，它是一个基于哈希表的数据结构。以下是对这个算法的时间、空间复杂度及性能的分析：

#### 时间复杂度

- 插入元素：平均情况下，哈希表的插入操作是$O(1)$。但在最坏的情况下，如果所有的元素都哈希到同一个位置，那么插入操作的时间复杂度会退化到$O(n)$。
- 访问元素：哈希表的访问操作平均时间复杂度也是$O(1)$。同样，在最坏的情况下，如果所有的元素都哈希到同一个位置，那么访问操作的时间复杂度会退化到$O(n)$。
- 删除元素：哈希表的删除操作平均时间复杂度是$O(1)$。在最坏的情况下，删除操作的时间复杂度会退化到$O(n)$。

#### 空间复杂度

哈希表的空间复杂度是$O(n)$，其中n是哈希表中元素的数量。

#### 性能

`unordered_map`是C++标准库中的哈希表实现，它的性能通常很好。在大多数情况下，插入、访问和删除操作的时间复杂度都是$O(1)$。但是，如果哈希函数的质量不好，导致很多元素哈希到同一个位置，那么哈希表的性能会大大降低。因此，选择一个好的哈希函数是提高哈希表性能的关键。
