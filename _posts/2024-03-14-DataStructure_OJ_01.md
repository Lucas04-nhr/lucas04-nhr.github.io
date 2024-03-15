---
layout: post
title: Data Structure-Online Job 01
date: 20240314
category: "Data Structure OJ"
tags: [Data Structure, OJ, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

Ordered Linked List

> 此文档仅供参考，所有代码均未包含主程序中的调用部分，请自行根据`Basic`章节中的模板函数生成实例调用。

## 1. 顺序表部分

### a. 对于有序顺序表，去除重复数据，如1233445 —>12345

基本思路是遍历链表，比较当前节点和下一个节点的数据。如果它们相同，我们就删除下一个节点。如果它们不同，我们就移动到下一个节点。

```c++
// Remove duplicates from a sorted list
void removeDuplicates(LinkList L) {
    node* current = L->next;
    while(current != nullptr && current->next != nullptr) {
        if(current->data == current->next->data) {
            node* temp = current->next;
            current->next = current->next->next;
            delete temp;
        } else {
            current = current->next;
        }
    }
}
```

### b. 排除所有0元素,如 20031004 —>2314 

基本思路是遍历链表，如果当前节点的数据为0，我们就删除当前节点。如果当前节点的数据不为0，我们就移动到下一个节点。

```c++
// Remove zeros from a list
void removeZeros(LinkList L) {
    node* current = L;
    while(current != nullptr && current->next != nullptr) {
        if(current->next->data == 0) {
            node* temp = current->next;
            current->next = current->next->next;
            delete temp;
        } else {
            current = current->next;
        }
    }
}
```

### c. 三种经典排序算法

#### 冒泡排序

冒泡排序是一种简单的排序算法。它重复地遍历要排序的列表，一次比较两个元素，如果它们的顺序错误就把它们交换过来。遍历列表的工作是重复地进行直到没有再需要交换，也就是说该列表已经排序完成。

```c++
// Bubble sort the list
void bubbleSort(LinkList L) {
    if (L == nullptr || L->next == nullptr || L->next->next == nullptr) {
        return;
    }

    for (node* i = L->next; i != nullptr; i = i->next) {
        for (node* j = L->next; j->next != nullptr; j = j->next) {
            if (j->data > j->next->data) {
                int temp = j->data;
                j->data = j->next->data;
                j->next->data = temp;
            }
        }
    }
}
```

#### 插入排序

插入排序是一种简单直观的排序算法。它的工作原理是通过构建有序序列，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。

```c++
// Insertion sort the list
void insertionSort(LinkList L) {
    if (L == nullptr || L->next == nullptr) {
        return;
    }

    node* sortedEnd = L->next;
    while (sortedEnd != nullptr && sortedEnd->next != nullptr) {
        node* current = sortedEnd->next;
        if (current->data >= sortedEnd->data) {
            sortedEnd = sortedEnd->next;
        } else if (current->data < L->next->data) {
            sortedEnd->next = current->next;
            current->next = L->next;
            L->next = current;
        } else {
            node* temp = L;
            while (temp->next->data < current->data) {
                temp = temp->next;
            }
            sortedEnd->next = current->next;
            current->next = temp->next;
            temp->next = current;
        }
    }
}
```

#### 选择排序

选择排序是一种简单直观的排序算法。它的工作原理是每次从待排序的数据元素中选出最小（或最大）的一个元素，存放在序列的起始位置，直到全部待排序的数据元素排完。

```c++
// Selection sort the list
void selectionSort(LinkList L) {
    if (L == nullptr || L->next == nullptr) {
        return;
    }

    node* head = L;
    while (head->next != nullptr) {
        node* min = head;
        for (node* i = head; i->next != nullptr; i = i->next) {
            if (i->next->data < min->next->data) {
                min = i;
            }
        }
        if (min != head) {
            node* temp = min->next;
            min->next = temp->next;
            temp->next = head->next;
            head->next = temp;
        }
        head = head->next;
    }
}
```

### c. 模式匹配问题

> 此问题尚未得到有效解答，以下代码仅供参考

```c++
// I don't really know what the meaning of this challenge is, and whether it's about linked list.
// I think it's about regex.

# include <regex>
# include <iostream>

bool patternMatch(const std::string& str, const std::string& pattern) {
    std::regex r(pattern);
    return std::regex_match(str, r);
}

int main() {
    std::string email1 = "example@example.com";
    std::string pattern = "^(\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+)$";

    std::cout << "Email: " << email1 << std::endl;

    if (patternMatch(email1, pattern)) {
        std::cout << "Valid email address.\n";
    }
    else {
        std::cout << "Invalid email address.\n";
    }
    std::cout << std::endl;

    std::string email2 = "example";
    std::cout << "Email: " << email2 << std::endl;

    if (patternMatch(email2, pattern)) {
        std::cout << "Valid email address.\n";
    }
    else {
        std::cout << "Invalid email address.\n";
    }

    return 0;
}
```

## 2. 单链表部分

### a. 将单链表逆置，要求不改变结点地址

要将单链表逆置，而不改变节点地址，我们可以通过调整节点之间的链接来实现。我们可以创建一个新的头节点，然后遍历原链表，每次都将当前节点插入到新头节点的后面。这样，原链表的最后一个节点就会成为新链表的第一个节点，从而实现链表的逆置。

```c++
// Reverse the linked list without changing node addresses
LinkList reverseList(LinkList L) {
    if (L == nullptr || L->next == nullptr) {
        return L;
    }

    LinkList newHead = new(node);
    newHead->next = nullptr;
    node* current = L->next;

    while (current != nullptr) {
        node* nextNode = current->next; // Save the next node
        current->next = newHead->next;  // Insert current node to the new list
        newHead->next = current;
        current = nextNode;             // Move to the next node
    }

    delete L; // Delete the old head node
    return newHead;
}
```

此外，我们还可以通过以下的函数输出链表中各个节点在内存中的地址来验证代码的正确性：

```c++
// Print the addresses of the nodes in the linked list
void printAddresses(LinkList L) {
    node* current = L->next;

    while (current != nullptr) {
        std::cout << &current << std::endl;
        current = current->next;
    }
}
```

### b. 找单链表中点

要找到单链表的中点，我们可以使用两个指针，一个快指针和一个慢指针。快指针每次移动两个节点，慢指针每次移动一个节点。当快指针到达链表的末尾时，慢指针将位于链表的中点。

```c++
// Find the middle node of the linked list
node* findMiddle(LinkList L) {
    if (L == nullptr) {
        return nullptr;
    }

    node* slow = L->next;
    node* fast = L->next;

    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }

    return slow;
}
```

### c. 找单链表倒数第 K 个点

> 此题解法不唯一，下面仅列举一种解法

要找到单链表的倒数第 K 个节点，我们可以使用两个指针，一个快指针和一个慢指针。首先，快指针先向前移动 K 步，然后快指针和慢指针同时向前移动。当快指针到达链表的末尾时，慢指针将位于链表的倒数第 K 个节点。注意：在实际编程中，我们需要先判断链表的长度是否大于 K，如果小于 K，则直接返回 `nullptr`。

> 你也可以直接让尾部指针向前移动K步来完成题目要求，但是似乎此方法有潜在的bug，故我并未使用。

```c++
// Find the Kth node from the end of the linked list
node* findKthFromEnd(LinkList L, int K) {
    if (L == nullptr) {
        return nullptr;
    }

    node* slow = L->next;
    node* fast = L->next;

    // Move fast pointer K steps ahead
    for (int i = 0; i < K; i++) {
        if (fast != nullptr) {
            fast = fast->next;
        } else {
            // If K is greater than the length of the list
            return nullptr;
        }
    }

    // Move both pointers until fast reaches the end
    while (fast != nullptr) {
        slow = slow->next;
        fast = fast->next;
    }

    // Now, slow pointer points to the Kth node from the end
    return slow;
}
```

### d. 删除单链表中倒数第 K 个结点

> 此题解法不唯一，下面仅列举一种解法

要删除单链表的倒数第 K 个节点，我们可以使用两个指针，一个快指针和一个慢指针。首先，快指针先向前移动 K 步，然后快指针和慢指针同时向前移动。当快指针到达链表的末尾时，慢指针将位于链表的倒数第 K+1 个节点。然后我们可以通过改变慢指针的 next 指针来删除倒数第 K 个节点。

```c++
// Delete the Kth node from the end of the linked list
void deleteKthFromEnd(LinkList &L, int K) {
    if (L == nullptr) {
        return;
    }

    node* dummy = new(node);
    dummy->next = L->next;
    node* slow = dummy;
    node* fast = dummy;

    // Move fast pointer K steps ahead
    for (int i = 0; i < K; i++) {
        if (fast != nullptr) {
            fast = fast->next;
        } else {
            // If K is greater than the length of the list
            return;
        }
    }

    // Move both pointers until fast reaches the end
    while (fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next;
    }

    // Now, slow pointer points to the Kth node from the end
    node* toDelete = slow->next;
    slow->next = slow->next->next;
    delete toDelete;

    L->next = dummy->next;
    delete dummy;
}
```

### e. 判断单链表是否有环，如有，找出交点

要判断单链表是否有环，我们可以使用两个指针，一个快指针和一个慢指针。快指针每次移动两个节点，慢指针每次移动一个节点。如果链表中存在环，那么快指针和慢指针最终会在环中的某个位置相遇。  如果链表中存在环，我们可以通过以下方式找到环的交点：当快指针和慢指针第一次相遇时，我们将慢指针移动到链表的头部，然后将快指针和慢指针的速度都改为每次移动一个节点。当它们再次相遇时，相遇的位置就是环的交点。

```c++
// Check if the linked list has a cycle and find the intersection point
node* hasCycle(LinkList L) {
    if (L == nullptr) {
        return nullptr;
    }

    node* slow = L->next;
    node* fast = L->next;

    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;

        if (slow == fast) { // Cycle detected
            slow = L->next; // Move slow pointer to the head

            while (slow != fast) { // Move both pointers at the same speed
                slow = slow->next;
                fast = fast->next;
            }

            return slow; // The intersection point of the cycle
        }
    }

    return nullptr; // No cycle
}
```

### f. 判断两个单链表是否相交，如果相交，找出交点

要判断两个单链表是否相交，我们可以使用以下步骤：  

1. 首先，遍历两个链表，获取它们的长度和最后一个节点。
2. 如果两个链表的最后一个节点不相同，那么它们不相交。
3. 如果两个链表的最后一个节点相同，那么它们相交。我们可以通过以下方式找到交点：
    - 让较长的链表的指针先移动两个链表长度之差的步数。
    - 然后，两个链表的指针同时向前移动，当它们相遇时，相遇的位置就是交点。

```c++
// Find the length of the linked list
int getLength(LinkList L) {
    int length = 0;
    node* current = L->next;
    while (current != nullptr) {
        length++;
        current = current->next;
    }
    return length;
}

// Check if two linked lists intersect and find the intersection point
node* getIntersection(LinkList L1, LinkList L2) {
    if (L1 == nullptr || L2 == nullptr) {
        return nullptr;
    }

    int len1 = getLength(L1);
    int len2 = getLength(L2);

    node* p1 = L1->next;
    node* p2 = L2->next;

    // Move the pointer of the longer list len1 - len2 steps ahead
    if (len1 > len2) {
        for (int i = 0; i < len1 - len2; i++) {
            p1 = p1->next;
        }
    } else {
        for (int i = 0; i < len2 - len1; i++) {
            p2 = p2->next;
        }
    }

    // Move both pointers until they meet
    while (p1 != nullptr && p2 != nullptr && p1 != p2) {
        p1 = p1->next;
        p2 = p2->next;
    }

    // If the two lists intersect, p1/p2 will be the intersection point
    // If the two lists do not intersect, p1/p2 will be nullptr
    return p1;
}
```

值得注意的是，在实际应用中，若使用`Basic`章节中的`copyList`函数构造内容相同的两个链表进行验证时，由于此函数仅是将链表内容复制，而非地址，故这两个“看上去相同”的链表实际上的地址并不会相同。在使用`getIntersection`函数时，就会出现不符合预期的情况，即会判断两个链表不相交。因此，我们需要使用下面`copyListWithAddress`函数来复制链表。

> 此特性类似于操作系统中的硬链接和软链接的区别：硬链接是复制内容，子文件和母文件独立，互不影响；软链接是复制地址，对子文件的修改也会同步到母文件。

```c++
// Copy the linked list with the same addresses
LinkList copyListWithAddress(LinkList L) {
    if (L == nullptr) {
        return nullptr;
    }

    LinkList newHead = new(node);
    newHead->next = nullptr;
    node* current = L->next;
    node* newCurrent = newHead;

    while (current != nullptr) {
        newCurrent->next = current;
        newCurrent = newCurrent->next;
        current = current->next;
    }

    return newHead;
}
```

### g. 对于有序单链表，删除重复节点(保留/不保留)

1. 保留重复节点

    对于有序单链表删除重复节点的问题，我们可以使用两个指针来解决。一个指针用于遍历链表，另一个指针用于指向当前不重复的最后一个节点。当遍历的节点与当前不重复的最后一个节点相同时，我们就**跳过**这个节点，否则，我们就更新当前不重复的最后一个节点。

    ```c++
    // Remove duplicates from a sorted list
    void removeDuplicates(LinkList L) {
        if (L == nullptr || L->next == nullptr) {
            return;
        }

        node* current = L->next;
        while (current != nullptr && current->next != nullptr) {
            if (current->data == current->next->data) {
                node* temp = current->next;
                current->next = current->next->next;
                delete temp;
            } else {
                current = current->next;
            }
        }
    }
    ```

    在这段代码中，我们首先检查链表是否为空或只有一个节点。如果是，那么我们不需要做任何事情，直接返回。然后，我们使用一个指针`current`来遍历链表。如果`current`节点的数据与其下一个节点的数据相同，那么我们就删除**下一个**节点。否则，我们就将`current`移动到下一个节点。这样，我们就可以删除所有重复的节点，只保留一个。

2. 不保留重复节点

    对于有序单链表删除所有重复节点的问题，我们可以使用两个指针来解决。一个指针用于遍历链表，另一个指针用于指向当前不重复的最后一个节点。当遍历的节点与当前不重复的最后一个节点相同时，我们就**删除**这个节点，否则，我们就更新当前不重复的最后一个节点。

### h. 约瑟夫问题(有损/无损)

约瑟夫问题是一个著名的问题：N个人围成一圈，从第一个开始报数，每次报到M的人出列，然后下一个人继续从1开始报数，直到所有人都出列。

1. 无损

    对于无损实现的约瑟夫问题，我们可以创建一个新的链表来存储出列的顺序，而不是直接在原链表上进行删除操作。这样，我们就可以保留原链表中的所有数据。

    ```c++
    // Josephus problem without loss
    LinkList josephus_no_loss(LinkList &L, int n, int m) {
        // Create a circular linked list
        node* p = L;
        p->data = 1;  // Start from 1
        for (int i = 2; i <= n; i++) {
            p->next = new(node);
            p->next->data = i;  // Assign data to the new node
            p = p->next;
        }
        p->next = L;  // Make it circular

        // Create a new linked list to store the order of out
        LinkList outOrder = new(node);
        node* outP = outOrder;

        node* prev = p;
        p = L;
        while (p->next != p) {
            // Skip m-1 nodes
            for (int count = 1; count < m; count++) {
                prev = p;
                p = p->next;
            }
            // Add the m-th node to the new linked list
            outP->next = new(node);
            outP->next->data = p->data;
            outP = outP->next;

            // Move to the next node
            prev->next = p->next;
            p = prev->next;
        }

        // Add the last remaining node to the new linked list
        outP->next = new(node);
        outP->next->data = p->data;
        outP = outP->next;
        outP->next = nullptr;

        // Add the last remaining node to the new linked list
        outP->next = new(node);
        outP->next->data = p->data;
        outP = outP->next;
        outP->next = nullptr;

        // Output the last survivor
        std::cout << "The last survivor is " << outP->data << std::endl;

        return outOrder;
    }
    ```

    在这段代码中，我们首先创建一个循环链表来表示围成一圈的人。然后，我们**创建一个新的链表**`outOrder`来存储出列的顺序。每次我们跳过m-1个节点，然后将第m个节点添加到新的链表中。我们继续这个过程，直到只剩下一个节点。最后剩下的节点也添加到新的链表中。这样，我们就得到了一个新的链表，它表示了出列的顺序，而原链表中的所有数据都被保留了。

2. 有损

    对于有损实现的约瑟夫问题，我们可以直接在原链表上进行删除操作。每次我们跳过m-1个节点，然后删除第m个节点。我们继续这个过程，直到只剩下一个节点。最后剩下的节点就是生存者。

    ```c++
    // Josephus problem with loss
    void josephus(LinkList &L, int n, int m) {
        // Create a circular linked list
        node* p = L;
        p->data = 1;  // Start from 1
        for (int i = 2; i <= n; i++) {
            p->next = new(node);
            p->next->data = i;  // Assign data to the new node
            p = p->next;
        }
        p->next = L;  // Make it circular

        node* prev = p;
        p = L;
        while (p->next != p) {
            // Skip m-1 nodes
            for (int count = 1; count < m; count++) {
                prev = p;
                p = p->next;
            }
            // Remove the m-th node
            prev->next = p->next;
            delete p;
            p = prev->next;
        }

        // The last remaining node is the survivor
        std::cout << "The survivor is " << p->data << std::endl;
        delete p;
    }
    ```

    在这段代码中，我们首先创建一个循环链表来表示围成一圈的人。然后，我们使用两个指针`prev`和`p`来遍历链表。每次我们跳过m-1个节点，然后删除第m个节点。我们继续这个过程，直到只剩下一个节点。最后剩下的节点就是生存者。

### i. 合并两个升序单链表(保留重复点)，合并后为升序

为了合并两个升序单链表并保留重复的节点，我们可以使用一个新的链表来存储合并的结果。我们可以同时遍历两个链表，每次从两个链表的头部选择较小的节点添加到新链表中。如果两个节点的值相等，我们都添加到新链表中。我们继续这个过程，直到两个链表都被完全遍历。

```c++
// Merge two sorted lists and keep duplicates
LinkList merge(LinkList L1, LinkList L2) {
    // Create a new linked list to store the result
    LinkList mergedList = new(node);
    node* p = mergedList;

    // Pointers to the heads of L1 and L2
    node* p1 = L1->next;
    node* p2 = L2->next;

    // Merge L1 and L2
    while (p1 != nullptr && p2 != nullptr) {
        if (p1->data <= p2->data) {
            // Add the node from L1 to the merged list
            p->next = new(node);
            p->next->data = p1->data;
            p = p->next;
            p1 = p1->next;
        }
        if (p1 != nullptr && p2->data <= p1->data) {
            // Add the node from L2 to the merged list
            p->next = new(node);
            p->next->data = p2->data;
            p = p->next;
            p2 = p2->next;
        }
    }

    // Add the remaining nodes from L1 or L2 to the merged list
    while (p1 != nullptr) {
        p->next = new(node);
        p->next->data = p1->data;
        p = p->next;
        p1 = p1->next;
    }
    while (p2 != nullptr) {
        p->next = new(node);
        p->next->data = p2->data;
        p = p->next;
        p2 = p2->next;
    }

    p->next = nullptr;
    return mergedList;
}
```

在这段代码中，我们首先创建一个新的链表`mergedList`来存储合并的结果。然后，我们同时遍历`L1`和`L2`，每次从两个链表的头部选择较小的节点添加到新链表中。如果两个节点的值相等，我们都添加到新链表中。我们继续这个过程，直到两个链表都被完全遍历。最后，我们将`L1`或`L2`中剩余的节点添加到新链表中。

### j. 合并两个升序单链表(保留重复点)，合并后为降序

为了合并两个升序单链表并保留重复的节点，同时保证合并后的链表为降序，我们可以首先按照升序的方式合并两个链表，然后再对合并后的链表进行逆序操作。下面是逆序操作的函数代码：

```c++
// Reverse the linked list
LinkList reverseList(LinkList L) {
    node* prev = nullptr;
    node* current = L->next;
    node* next = nullptr;

    while (current != nullptr) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }

    L->next = prev;
    return L;
}
```

### k. 判断一个单链表是否对称

为了判断一个单链表是否对称，我们可以使用快慢指针法找到链表的中点，然后将链表的后半部分进行反转。然后我们可以同时从链表的头部和中点开始遍历，如果所有节点的值都相等，那么这个链表就是对称的。 

```c++
bool isSymmetric(LinkList L) {
    // Find the middle of the linked list
    node* slow = L->next;
    node* fast = L->next;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }

    // Reverse the second half of the linked list
    node* prev = nullptr;
    node* current = slow;
    node* next = nullptr;
    while (current != nullptr) {
        next = current->next;
        current->next = prev;
        prev = current;
        current = next;
    }

    // Compare the first half and the reversed second half
    node* p1 = L->next;
    node* p2 = prev;
    while (p2 != nullptr) {
        if (p1->data != p2->data) {
            return false;
        }
        p1 = p1->next;
        p2 = p2->next;
    }

    return true;
}
```
