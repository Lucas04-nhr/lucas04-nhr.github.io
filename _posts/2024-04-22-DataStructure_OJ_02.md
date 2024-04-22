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

    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
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
        if (node == nullptr) {
            return;
        }
        std::cout << node->val << " ";
        preOrder(node->left);
        preOrder(node->right);
    }

    void inOrder(TreeNode* node) {
        if (node == nullptr) {
            return;
        }
        inOrder(node->left);
        std::cout << node->val << " ";
        inOrder(node->right);
    }

    void postOrder(TreeNode* node) {
        if (node == nullptr) {
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
    if (root == nullptr) {
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

```c++
TreeNode* buildTreeFromVectors(std::vector<int>& preorder, int p_start, int p_end, std::vector<int>& inorder, int i_start, int i_end) {
    if (p_start == p_end) {
        return nullptr;
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

请注意，这段代码没有包含遍历二叉树以验证其正确性的部分，可以根据需要添加这部分代码。

## 分层遍历二叉树，即按层次从上往下，从左往右访问

要分层遍历二叉树，我们可以使用**队列**的数据结构。首先，将根节点放入队列。然后，**当队列不为空时**，我们取出队列的第一个元素，访问它，然后将它的左右子节点放入队列。这样，我们就可以按层次从上到下，从左到右访问二叉树的所有节点。

```c++
class Solution {
public:
    void levelOrderTraversal(TreeNode* root) {
        if (root == nullptr) {
            return;
        }

        std::queue<TreeNode*> q;
        q.push(root);

        while (!q.empty()) {
            TreeNode* node = q.front();
            q.pop();

            std::cout << node->val << " ";

            if (node->left != nullptr) {
                q.push(node->left);
            }

            if (node->right != nullptr) {
                q.push(node->right);
            }
        }

        std::cout << std::endl;
    }
};
```

此外，还可以通过在队列中存储一个包含节点和其层级的对来实现**更换层级时在控制台上输出换行符**的需求，使得结果展示可读性提高。每当我们从队列中取出一个节点时，我们就检查它的层级是否与前一个节点的层级相同。如果不同，我们就在控制台上换行。

```c++
if (level != currentLevel) {
    std::cout << std::endl;
    currentLevel = level;
}
```

## 求二叉树的宽度，即求最大结点数的层所具有的结点数

要求二叉树的宽度，我们可以使用层序遍历（BFS）的方法。在每一层遍历开始前，我们记录队列的大小，即当前层的节点数。然后我们将这个节点数与我们之前记录的最大宽度进行比较，更新最大宽度。以下是具体的代码实现：

```cpp
int widthOfBinaryTree(TreeNode* root) {
    if (root == nullptrptr) {
        return 0;
    }

    std::queue<TreeNode*> q;
    q.push(root);
    int maxWidth = 0;

    while (!q.empty()) {
        int levelSize = q.size();
        maxWidth = std::max(maxWidth, levelSize);

        for (int i = 0; i < levelSize; ++i) {
            TreeNode* node = q.front();
            q.pop();

            if (node->left != nullptrptr) {
                q.push(node->left);
            }

            if (node->right != nullptrptr) {
                q.push(node->right);
            }
        }
    }

    return maxWidth;
}
```

在这段代码中，我们首先检查根节点是否为空。如果为空，那么树的宽度就是0。然后我们创建一个队列，并将根节点加入队列。我们维护一个变量`maxWidth`来记录最大宽度。

在每一轮的循环中，我们首先记录当前队列的大小，即当前层的节点数，然后将这个节点数与`maxWidth`进行比较，更新`maxWidth`。然后我们遍历当前层的所有节点，将它们的左右子节点加入队列。

当队列为空时，循环结束，此时的`maxWidth`就是树的最大宽度。

## 二叉树中的结点个数

要计算二叉树中的节点个数，我们可以使用递归的方法。对于任意一个节点，它的节点个数等于左子树的节点个数加上右子树的节点个数再加一（当前节点）。

```cpp
int countNodes(TreeNode* root) {
    if (root == nullptrptr) {
        return 0;
    }
    return countNodes(root->left) + countNodes(root->right) + 1;
}
```

此外，我们还可以使用非递归的方法来计算二叉树中的节点个数。我们可以使用层序遍历（BFS）的方法，每遍历一个节点，我们就将节点个数加一。

以下是非递归方法的代码：

```cpp
int countNodes_without_recursive(TreeNode* root) {
    if (root == nullptrptr) {
        return 0;
    }

    std::queue<TreeNode*> q;
    q.push(root);
    int count = 0;

    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        count++;

        if (node->left != nullptrptr) {
            q.push(node->left);
        }

        if (node->right != nullptrptr) {
            q.push(node->right);
        }
    }

    return count;
}
```

## 非递归方法中序、后序遍历二叉树

在C++中，我们可以使用栈来实现二叉树的非递归中序和后序遍历。以下是两种方法的实现：

> **注：**需要包含`<stack>`头文件。

首先，我们来看看非递归的中序遍历：

```cpp
void inorderTraversal(TreeNode* root) {
    std::stack<TreeNode*> stack;
    TreeNode* curr = root;

    while (curr != nullptrptr || !stack.empty()) {
        while (curr != nullptrptr) {
            stack.push(curr);
            curr = curr->left;
        }
        curr = stack.top();
        stack.pop();
        std::cout << curr->val << " ";
        curr = curr->right;
    }
}
```

然后，我们来看看非递归的后序遍历。后序遍历稍微复杂一些，因为我们需要确保一个节点的左右子节点都被访问过才能访问该节点。我们可以使用两个栈来解决这个问题：

```cpp
void postorderTraversal(TreeNode* root) {
    std::stack<TreeNode*> stack1, stack2;
    stack1.push(root);

    while (!stack1.empty()) {
        TreeNode* node = stack1.top();
        stack1.pop();
        stack2.push(node);

        if (node->left) {
            stack1.push(node->left);
        }
        if (node->right) {
            stack1.push(node->right);
        }
    }

    while (!stack2.empty()) {
        std::cout << stack2.top()->val << " ";
        stack2.pop();
    }
}
```

## 求二叉树中叶子结点的个数

要计算二叉树中叶子节点的数量，我们可以使用递归的方法。我们将创建一个函数，该函数将检查一个节点是否是叶子节点（即它的左右子节点都是`nullptrptr`），如果是，它将返回1。否则，它将递归地对左右子节点调用自身，并将结果相加。

```cpp
int countLeafNodes(TreeNode* root) {
    if (root == nullptr) {
        return 0;
    }
    if (root->left == nullptr && root->right == nullptr) {
        return 1;
    }
    return countLeafNodes(root->left) + countLeafNodes(root->right);
}
```

## 判断两棵二叉树是否结构相同

要判断两棵二叉树是否结构相同，我们可以使用递归的方法。首先，如果两棵树都为空，那么它们的结构相同。如果只有一棵树为空，那么它们的结构不同。如果两棵树都不为空，我们需要递归地检查它们的左子树和右子树是否结构相同。

```cpp
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    bool isSameStructure(TreeNode* p, TreeNode* q) {
        if (p == nullptr && q == nullptr) {
            return true;
        } else if (p == nullptr || q == nullptr) {
            return false;
        } else {
            return isSameStructure(p->left, q->left) && isSameStructure(p->right, q->right);
        }
    }
};
```

在这段代码中，`isSameStructure`函数接收两个指向`TreeNode`的指针`p`和`q`，然后递归地比较这两棵树的结构是否相同。

## 求二叉树中两个结点的最低公共祖先结点

要找到二叉树中两个节点的最低公共祖先节点，我们可以使用递归的方法。我们从根节点开始，如果当前节点是要找的节点之一，那么这个节点就是最低公共祖先。如果当前节点不是要找的节点，我们就在左子树和右子树中分别查找。如果左子树和右子树都找到了节点，那么当前节点就是最低公共祖先。如果只有左子树或者右子树找到了节点，那么最低公共祖先就在那个子树中。

```cpp
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (root == nullptr) return nullptr;
    if (root == p || root == q) return root;

    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);

    // If both left and right are not null, 
    // it means p and q are in different subtrees, 
    // so the current node is the lowest common ancestor
    if (left != nullptr && right != nullptr) return root;

    // If only left is not null, 
    // it means both p and q are in the left subtree
    if (left != nullptr) return left;

    // If only right is not null,
    // it means both p and q are in the right subtree
    if (right != nullptr) return right;

    return nullptr;
}
```

这段代码中，`lowestCommonAncestor`函数接收三个参数：二叉树的根节点`root`，以及两个要找的节点`p`和`q`。函数返回的是`p`和`q`的最低公共祖先节点。
