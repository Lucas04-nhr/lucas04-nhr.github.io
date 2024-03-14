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

## Some basic codes of linked list

### The library you must use

```c++
# include<cstdio>
# include<iostream>
# include<random>
```

### Define the structure of the node

```c++
typedef struct node {
    int data;
    node *next;
}node;

typedef node *LinkList;
```

### Create a single linked list with n nodes from bottom to top use random numbers

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

### Create a single linked list with n nodes from top to bottom use random numbers

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

### Display the linked list

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

### Create a single linked list with n nodes from bottom to top use the array provided

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

### Copy the linked list

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

### Test `main()` function

```c++
int main() {
    LinkList L1;
    L1 = build_random_H(7);
    display(L1);
}
```
