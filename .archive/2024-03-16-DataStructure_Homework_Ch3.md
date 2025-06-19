---
layout: post
title: Data Structure-Homework Chapter 3
date: 20240315
category: "Data Structure Homework"
tags: [Data Structure, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

> The article only includes programming part.
> 本章作业中的程序所要包含的头文件包括但不限于`iostream`、`queue`、`stack`、`string`、`cctype`、`new`。

## 10

试将下列递归过程改写为非递归过程：

```c++
void test (int &sum) {
    int x;
    cin >> x;
    if (x == 0) {
        sum = 0;
    }
    else {
        test(sum);
        sum += x;
    }

    std::cout << sum << std::endl;
}
```

### Solution

```c++
void test_without_recursion (int &sum) {
    int x;
    while (true) {
        std::cin >> x;
        if (x == 0)
            break;
        sum += x;
        std::cout << sum << std::endl;
    }
}
```

这个函数将读取输入的整数，直到读取到 0 为止，然后输出所有输入的整数的和。

## 19

假设一个算术表达式中可以包含三种括号：圆括号“（”和“）”、方括号“［”和“］“和花括号“{”和”｝”，且这三种括号可按任意的次序嵌套使用。编写判别给定表达式中所含括号是否正确配对出现的算法（已知表达式已存入数据元素为字符的顺序表中）

### Solution

首先，我们需要一个栈来存储括号。我们从左到右遍历表达式，每当我们遇到一个开括号，我们就把它压入栈中。每当我们遇到一个闭括号，我们就检查栈顶的开括号是否与之匹配。如果匹配，我们就弹出栈顶的开括号。如果不匹配，或者栈已经为空（这意味着闭括号没有对应的开括号），我们就返回`false`。如果我们遍历完整个表达式后栈仍然不为空（这意味着有一些开括号没有对应的闭括号），我们也返回`false`。否则，我们返回`true`。

```c++
// Function to check if the brackets are balanced
bool isValid(const std::string& s) {
    std::stack<char> stack;
    for (char c : s) {
        switch (c) {
            case '(':
            case '[':
            case '{':
                stack.push(c);
                break;
            case ')':
                if (stack.empty() || stack.top() != '(') return false;
                stack.pop();
                break;
            case ']':
                if (stack.empty() || stack.top() != '[') return false;
                stack.pop();
                break;
            case '}':
                if (stack.empty() || stack.top() != '{') return false;
                stack.pop();
                break;
            default:
                break;
        }
    }
    return stack.empty();
}
```

## 20

假设以二维数组 $g(1 \cdots m, 1 \cdots n)$ 表示一个图像区域，$g[i,j]$ 表示该区域中点$(i,j)$所具颜色，其值为 从 0 到 k 的整数。编写算法置换点$(i_0,j_0)$所在区域的颜色。约定和$(i_0,j_0)$同色的上、下、左、右的邻接点为同色区域的点。

### Solution

首先，我们需要创建一个队列来存储需要检查的点。然后，我们将开始点$(i0, j0)$添加到队列中。接下来，我们将执行以下步骤，直到队列为空：  

1. 从队列中取出一个点。
2. 检查该点的上、下、左、右四个邻接点。如果邻接点的颜色与开始点的颜色相同，并且我们还没有检查过这个点，那么我们就将这个点的颜色更改为新的颜色，并将这个点添加到队列中。
3. 这个过程将继续，直到队列为空，这意味着我们已经检查了所有与开始点相连的同色区域的点。

在这个代码中，我们首先定义了一个结构体`Point`来存储点的坐标。然后，我们定义了一个函数`isValid`来检查一个点是否在图像区域内。接着，我们定义了主要的函数`changeColor`来改变一个区域的颜色。在`main`函数中，我们创建了一个二维数组`g`来表示图像区域，并调用了`changeColor`函数来改变一个区域的颜色。

我们还可以创建一个函数来打印二维数组。这个函数将接收一个二维数组和它的尺寸作为参数。然后，我们可以在`changeColor`函数的前后调用这个函数，以打印改变前和改变后的二维数组：函数`printArray`。

```c++
// Structure to store the coordinates of a point
struct Point {
    int x, y;
};

// Function to check if a point is valid
bool isValid(int x, int y, int m, int n) {
    return (x >= 0 && x < m && y >= 0 && y < n);
}

// Function to print a 2D array
void printArray(int g[][10], int m, int n) {
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            std::cout << g[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

// Function to change the color of a region
void changeColor(int g[][10], int m, int n, int i0, int j0, int newColor) {
    // Print the array before changing color
    std::cout << "Before changing color:" << std::endl;
    printArray(g, m, n);

    const int dx[] = {-1, 1, 0, 0};
    const int dy[] = {0, 0, -1, 1};

    int oldColor = g[i0][j0];
    std::queue<Point> q;

    Point start = {i0, j0};
    q.push(start);
    g[i0][j0] = newColor;

    while (!q.empty()) {
        Point p = q.front();
        q.pop();

        for (int i = 0; i < 4; i++) {
            int newX = p.x + dx[i];
            int newY = p.y + dy[i];

            if (isValid(newX, newY, m, n) && g[newX][newY] == oldColor) {
                Point newPoint = {newX, newY};
                q.push(newPoint);
                g[newX][newY] = newColor;
            }
        }
    }

    // Print the array after changing color
    std::cout << std::endl << "After changing color:" << std::endl;
    printArray(g, m, n);
}
```

## 21

假设表达式有单字母变量和双目四则运算符构成。试写一个算法，将一个通常书写形式且书写正确的 表达式转换为逆波兰表达式。


### Solution

> 逆波兰表达式是一种不需要括号来标识运算符优先级的表达式。在逆波兰表达式中，运算符在它的操作数之后。例如，逆波兰表达式`3 4 +`表示的是`3 + 4`。

我们可以使用栈来解决这一问题。以下是算法的步骤：  

1. 创建一个空栈，用于存储运算符，创建一个空列表，用于存储输出的逆波兰表达式。
2. 从左到右扫描表达式。
3. 如果遇到操作数，将其添加到输出列表。
4. 如果遇到运算符，如'+'或'-'，则将其压入栈中。但是，首先需要从栈中弹出所有优先级更高或相等的运算符，并将它们添加到输出列表。
5. 如果遇到一个左括号'('，将其压入栈中。
6. 如果遇到一个右括号')'，则从栈中弹出运算符并将它们添加到输出列表，直到遇到左括号为止。然后将左括号弹出栈，但不添加到输出列表。
7. 如果输入的表达式已经处理完毕，但栈中仍然有运算符，那么将它们添加到输出列表。

```c++
// Return the precedence of the operator
int getPrecedence(char ch) {
    if (ch == '+' || ch == '-') {
        return 1;
    } else if (ch == '*' || ch == '/') {
        return 2;
    } else {
        return -1;
    }
}

// Convert infix expression to postfix expression
std::string infixToPostfix(const std::string &infix) {
    std::stack<char> s;
    std::string postfix;

    for (char ch : infix) {
        if (std::isalpha(ch)) {
            postfix += ch;
        } else if (ch == '(') {
            s.push(ch);
        } else if (ch == ')') {
            while (!s.empty() && s.top() != '(') {
                postfix += s.top();
                s.pop();
            }
            if (!s.empty()) {
                s.pop();
            }
        } else {
            while (!s.empty() && getPrecedence(s.top()) >= getPrecedence(ch)) {
                postfix += s.top();
                s.pop();
            }
            s.push(ch);
        }
    }

    while (!s.empty()) {
        postfix += s.top();
        s.pop();
    }

    return postfix;
}
```

## 28

假设以带头结点的循环链表表示队列，并且只设一个指针指向队尾元素结点(注意不设头指针)，试编写相应的队列初始化、入队列何处队列的算法。

### Solution

我们可以使用结构体来定义链表节点，并使用类来定义队列。

```c++
struct Node {
    int data;
    Node* next;
};

class Queue {
private:
    Node* rear; // Pointer to the rear of the queue
public:
    Queue();
    void enqueue(int data);
    int dequeue();
};
```

然后，我们实现队列的初始化、入队和出队操作：

```c++
// Initialize the queue
Queue::Queue() {
    rear = new Node;
    rear->next = rear; // Circular linked list
}

// Enqueue operation
void Queue::enqueue(int data) {
    Node* newNode = new Node;
    newNode->data = data;
    newNode->next = rear->next;
    rear->next = newNode;
    rear = newNode; // Refresh the rear pointer
}

// Dequeue operation
int Queue::dequeue() {
    if (rear->next == rear) {
        std::cout << "Queue is empty." << std::endl;
        return -1;
    }
    Node* frontNode = rear->next->next; // Front node
    int data = frontNode->data;
    if (frontNode == rear) { // If there is only one node in the queue
        rear->next = rear; // The rear pointer points to itself
        rear = rear->next; // Refresh the rear pointer
    } else {
        rear->next->next = frontNode->next; 
        // The next pointer of the rear node points to the next node of the front node
    }
    delete frontNode;
    return data;
}
```

这个类使用循环链表来实现队列。在循环链表中，队列的头指针和尾指针都指向同一个节点。这个节点是队列的最后一个节点。当队列为空时，头指针和尾指针都指向这个节点。当队列不为空时，头指针指向队列的第一个节点，而尾指针指向队列的最后一个节点。
