---
title: macOS 文件系统深度解析
createTime: 2026/06/25 13:58:48
permalink: /blog/apfs_volume/
copyright: false
excerpt: '本文将深入探讨 macOS 中 APFS 文件系统的内部结构与工作机制，特别是从 macOS Catalina 开始引入的系统卷与数据卷分离设计。'
tags:
  - Apple
  - Software Engineering
---

:::note
本文转载自知乎专栏 [macOS 文件系统深度解析](https://zhuanlan.zhihu.com/p/2052455912506495034)，版权归原作者所有，此处仅做搬运供存档查阅，如有侵权请联系删除。
:::

## 概述

现代 macOS 的存储架构，远比表面看起来复杂。要真正理解 `/` 背后发生了什么，必须先了解 Apple 多年来对系统分层设计所做的演进。

从 macOS Catalina 开始，Apple 将系统拆分为：

- System Volume（系统卷）
- Data Volume（数据卷）

这一改变的出发点，是将只读的操作系统文件与用户可写的数据彻底分离，从而为后续的安全加固奠定基础。

从 Big Sur 开始，Apple 进一步引入了更激进的安全机制：

- Signed System Volume (SSV)——对系统卷进行加密签名校验
- APFS Snapshot Boot——从快照启动而非直接挂载卷
- Firmlink Namespace——在内核层面实现跨卷目录映射

而在 Apple Silicon 平台上，由于芯片内置了独立的安全处理器和固件信任链，启动流程又增加了若干新的参与者：

- iSCPreboot——存储并执行本地启动策略（LocalPolicy）
- xART——保存可信缓存与安全启动元数据
- Hardware——存储设备激活、工厂数据等硬件相关信息
- Secure Boot Policy——Apple Silicon 特有的多层级安全启动策略体系

因此，现代 macOS 的根目录 `/` 已不再对应某一个真实的磁盘分区，而是由多个卷共同构建出的统一命名空间（Namespace Union）。理解这一点，是读懂本文所有内容的前提。

## APFS 容器结构

APFS（Apple File System）以”容器”（Container）为最顶层的存储单元，容器之下才是各个独立的”卷”（Volume）。本机的主要 APFS 容器位于 `disk3`，内部包含以下卷：

```text
disk3
├── disk3s1  System
├── disk3s2  Preboot
├── disk3s3  Recovery
├── disk3s5  Data
└── disk3s6  VM
```

其中，System 卷与 Data 卷在逻辑上属于同一个”卷组”（Volume Group）：

```text
disk3s1
Name: Macintosh HD
Role: System

disk3s5
Name: Data
Role: Data
```

它们共同归属于：

```text
APFS Volume Group
UUID:
937449E6-EFC1-4FF8-B7B9-10B984769757
```

Volume Group 的概念由 macOS Big Sur 引入，其核心作用是将 System 卷与 Data 卷在逻辑上绑定为一对，使得 Finder、diskutil 以及系统工具能够将二者作为一个整体来管理，而无需用户感知其内部的分离结构。

## 实际启动卷

一个常见的误解是：系统从 `disk3s1`（System Volume）启动。事实并非如此。

验证：

```bash
mount | grep ' / '
```

结果：

```text
/dev/disk3s1s1 on /
(apfs, sealed, read-only)
```

这里出现了一个三级设备节点 `disk3s1s1`，它并不是一个独立的分区，而是 `disk3s1` 上的一个 **APFS Snapshot**（快照）。完整的启动层次如下：

```text
disk3s1
    ↓
Snapshot
    ↓
disk3s1s1
    ↓
挂载到 /
```

结构图：

```text
disk3s1
(System Volume)
    │
    ▼
Signed Snapshot
(disk3s1s1)
    │
    ▼
/
```

这意味着，你所看到的 `/System`、`/bin`、`/usr` 等目录，实际上来自一个不可变的快照，而非 System Volume 本身的实时状态。

## Signed System Volume（SSV）

SSV 是 macOS Big Sur 引入的核心安全特性之一，其目标是确保系统文件在出厂之后不会被任何人（包括 root 用户）悄无声息地篡改。

验证：

```bash
diskutil info /
```

结果：

```text
Sealed: Yes
Volume Read-Only: Yes
```

当前启动的是：

```text
Signed System Volume
```

其安全特性体现在多个层面：

- **只读（Read-Only）**：任何写操作都会被拒绝
- **Apple 签名**：整个卷的内容由 Apple 在发布时完成签名
- **Hash Tree 校验**：内核在访问每一个文件时都会验证其哈希值，确保文件未被修改
- **Secure Boot 验证**：iBoot 在加载系统之前，会验证 SSV 的签名是否有效

因此，以下路径的所有内容：

```text
/System
/bin
/sbin
/usr
```

均来自：

```text
disk3s1s1
```

而非 Data 卷。即便是 root 用户，也无法在不破坏 SSV 完整性的前提下修改这些路径中的任何文件。

## Root Namespace Union

用户在使用 macOS 时，会感觉 `/` 就是一个完整统一的文件系统，然而背后真正发生的是两个独立卷的”命名空间合并”（Namespace Union）。

验证：

```bash
ls -ldO /
```

结果：

```text
sunlnk
```

同时：

```bash
ls -ldO /System/Volumes/Data
```

结果：

```text
sunlnk
```

`sunlnk` 标志（Sun Link）是 macOS 内核用于标记参与 Namespace Union 的目录节点的标志位，说明系统正在使用：

```text
Namespace Union
```

机制。这一机制的逻辑结构如下：

```text
System Snapshot
        +
Data Volume
        │
        ▼
统一根目录 /
```

用户最终看到的是一个合并后的视图——来自 System Snapshot 的只读系统文件，与来自 Data Volume 的可写用户数据，在同一棵目录树中和谐共存，中间的边界对用户完全透明。

## Firmlink 机制

Namespace Union 能够实现的关键技术之一，就是 **Firmlink**（固态链接）。Firmlink 是 Apple 专为 APFS 设计的跨卷目录映射机制，其工作方式类似于符号链接（Symlink），但在实现层面有根本性的不同。

验证：

```bash
cat /usr/share/firmlinks
```

结果：

```text
/Applications
/Users
/Library
/private
/opt
/cores
/pkg
/usr/local
...
```

上述路径虽然在用户看来位于系统根目录下，但实际上它们全部指向：

```text
/System/Volumes/Data
```

例如：

```text
/Applications
        │
        ▼
/System/Volumes/Data/Applications
/Users
        │
        ▼
/System/Volumes/Data/Users
/Library
        │
        ▼
/System/Volumes/Data/Library
```

Firmlink 与传统 Symbolic Link 的核心差异如下表所示：

| 特性        | Firmlink | Symlink |
| ----------- | -------- | ------- |
| 内核级      | 是       | 否      |
| 用户可见    | 否       | 是      |
| 跨卷映射    | 是       | 否      |
| Finder 显示 | 普通目录 | 链接    |

正是因为 Firmlink 工作在内核层面且对用户不可见，绝大多数应用程序在访问 `/Applications` 或 `/Users` 时，完全无感知地穿越了卷边界，访问到的实际上是 Data Volume 中的内容。

## 根目录结构

了解了 Firmlink 机制之后，就可以更清晰地理解根目录中各路径的真实归属。

### Data Volume 实际存储目录

以下路径在表面上位于根目录，但实际上通过 Firmlink 映射到 Data Volume：

```text
/Applications
/Users
/Library
/private
/opt
/cores
/pkg
```

实际位于：

```text
/System/Volumes/Data
```

这些都是用户可写的目录，属于系统的”可变”部分。

### Symbolic Link

除了 Firmlink，根目录下还存在若干传统的 Symbolic Link，主要用于维护历史路径兼容性。

#### etc

```text
/etc
    ↓
private/etc
```

#### tmp

```text
/tmp
    ↓
private/tmp
```

#### var

```text
/var
    ↓
private/var
```

`/private` 实际上是一个真实目录，位于 System Snapshot 中，而 `/etc`、`/tmp`、`/var` 则是指向其子目录的符号链接。这一设计同样是历史遗留——在 macOS 早期，这些路径的行为与传统 Unix 系统保持一致。

#### home

验证：

```bash
mount | grep home
```

结果：

```text
auto_home
```

结构：

```text
/home
    ↓
/System/Volumes/Data/home
```

`/home` 的行为与其他路径略有不同。它实际上由：

```text
autofs
```

动态管理，负责在需要时自动挂载网络主目录（如通过 Open Directory 或 LDAP 绑定的用户目录），属于按需挂载（on-demand mount）的机制。

## Volumes 目录

`/Volumes` 是 macOS 的传统挂载点目录，所有可见的磁盘卷（包括外部存储）通常都会挂载于此。值得注意的是，这里存在一个容易令人困惑的设计。

验证：

```bash
ls -ld /Volumes/"Macintosh HD"
```

结果：

```text
Macintosh HD -> /
```

因此：

```text
/Volumes/Macintosh HD
```

实际上是一个：

```text
符号链接
```

指向：

```text
/
```

形成的循环结构：

```text
/Volumes/Macintosh HD
      │
      ▼
      /
```

这一设计主要用于兼容旧软件（部分应用以 `/Volumes/Macintosh HD/...` 的形式引用路径）以及 Finder 的导航逻辑——在 Finder 侧边栏中，”Macintosh HD” 作为一个独立的磁盘图标呈现，点击后实际访问的就是根目录 `/`。

## Data Volume

Data Volume 是用户日常操作中写入最频繁的卷，承载了系统运行时的所有可变数据。

挂载：

```text
disk3s5
```

路径：

```text
/System/Volumes/Data
```

验证：

```text
mount
```

结果：

```text
protect
root data
```

说明该卷是：

```text
Root Data Volume
```

其主要作用涵盖以下几个方面：

- **用户数据**：Home 目录、文档、下载等所有个人文件
- **第三方应用**：从 App Store 或其他渠道安装的应用程序
- **Home Directory**：所有本地用户的主目录均位于此卷
- **可写系统数据**：部分系统组件在运行时需要写入的配置与缓存

与 System Volume 的只读特性不同，Data Volume 支持读写操作，也是 FileVault 加密的主要保护对象。

## 1Preboot Volume

Preboot Volume 是启动过程的关键参与者，承担着为内核加载提供支撑材料的职责。

卷：

```text
disk3s2
```

挂载：

```text
/System/Volumes/Preboot
```

其中存储的内容包括：

```text
Kernel Collections   —— 内核及内核扩展的集合，由 kextcache 构建
Boot Manifest        —— 启动清单，描述当前启动配置
Boot Support Files   —— iBoot 与早期启动阶段所需的辅助文件
```

Preboot Volume 通常在启动完成后不会被用户直接访问，但在系统更新或重建内核缓存时，系统会对其进行写入操作。

## 11. Recovery Volume

Recovery Volume 平时处于”休眠”状态，仅在需要系统恢复时才会被激活并挂载。

卷：

```text
disk3s3
```

Role：

```text
Recovery
```

正常运行时不挂载，用户无法直接访问。

当系统无法正常启动、或用户主动进入恢复模式（Apple Silicon 上长按电源键，Intel 上按住 Cmd+R）时，该卷会被加载，提供以下能力：

```text
macOS Recovery       —— 完整的恢复环境
恢复系统             —— 从 Time Machine 或互联网恢复系统
磁盘工具             —— First Aid、分区、抹除等操作
终端                 —— 命令行访问，用于高级排查
重新安装系统         —— 在线下载并重新安装 macOS
```

## VM Volume

VM Volume 专用于虚拟内存管理，是系统在内存压力下进行页面置换的场所。

卷：

```text
disk3s6
```

挂载：

```text
/System/Volumes/VM
```

其主要功能：

```text
swapfile          —— 交换文件，用于将内存页面置换到磁盘
memory pressure   —— 配合系统内存压力管理机制
虚拟内存          —— 为所有进程提供统一的虚拟地址空间支撑
```

该卷的挂载参数包含：

```text
noexec
```

即禁止在此卷上执行任何可执行文件，从而防止潜在的安全利用（将恶意代码写入 swap 后尝试执行）。

## Update Volume

Update Volume 是系统更新流程中的临时工作区，负责在更新写入正式生效之前暂存相关数据。

卷：

```text
disk3s4
```

挂载：

```text
/System/Volumes/Update
```

其作用包括：

```text
系统更新缓存     —— 存放已下载但尚未应用的更新包
SSV 构建        —— 新 System Volume 快照的构建工作区
更新中间状态     —— 记录更新进度，支持断点恢复
```

这一设计使得 macOS 能够在不中断当前运行系统的前提下，在后台完成新系统快照的构建，下次重启时再切换到新的 Signed Snapshot。

## Apple Silicon 辅助启动容器

Apple Silicon 的安全启动链远比 Intel 时代复杂。除了主存储器上的 `disk3` 容器，系统还存在一个额外的 APFS 容器：

```text
disk1
```

这个容器运行在 Apple Silicon 的安全飞地（Secure Enclave）及启动辅助芯片（SoC）的控制下，其结构为：

```text
disk1
├── iSCPreboot
├── xART
├── Hardware
└── Recovery
```

这四个卷共同构成了 Apple Silicon 平台独有的”安全启动辅助层”，在 iBoot 正式加载 macOS 内核之前发挥关键作用。

## iSCPreboot

iSCPreboot（iSC 代表”Internal SoC”，即片上系统内部）是 Apple Silicon 启动策略的核心存储卷。

卷：

```text
disk1s1
```

挂载：

```text
/System/Volumes/iSCPreboot
```

在对其内容进行探查时，可以发现：

```text
937449E6-EFC1-...
```

这个目录名与：

```text
APFS Volume Group UUID
```

完全一致。这并非巧合——它明确表明 iSCPreboot 中的内容与特定的 Volume Group 绑定，每个已注册的 macOS 安装都对应其中的一个目录。

该目录内部进一步包含：

```text
LocalPolicy/
```

LocalPolicy 是 Apple Silicon 安全启动体系的核心概念之一，记录了针对本机当前 macOS 安装所设定的启动策略，具体涵盖：

- **Startup Security**（启动安全性）：完整安全性（Full Security）、降低安全性（Reduced Security）
- **External Boot Policy**（外部启动策略）：是否允许从外部存储设备启动
- **Custom Kernel Extensions**：是否允许加载第三方内核扩展
- **MDM Enrollment**（移动设备管理）相关策略

iSCPreboot 的整体目录结构如下：

```text
iSCPreboot
├── VolumeGroupUUID
│   └── LocalPolicy
├── SystemRecovery
├── WiFi
└── SFR
```

## xART

xART 是 Apple Silicon 启动链中保密程度最高的组件之一，其全称和内部实现均未被 Apple 公开记录。

卷：

```text
disk1s2
```

挂载：

```text
/System/Volumes/xarts
```

在对其进行有限探查时，发现：

```text
A375F60A-....gl
```

其物理特征：

- 大小约 6 MB，体量极小
- 受 SIP（System Integrity Protection）严格保护
- 即使是 root 用户也无法读取其内容

根据现有的逆向工程资料与 Apple 安全白皮书的间接线索，推断其用途如下：

```text
Trust Cache           —— 系统信任的可执行文件哈希缓存
Boot Artifacts        —— 启动过程所需的中间产物
Secure Boot Metadata  —— 支持 SSV 校验的元数据
IMG4 / IM4P 相关数据  —— Apple 固件签名格式的相关数据
```

Apple 至今未公开 xART 的详细文档，其内部格式和访问协议对外部研究者仍属黑盒。

## Hardware Volume

Hardware Volume 存储了设备生命周期中积累的各类硬件相关数据，是设备身份与健康状态的”档案室”。

卷：

```text
disk1s3
```

挂载：

```text
/System/Volumes/Hardware
```

对其内容进行探查，发现以下目录和文件：

```text
FactoryData          —— 出厂时写入的设备基础数据
MobileActivation     —— 设备激活信息，与 Apple ID 及 iCloud 相关
ProductDocuments     —— 产品文档与认证资料
dramecc              —— DRAM ECC（纠错码）状态记录
recoverylogd         —— 恢复流程日志
srvo                 —— 未公开用途的硬件服务数据
```

这些数据属于设备的”出厂固有属性”，在正常使用过程中不会被修改，但在设备激活、硬件更换或特定维修场景下可能会被系统读取或更新。

## Simulator Runtime

macOS 上的 iOS/iPadOS 模拟器并非单纯的软件层，其运行时（Runtime）以独立 APFS 卷的形式挂载，本机上存在两套不同的运行时机制，体现了 Apple 正在推进的架构演进。

### 传统 Runtime

```text
disk5s1
```

挂载：

```text
/Library/Developer/CoreSimulator/Volumes/iOS_23E254a
```

对应：

```text
iOS 26.4.1 Simulator
```

这是传统的模拟器运行时挂载方式：每个 iOS 版本的运行时作为一个独立的 APFS 卷存在，以只读方式挂载到 `/Library/Developer/CoreSimulator/Volumes/` 下对应的路径。

### Cryptex Runtime

```text
disk7s1
```

挂载：

```text
/private/var/run/com.apple.security.cryptexd/mnt/...
```

对应：

```text
iOS 27.0 Simulator
```

新版模拟器运行时开始采用：Cryptex 机制进行动态挂载。Cryptex 是 Apple 在 macOS Monterey 和 iOS 15 中引入的安全容器格式，最初用于 macOS 安全更新（Rapid Security Response），现已扩展到模拟器运行时的分发与挂载场景，具备更灵活的签名验证与按需加载能力。这一转变意味着未来的 Simulator Runtime 将统一走 Cryptex 通道，而非传统的静态卷挂载模式。

## APFS 加密用户

APFS 支持多用户加密（Multi-User Encryption），其用户模型与 macOS 的登录账户体系并不一致，理解这一点对于正确使用 FileVault 至关重要。

验证：

```bash
diskutil apfs listUsers /
```

结果：

```text
Local Open Directory User
Volume Owner: Yes

Personal Recovery User
Volume Owner: Yes
```

这里需要强调：**APFS 用户并不等于 macOS 登录用户。**

APFS 用户是持有卷加密密钥（Volume Encryption Key, VEK）解锁权限的实体。当前卷上存在两个 Owner 级别的 APFS 用户：

**Local Open Directory User**：代表本地 macOS 账户的加密密钥持有者，当用户输入登录密码时，该用户对应的密钥保护器（Key Protector）会被解锁，进而解密整个卷。

**Personal Recovery User**：用于以下场景：

- 当用户忘记 FileVault 密码时，通过个人恢复密钥（Personal Recovery Key）解锁卷
- 在 Recovery 环境下进行身份认证
- 配合 Apple ID 实现 iCloud 托管的恢复流程

## 完整启动链

将上述所有组件串联起来，macOS Apple Silicon 的完整启动链如下所示。每个环节都是前一个环节的信任基础，任何一处校验失败都会中断整个启动流程：

```text
Boot ROM
    │  （固化在 SoC 中，Apple 签名，不可修改）
    ▼
LLB
    │  （Low-Level Bootloader，第一级引导程序）
    ▼
iBoot
    │  （第二级引导程序，负责验证后续组件）
    ▼
iSCPreboot
    │
    └── LocalPolicy
            （读取并应用启动策略：安全级别、外部启动权限等）
    │
    ▼
xART
    │
    └── Trust Cache
        Boot Artifacts
        （验证后续加载组件的签名合法性）
    │
    ▼
disk3s1
(System Volume)
    │
    ▼
Signed Snapshot
(disk3s1s1)
    │  （验证 SSV 签名，校验 Hash Tree 完整性）
    ▼
Namespace Union
    │
    ├── System Snapshot    （只读，来自 disk3s1s1）
    └── Data Volume        （读写，来自 disk3s5）
    │
    ▼
最终根目录 /
```

## 最终结论

通过以上对各个组件的逐一分析，可以得出一个清晰的结论：

现代 Apple Silicon macOS 的 `/` 并不是单一文件系统，而是由以下组件共同构建的逻辑视图：

```text
Boot Policy
(iSCPreboot)
        +
Secure Boot Artifacts
(xART)
        +
Signed System Snapshot
(disk3s1s1)
        +
Root Data Volume
(disk3s5)
        +
Firmlink Namespace
        +
Symlink Layer
        +
Autofs
        │
        ▼
最终用户看到的 /
```

从系统实现角度来看，macOS 根目录实际上是一个由 **APFS Snapshot、Volume Group、Firmlink、Secure Boot 和 Namespace Union** 共同组成的逻辑文件系统视图，而非传统意义上的单一磁盘分区。

这一设计的核心价值在于：它在不牺牲用户体验的前提下，实现了系统文件的加密签名保护、用户数据的读写灵活性、以及从固件到操作系统的完整信任链——三者在同一个看似普通的 `/` 背后和谐共存，这正是 Apple Silicon 安全架构最精妙的地方之一。

---

- **文档版本：** v1.0
- **分析对象：** MacBook Pro 14（macOS Golden Gate 27.0 beta 1）
- **分析方式：** 实机验证（`diskutil`、`mount`、`firmlink`、`snapshot`、APFS Volume Group、Simulator Runtime）
