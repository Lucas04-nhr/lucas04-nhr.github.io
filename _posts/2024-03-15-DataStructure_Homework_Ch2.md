---
layout: post
title: Data Structure-Homework Chapter 2
date: 20240315
category: "Data Structure Homework"
tags: [Data Structure, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

> The article only includes programming part.

## 19

已知线性表中的元素以值递增有序排列，并以单链表作存储结构。试写一高效的算法，删除表中所有值大于 `min` 且小于 `max` 的元素(若表中存在这样的元素)，同时释放被删结点空间，并分析你的算法的时间复杂度(注意，`min` 和 `max` 是给定的两个参变量，它们的值可以和表中的元素相同，也可以不同)。

### Solution

```c++
// Delete all nodes in the LinkList L that has data between min and max
LinkList Delete_List (LinkList &L, int min, int max){
    LinkList p, q, prev = nullptr;
    if (min > max) {
        std::cout << "Invalid range" << std::endl;
        return L;
    }
    p = L;
    prev = p;
    p = p -> next;
    while (p) {
        if (p -> data >= min && p -> data <= max){
            prev -> next = p -> next;
            q = p;
            p = p -> next;
            delete q;
        }
        else{
            prev = p;
            p = p -> next;
        }
    }
    return L;
}
```

这个函数将删除链表 L 中所有在 `min` 和 `max` 之间（包括 `min` 和 `max`）的节点，然后返回修改后的链表。如果 `min` 大于 `max`，它将打印 "`Invalid range`" 并返回原始链表。

时间复杂度为 $O(n)$。

## 21

试写一算法，实现顺序表的就地逆置，即利用原表的存储空间将线性表 $ \left( a_1 , a_2 , \cdots , a_n \right) $ 逆置为 $ \left( a_n , a_{n-1} , \cdots , a_1 \right) $。

### Solution

```c++
// Reverse the sequence list L
void reverseList(LinkList &L) {
    if (L == nullptr || L->next == nullptr) {
        return;
    }

    node* prev = nullptr;
    node* current = L->next;
    node* next;

    while (current != nullptr) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }

    L->next = prev;
}
```

这个函数将逆置链表 L，时间复杂度为 $O(n)$。

同时，我们可以使用递归的方法来逆置链表：

```c++
// Reverse the sequence list L using recursion
void reverseList(LinkList &L) {
    if (L == nullptr || L->next == nullptr) {
        return;
    }

    node* head = L->next;
    node* newHead = reverseList(head);
    L->next = newHead;
}
```

这个算法的时间复杂度也是 $O(n)$。

需要注意的是，我们可以通过输出原始链表首元素的地址和逆置后链表尾元素的地址来验证逆置是否成功。

```c++
// Get the address of the first element
node* getFirstElementAddress(LinkList &L) {
    if (L == nullptr || L->next == nullptr) {
        return nullptr;
    }
    return L->next;
}

// Get the address of the last element
node* getLastElementAddress(LinkList &L) {
    if (L == nullptr || L->next == nullptr) {
        return nullptr;
    }

    node* current = L->next;
    while (current->next != nullptr) {
        current = current->next;
    }
    return current;
}
```

## 24

假设有两个按元素值递增有序排列的线性表 A 和 B，均以单链表作存储结构，请编写算法将 A 表和 B 表归并成一个按元素值递减有序(即非递增有序，允许表中含有值相同的元素)排列的线性表 C，并要求利用原表(即 A 表和 B 表)的结点空间构造 C 表。

### Solution

1. 初始化一个新的链表C。
2. 同时遍历链表A和B，每次从两个链表中取出较小的元素（如果存在）并将其添加到链表C的头部。这样可以保证链表C是递减有序的。
3. 如果一个链表遍历完但另一个链表还有剩余元素，将剩余元素也添加到链表C的头部。
4. 返回链表C。

```c++
// Merge two sorted lists A and B into a new list C
LinkList mergeAndReverse(LinkList &A, LinkList &B) {
    LinkList C = new(node);
    C->next = nullptr;

    node *p = A->next, *q = B->next, *temp;

    while (p != nullptr && q != nullptr) {
        if (p->data <= q->data) {
            A->next = p->next;
            p->next = C->next;
            C->next = p;
            p = A->next;
        } else {
            B->next = q->next;
            q->next = C->next;
            C->next = q;
            q = B->next;
        }
    }

    while (p != nullptr) {
        A->next = p->next;
        p->next = C->next;
        C->next = p;
        p = A->next;
    }

    while (q != nullptr) {
        B->next = q->next;
        q->next = C->next;
        C->next = q;
        q = B->next;
    }

    return C;
}
```

这个函数将返回一个新的链表C，时间复杂度为 $O(n)$。

## 29

已知 A，B 和 C 为三个递增有序的线性表，现要求对 A 表作如下操作:删去那些既在 B 表中出现又在 C 表中出现的元素。试对顺序表编写实现上述操作的算法，并分析你的算法的时间复杂度(**注意:题中没有特别指明同一表中的元素值各不相同**)。

### Solution

#### 单链表方法

1. 初始化一个新的链表D，用于存储最终的结果。
2. 遍历链表A，对于每一个元素，检查它是否在链表B和链表C中都出现。如果没有，将其添加到链表D的尾部。
3. 返回链表D。

```c++
// Check if the data exists in both B and C
bool isExist(LinkList &L, int data) {
    node* p = L->next;
    while (p != nullptr) {
        if (p->data == data) {
            return true;
        }
        p = p->next;
    }
    return false;
}

// Delete the elements in A that are also in B and C
LinkList removeDuplicates(LinkList &A, LinkList &B, LinkList &C) {
    LinkList D = new(node);
    D->next = nullptr;
    node* p = A->next;
    node* q = D;

    while (p != nullptr) {
        if (!isExist(B, p->data) || !isExist(C, p->data)) {
            q->next = new(node);
            q->next->data = p->data;
            q = q->next;
        }
        p = p->next;
    }

    q->next = nullptr;
    return D;
}
```

这个函数接受三个链表A、B和C作为参数，并返回一个新的链表D，该链表是A中那些既不在B中也不在C中的元素。  关于时间复杂度的分析，对于链表A中的每一个元素，我们都需要在链表B和链表C中进行查找，所以时间复杂度是$O(n^2)$，其中n是链表的长度。这是一个比较高的时间复杂度，如果链表的长度很大，这个算法可能会很慢。**如果链表B和C也是有序的，我们可以使用更高效的算法来进行查找，从而降低时间复杂度。**

```c++
// Check if the data exists in both B and C
bool isExistInBoth(LinkList &B, LinkList &C, int data) {
    node* p = B->next;
    node* q = C->next;

    while (p != nullptr && q != nullptr) {
        if (p->data == data && q->data == data) {
            return true;
        }
        if (p->data < data) {
            p = p->next;
        } else if (q->data < data) {
            q = q->next;
        } else {
            return false;
        }
    }
    return false;
}

// Delete the elements in A that are also in B and C
LinkList removeDuplicatesOptimized(LinkList &A, LinkList &B, LinkList &C) {
    LinkList D = new(node);
    D->next = nullptr;
    node* p = A->next;
    node* q = D;

    while (p != nullptr) {
        if (!isExistInBoth(B, C, p->data)) {
            q->next = new(node);
            q->next->data = p->data;
            q = q->next;
        }
        p = p->next;
    }

    q->next = nullptr;
    return D;
}
```

> 如果链表B和C也是有序的，我们可以使用两个指针同时遍历两个链表，这样可以在$O(n)$的时间复杂度内完成查找，其中n是链表的长度。这是因为对于有序链表，我们可以在遍历过程中直接比较两个链表当前节点的值，从而判断是否存在相同的元素。

#### 顺序表方法

> 需引用`vector`头文件。

```c++
// Delete the elements in A that are also in B and C
// Using vectors
bool isExist_vector(const std::vector<int>& vec, int data) {
    return std::find(vec.begin(), vec.end(), data) != vec.end();
}

std::vector<int> removeDuplicates_vector(std::vector<int>& A, std::vector<int>& B, std::vector<int>& C) {
    std::vector<int> D;

    for (int data : A) {
        if (!isExist_vector(B, data) || !isExist_vector(C, data)) {
            D.push_back(data);
        }
    }

    return D;
}
```

这个函数接受三个向量A、B和C作为参数，并返回一个新的向量D，该向量是A中那些既不在B中也不在C中的元素。  关于时间复杂度的分析，对于向量A中的每一个元素，我们都需要在向量B和向量C中进行查找，所以时间复杂度是$O(n^2)$，其中n是向量的长度。这是一个比较高的时间复杂度，如果向量的长度很大，这个算法可能会很慢。

如果向量B和C也是有序的，我们可以使用更高效的算法来进行查找，从而降低时间复杂度。

```c++
// Delete the elements in A that are also in B and C
// Using vectors
bool isExistInBoth_vector(const std::vector<int>& B, const std::vector<int>& C, int data) {
    int i = 0, j = 0;
    while (i < B.size() && j < C.size()) {
        if (B[i] == data && C[j] == data) {
            return true;
        }
        if (B[i] < data) {
            i++;
        } else if (C[j] < data) {
            j++;
        } else {
            return false;
        }
    }
    return false;
}

std::vector<int> removeDuplicatesOptimized_vector(std::vector<int>& A, std::vector<int>& B, std::vector<int>& C) {
    std::vector<int> D;

    for (int data : A) {
        if (!isExistInBoth_vector(B, C, data)) {
            D.push_back(data);
        }
    }

    return D;
}
```

## 30

要求同 29 题。试对单链表编写算法，请释放 A 表中的无用结点空间。

### Solution

我们可以通过遍历链表并使用`delete`操作符来释放每个节点的空间。

```c++
// Free the nodes which is useless in A
void freeList(LinkList &L) {
    node* current = L;
    node* next;

    while (current != nullptr) {
        next = current->next;
        delete current;
        current = next;
    }

    L = nullptr;
}
```
