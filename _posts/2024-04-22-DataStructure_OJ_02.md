---
layout: post
title: Data Structure-Online Job 02
date: 20240422
category: "Data Structure OJ"
tags: [Data Structure, OJ, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

> 此文档仅供参考，所有代码均未包含主程序中的调用部分，请自行根据`Basic`章节中的模板函数生成实例调用。

## 二叉树的建立

### 建立链式二叉树，递归方法前序、中序、后序遍历链式二叉树

首先，我们需要创建一个二叉树节点类，然后创建一个二叉树类，其中包含创建二叉树和遍历二叉树的方法。

以下是二叉树节点类的代码：

```cpp
class TreeNode {
public:
    int val;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};
```

接下来，我们创建一个二叉树类，其中包含创建二叉树和遍历二叉树的方法：

```cpp
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
```

### 建立顺序二叉树，递归方法前序、中序、后序遍历存储二叉树

在C++中，我们可以使用数组来实现顺序二叉树。数组的索引可以代表节点的位置，而数组的值可以代表节点的值。对于数组中的任意一个元素，其左子节点的索引是`2*index+1`，右子节点的索引是`2*index+2`。

以下是创建顺序二叉树并进行前序、中序和后序遍历的代码：

```cpp
class BinaryTree {
public:
    std::vector<int> tree;

    BinaryTree(const std::vector<int>& input) : tree(input) {}

    void preOrder(int index) {
        if (index >= tree.size()) {
            return;
        }
        std::cout << tree[index] << " ";
        preOrder(2 * index + 1);
        preOrder(2 * index + 2);
    }

    void inOrder(int index) {
        if (index >= tree.size()) {
            return;
        }
        inOrder(2 * index + 1);
        std::cout << tree[index] << " ";
        inOrder(2 * index + 2);
    }

    void postOrder(int index) {
        if (index >= tree.size()) {
            return;
        }
        postOrder(2 * index + 1);
        postOrder(2 * index + 2);
        std::cout << tree[index] << " ";
    }
};
```

## 将二叉树对称交换

> 即求二叉树镜像

要求二叉树的镜像，我们可以创建一个函数，该函数接收一个节点作为参数。如果该节点为空，我们直接返回。否则，我们交换该节点的左右子节点，然后递归地对左右子节点进行同样的操作。

以下是在`BinaryTree`类中添加`mirror`函数的代码：

```cpp
void mirror(int index) {
    if (index >= tree.size()) {
        return;
    }
    // Swap left and right children
    std::swap(tree[2 * index + 1], tree[2 * index + 2]);
    // Mirror left and right subtrees
    mirror(2 * index + 1);
    mirror(2 * index + 2);
}
```

这样，二叉树就被镜像了。

## 二叉树的最大深度

在C++中，可以通过递归的方式来计算二叉树的高度。首先，需要在`BinaryTree`类中添加一个新的方法`height`。这个方法将会递归地计算左子树和右子树的高度，然后返回较大的那个高度加一（当前节点的高度）。

以下是代码实现：

```cpp
class BinaryTree {
public:
    std::vector<int> tree;

    BinaryTree(const std::vector<int>& input) : tree(input) {}

    // Other methods...

    int height(int index) {
        if (index >= tree.size() || tree[index] == -1) {
            return 0;
        }
        int leftHeight = height(2 * index + 1);
        int rightHeight = height(2 * index + 2);
        return std::max(leftHeight, rightHeight) + 1;
    }
};
```

**注意**，这里假设了二叉树是完全二叉树，并且用`-1`表示空节点。如果你的二叉树的表示方式不同，可能需要对代码进行相应的调整。

此外，我们还可以通过递归的方法实现类似目的：

```cpp
int maxDepth(TreeNode* root) {
    if (root == NULL) {
        return 0;
    }
    int leftDepth = maxDepth(root->left);
    int rightDepth = maxDepth(root->right);
    return std::max(leftDepth, rightDepth) + 1;
}
```

## 已知前序序列和中序序列，构造二叉树

分析题目需求，我们可以得出以下步骤：

1. 从前序遍历序列中获取第一个元素，该元素是树的根节点。
2. 在中序遍历序列中找到根节点，将序列分为两部分，左边部分是左子树，右边部分是右子树。
3. 对左子树和右子树递归执行上述步骤。

以下是实现功能部分的C++代码：

```c++
TreeNode* buildTreeFromVectors(std::vector<int>& preorder, int p_start, int p_end, std::vector<int>& inorder, int i_start, int i_end) {
    if (p_start == p_end) {
        return NULL;
    }

    int root_val = preorder[p_start];
    TreeNode* root = new TreeNode(root_val);

    int i_root_index = 0;
    for (int i = i_start; i < i_end; i++) {
        if (root_val == inorder[i]) {
            i_root_index = i;
            break;
        }
    }

    int left_num = i_root_index - i_start;

    root->left = buildTreeFromVectors(preorder, p_start + 1, p_start + left_num + 1, inorder, i_start, i_root_index);
    root->right = buildTreeFromVectors(preorder, p_start + left_num + 1, p_end, inorder, i_root_index + 1, i_end);

    return root;
}
```

请注意，这段代码没有包含遍历二叉树以验证其正确性的部分。您可以根据需要添加这部分代码。