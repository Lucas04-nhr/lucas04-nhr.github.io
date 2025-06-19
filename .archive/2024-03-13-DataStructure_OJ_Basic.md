---
layout: post
title: Data Structure-Online Job Basic
date: 20240313
category: "Data Structure OJ"
tags: [Data Structure, OJ, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

Some basic codes of linked list

> 注：本文档中的代码均为基于C++23标准的代码，因此在编译时需要加上`-std=c++23`参数。另外，由于C++17标准开始对于空指针有新的定义，故所有文档中的代码均使用`nullptr`代替`NULL`来表示空指针，而其他类型的空值仍然使用`NULL`。

## The library you must use

```c++
# include <cstdio>
# include <iostream>
# include <random>
```

## Define the structure of the node

```c++
typedef struct node {
    int data;
    node *next;
}node;

typedef node *LinkList;
```

## Create a single linked list with n nodes from bottom to top use random numbers

```c++
LinkList build_random_T(int n) {
    node *p, *head;
    int i;
    head = new(node);
    p = head;
    for( i = 1; i <= n; i ++) {
        p->next = new(node);
        std::random_device rd;  // Obtain a random number from hardware
        std::mt19937 eng(rd()); // Seed the generator
        std::uniform_int_distribution<> distr(0, 9); // Define the range
        p->next->data = distr(eng); // Generate random number
        p = p->next;
    }
    p->next = nullptr;	return(head);
}
```

## Create a single linked list with n nodes from top to bottom use random numbers

```c++
LinkList build_random_H(int n) {
    node *p;
    LinkList head;
    int i;
    head = new(node);
    head->next = nullptr;
    for( i = 1; i <= n; i ++) {
        p = new(node);
        std::random_device rd;  // Obtain a random number from hardware
        std::mt19937 eng(rd()); // Seed the generator
        std::uniform_int_distribution<> distr(0, 9); // Define the range
        p->data = distr(eng); // Generate random number
        p->next = head->next;
        head->next = p;
    }
    return(head);
}
```

## Display the linked list

```c++
void display(LinkList L) {
    node *p;
    p = L->next;
    while (p != nullptr) {
        std::cout << p->data << "  ";
        p = p->next;
    }
    std::cout << "\n";
}
```

## Create a single linked list with n nodes from bottom to top use the array provided

```c++
LinkList build_Ordered(int arr[], int n) {
    node *p, *head;
    head = new(node);
    p = head;
    for(int i = 0; i < n; i++) {
        p->next = new(node);
        p->next->data = arr[i];
        p = p->next;
    }
    p->next = nullptr;
    return head;
}
```

## Copy the linked list

```c++
LinkList copyList(LinkList L) {
    if (L == nullptr) {
        return nullptr;
    }

    LinkList newHead = new(node);
    node* current = L->next;
    node* newCurrent = newHead;

    while (current != nullptr) {
        newCurrent->next = new(node);
        newCurrent->next->data = current->data;
        current = current->next;
        newCurrent = newCurrent->next;
    }

    newCurrent->next = nullptr;
    return newHead;
}
```

## Test `main()` function

```c++
int main() {
    LinkList L1;
    L1 = build_random_H(7);
    display(L1);
}
```

## Example program to create a stack and vector to store the linked list

```c++
#include <iostream>
#include <stack>
#include <vector>

using namespace std;

int main() {
    stack<int> s; // Create a stack of integers
    vector<int> seq; // Create a vector of integers

    // Push some elements into the stack
    s.push(1);
    s.push(2);
    s.push(3);
    s.push(4);
    s.push(5);

    // Pop elements from the stack and push them into the vector
    while (!s.empty()) {
        seq.push_back(s.top());
        s.pop();
    }

    // Display the elements in the vector
    cout << "The elements in the vector: " << endl;
    for (int i = 0; i < seq.size(); ++i) {
        cout << seq[i] << " ";
    }
    cout << endl;

    return 0;
}
```

### Output

```bash
The elements in the vector:
5 4 3 2 1
```
