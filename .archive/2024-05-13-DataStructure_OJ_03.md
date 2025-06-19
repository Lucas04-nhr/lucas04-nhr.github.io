---
layout: post
title: Data Structure-Online Job 03
date: 20240513
category: "Data Structure OJ"
tags: [Data Structure, OJ, Homework]
author: Lucas
comment: true
mathjax: true
published: true
---

Something about Graph Chapter.

## Basic Part

In the Graph chapter, the default template in <a href="https://blog.lucas04.xyz/posts/data%20structure%20oj/DataStructure_OJ_Basic.html" target="_blank">Basic</a> isn't suitable. So I will provide a new template for this chapter.

### Headers you should include

```cpp
#include <iostream>
#include <list>
#include <queue>
```

### Basic class of a graph

```cpp
class Graph {
    int V; // No. of vertices
    std::list<int> *adj; // Pointer to an array containing adjacency lists

public:
    Graph(int V); // Constructor
    void addEdge(int v, int w); // function to add an edge to graph
    void printGraph();
};
```

The basic class of graph contains a list of integers and a pointer to an array containing adjacency lists. The constructor initializes the number of vertices and the adjacency list. The `addEdge` function adds an edge to the graph. The `printGraph` function prints the adjacency list of the graph.

### Constructor

```cpp
Graph::Graph(int V) {
    this->V = V;
    adj = new std::list<int>[V];
}
```

The constructor initializes the number of vertices and creates an array of adjacency lists of size `V`.

### addEdge

```cpp
void Graph::addEdge(int v, int w) {
    adj[v].push_back(w); // Add w to v’s list.
}
```

The `addEdge` function adds an edge to the graph. The edge is added to the adjacency list of vertex `v`. The function adds the vertex `w` to the adjacency list of vertex `v`.

### printGraph

```cpp
void Graph::printGraph() {
    for (int v = 0; v < V; ++v) {
        std::cout << "\n Adjacency list of vertex " << v << "\n head ";
        for (auto x : adj[v]) {
            std::cout << "-> " << x;
        }
        std::cout << std::endl;
    }
}
```

The `printGraph` function prints the adjacency list of each vertex. The function iterates through each vertex and prints the adjacency list of each vertex.

To shorten the code, I will not provide the main function in the following code. You can add the main function by yourself.

## Online Jobs

### Task 01

图的广度及深度遍历

在C++中，图的遍历通常可以通过深度优先搜索（DFS）或广度优先搜索（BFS）来实现。以下是一个简单的无向图的实现，包括DFS和BFS的遍历方法。

下面是实现BFS和DFS的具体方法。

#### BFS

##### 代码实现

```cpp
void Graph::BFS(int s) {
    // Mark all the vertices as not visited
    bool *visited = new bool[V];
    for(int i = 0; i < V; i++)
        visited[i] = false;

    // Create a queue for BFS
    std::queue<int> queue;

    // Mark the current node as visited and enqueue it
    visited[s] = true;
    queue.push(s);

    while(!queue.empty()) {
        // Dequeue a vertex from queue and print it
        s = queue.front();
        std::cout << s << " ";
        queue.pop();

        // Get all adjacent vertices of the dequeued vertex s
        // If an adjacent has not been visited, then mark it visited and enqueue it
        for(auto i = adj[s].begin(); i != adj[s].end(); ++i) {
            if (!visited[*i]) {
                queue.push(*i);
                visited[*i] = true;
            }
        }
    }
}
```

##### 输出结果
    
```
0 1 2 3 4 5
```

#### DFS

##### 代码实现

```cpp
void Graph::DFS(int v, bool visited[]) {
    // Mark the current node as visited and print it
    visited[v] = true;
    std::cout << v << " ";

    // Recur for all the vertices adjacent to this vertex
    std::list<int>::iterator i;
    for(i = adj[v].begin(); i != adj[v].end(); ++i)
        if(!visited[*i])
            DFS(*i, visited);
}
```

这样，我们就可以创建一个图的实例，添加边，然后使用DFS或BFS进行遍历了。

##### 输出结果
    
```
0 1 2 3 4 5
```

### Task 02

**（选做）** 最小生成树和最短路径

最小生成树（Minimum Spanning Tree，MST）和最短路径（Shortest Path）是图论中的两个重要概念。

1. 最小生成树：在一个连通图中，所有的顶点都可以连通，并且所有的边的权值之和最小的树，称为最小生成树。常用的算法有`Prim`算法和`Kruskal`算法。

2. 最短路径：在一个图中，从一个顶点到另一个顶点的所有路径中，边的权值之和最小的路径，称为最短路径。常用的算法有`Dijkstra`算法和`Floyd`算法。

为完成上述两个需求，需再引入下面头文件：

```cpp
#include <vector>
#include <algorithm>
```

并定义边的结构体：

```cpp
struct Edge {
    int src, dest, weight;
};
```

#### `Kruskal`算法实现最小生成树

```cpp
std::vector<Edge> Graph::kruskalMST() {
    UnionFind uf(V);
    std::vector<Edge> result;

    for (auto &edge : edges) {
        if (!uf.isConnected(edge.src, edge.dest)) {
            uf.unionSet(edge.src, edge.dest);
            result.push_back(edge);
        }
    }

    return result;
}
```

需要注意的是，此处应添加另一个并查集算法来检测边是否会成环。

```cpp
class UnionFind {
    std::vector<int> parent;
    std::vector<int> rank;

public:
    UnionFind(int n) {
        parent.resize(n);
        rank.resize(n, 0);
        for (int i = 0; i < n; ++i) {
            parent[i] = i;
        }
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    void unionSet(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        if (rootX != rootY) {
            if (rank[rootX] > rank[rootY]) {
                parent[rootY] = rootX;
            } else if (rank[rootX] < rank[rootY]) {
                parent[rootX] = rootY;
            } else {
                parent[rootY] = rootX;
                rank[rootX] += 1;
            }
        }
    }

    bool isConnected(int x, int y) {
        return find(x) == find(y);
    }
};
```

#### `Prim`算法实现最小生成树

```cpp
std::vector<Edge> Graph::primMST() {
    std::vector<int> key(V, INT_MAX);
    std::vector<int> parent(V, -1);
    std::vector<bool> inMST(V, false);

    key[0] = 0;
    parent[0] = -1;

    for (int count = 0; count < V - 1; count++) {
        int u = -1;
        for (int i = 0; i < V; i++) {
            if (!inMST[i] && (u == -1 || key[i] < key[u])) {
                u = i;
            }
        }

        inMST[u] = true;

        for (auto x : adj[u]) {
            int v = x; // Get vertex label and weight of current adjacent of u.
            int weight = getWeight(u, v);
            if (!inMST[v] && weight < key[v]) {
                parent[v] = u;
                key[v] = weight;
            }
        }
    }

    std::vector<Edge> result;
    for (int i = 1; i < V; i++) {
        result.push_back({parent[i], i, key[i]});
    }

    return result;
}
```
> Generated by GitHub Copilot, not verified yet. You should check the correctness of the code and use it with caution.

#### `Dijkstra`算法实现最短路径

```cpp
std::vector<int> Graph::dijkstra(int src) {
    std::vector<int> dist(V, INT_MAX);
    dist[src] = 0;

    std::vector<bool> visited(V, false);

    for (int count = 0; count < V - 1; count++) {
        int u = -1;
        for(int i=0;i<V;i++)
            if(!visited[i] && (u==-1||dist[i]<dist[u]))
                u = i;
        visited[u] = true;

        for (auto x : adj[u]) {
            int v = x; // Get vertex label and weight of current adjacent of u.
            int weight = getWeight(u, v);
            if (dist[u] != INT_MAX && dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
            }
        }
    }

    return dist;
}

```

注意：这个代码需要图中的边有权重，需要在你的图中定义这个权重，在`Graph`类中添加下面方法：

```cpp
int Graph::getWeight(int src, int dest) {
    for (auto &edge : edges) {
        if (edge.src == src && edge.dest == dest) {
            return edge.weight;
        }
    }
    return -1; // If there is no edge between src and dest, return -1
}
```

#### `Floyd`算法实现最短路径

```cpp
std::vector<std::vector<int>> Graph::floyd() {
    std::vector<std::vector<int>> dist(V, std::vector<int>(V, INT_MAX));

    for (int i = 0; i < V; i++) {
        dist[i][i] = 0;
    }

    for (auto &edge : edges) {
        dist[edge.src][edge.dest] = edge.weight;
    }

    for (int k = 0; k < V; k++) {
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                if (dist[i][k] != INT_MAX && dist[k][j] != INT_MAX && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}
```

> Generated by GitHub Copilot, not verified yet. You should check the correctness of the code and use it with caution.

### Task 03

**（选做）** 拓扑排序

在C++中，拓扑排序通常用于解决“在给定的有向无环图（DAG）中，需要按照顶点的先后顺序进行排序”的问题。这种排序的一个常见应用是确定任务的依赖关系。

以下是一个简单的拓扑排序的实现：

```cpp
void Graph::topologicalSort() {
    std::vector<int> in_degree(V, 0);

    for (int u=0; u<V; u++) {
        for(auto itr = adj[u].begin(); itr != adj[u].end(); itr++)
             in_degree[*itr]++;
    }

    std::queue<int> q;
    for (int i = 0; i < V; i++)
        if (in_degree[i] == 0)
            q.push(i);

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        std::cout << u << " ";

        for(auto itr = adj[u].begin(); itr != adj[u].end(); itr++)
            if (--in_degree[*itr] == 0)
                q.push(*itr);
    }
}
```

在这个代码中，我们首先计算每个顶点的入度（即，有多少边指向该顶点）。然后，我们将所有入度为0的顶点添加到队列中。接着，我们开始从队列中取出顶点，并将其输出。每取出一个顶点，我们就将其所有邻接顶点的入度减1，如果邻接顶点的入度变为0，就将其加入队列。这个过程一直持续到队列为空为止。
