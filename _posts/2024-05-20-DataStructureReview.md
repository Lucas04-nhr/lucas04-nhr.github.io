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

### 示例二叉树
假设我们有如下二叉树结构：

```
      A
     /
    B
   / 
  C   
 / \
D   E
     \
      F
       \
        G
```

#### 前序遍历

按照前序遍历的顺序，我们得到的结果是：

```
A -> B -> C -> D -> E -> F -> G
```

#### 中序遍历

按照中序遍历的顺序，我们得到的结果是：

```
D -> C -> B -> E -> F -> G -> A
```

#### 后序遍历
按照后序遍历的顺序，我们得到的结果是：

```
D -> C -> E -> F -> G -> B -> A
```

通过这些遍历方法，我们可以以不同的顺序访问二叉树中的每一个节点，以满足不同的应用需求。

#### 二叉树的遍历实现

利用C++实现二叉树的遍历：

```cpp
# include <iostream>

class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

class BinaryTree {
public:
    TreeNode* createNode(int val) {
        TreeNode* newNode = new TreeNode(val);
        return newNode;
    }

    void preOrder(TreeNode* node) {
        if (node == NULL) {
            return;
        }
        std::cout << node->val << " ";
        preOrder(node->left);
        preOrder(node->right);
    }

    void inOrder(TreeNode* node) {
        if (node == NULL) {
            return;
        }
        inOrder(node->left);
        std::cout << node->val << " ";
        inOrder(node->right);
    }

    void postOrder(TreeNode* node) {
        if (node == NULL) {
            return;
        }
        postOrder(node->left);
        postOrder(node->right);
        std::cout << node->val << " ";
    }
};

int main() {
    BinaryTree bt;
    TreeNode* root = bt.createNode(1);
    root->left = bt.createNode(2);
    root->right = bt.createNode(3);
    root->left->left = bt.createNode(4);
    root->left->right = bt.createNode(5);
    root->right->left = bt.createNode(6);
    root->right->right = bt.createNode(7);
    root->left->left->left = bt.createNode(8);
    root->left->left->right = bt.createNode(9);

    std::cout << "The binary tree is:" << std::endl;
    std::cout << "    1" << std::endl;
    std::cout << "   / \\" << std::endl;
    std::cout << "  2   3" << std::endl;
    std::cout << " / \\ / \\" << std::endl;
    std::cout << "4  5 6  7" << std::endl;
    std::cout << "  / \\" << std::endl;
    std::cout << " 8   9" << std::endl;


    std::cout << "Preorder traversal: ";
    bt.preOrder(root);
    std::cout << std::endl;

    std::cout << "Inorder traversal: ";
    bt.inOrder(root);
    std::cout << std::endl;

    std::cout << "Postorder traversal: ";
    bt.postOrder(root);
    std::cout << std::endl;

    return 0;
}
```

运行结果：

```
The binary tree is:
    1
   / \
  2   3
 / \ / \
4  5 6  7
  / \
 8   9
Binary Tree 1:
Preorder traversal: 1 2 4 5 3 
Inorder traversal: 4 2 5 1 3 
Postorder traversal: 4 5 2 3 1 
Binary Tree 2:
Preorder traversal: 1 2 4 8 9 5 3 6 7 
Inorder traversal: 8 4 9 2 5 1 6 3 7 
Postorder traversal: 8 9 4 5 2 6 7 3 1 

Process finished with exit code 0
```