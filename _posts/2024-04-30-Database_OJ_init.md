---
layout: post
title: Database Online Job Initiation
date: 20240430
category: "Database"
tags: [Database, OJ]
author: Lucas
comment: true
mathjax: true
published: true
---

> Under maintainance

## Start the system

Log into the CentOS 7.

## Change the IP address

```bash
cd /opt/app/admin/product/21.3.000/db_home/network/admin
vim tnsnames.ora
vim listener.ora
```
Change the IP address to the current one.

## Start the listener

You can see the listener status by running the following command.
```bash
lsnrctl status
```
```bash
LSNRCTL for Linux: Version 21.0.0.0.0 - Production on 30-4月 -2024 19:55:30

Copyright (c) 1991, 2021, Oracle.  All rights reserved.

正在连接到 (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=210.42.105.18)(PORT=1521)))
TNS-12541: TNS: 无监听程序
 TNS-12560: TNS: 协议适配器错误
  TNS-00511: 无监听程序
   Linux Error: 111: Connection refused
正在连接到 (DESCRIPTION=(ADDRESS=(PROTOCOL=IPC)(KEY=EXTPROC1521)))
TNS-12541: TNS: 无监听程序
 TNS-12560: TNS: 协议适配器错误
  TNS-00511: 无监听程序
   Linux Error: 111: Connection refused
```

Then, you can start the listener by running the following command.

```bash
lsnrctl start
```

```bash
LSNRCTL for Linux: Version 21.0.0.0.0 - Production on 30-4月 -2024 19:55:35

Copyright (c) 1991, 2021, Oracle.  All rights reserved.

启动/opt/app/admin/product/21.3.000/db_home//bin/tnslsnr: 请稍候...

TNSLSNR for Linux: Version 21.0.0.0.0 - Production
系统参数文件为/opt/app/admin/product/21.3.000/db_home//network/admin/listener.ora
写入/opt/app/admin/diag/tnslsnr/A201-2-7/listener/alert/log.xml的日志信息
监听: (DESCRIPTION=(ADDRESS=(PROTOCOL=tcp)(HOST=210.42.105.18)(PORT=1521)))
监听: (DESCRIPTION=(ADDRESS=(PROTOCOL=ipc)(KEY=EXTPROC1521)))

正在连接到 (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=210.42.105.18)(PORT=1521)))
LISTENER 的 STATUS
------------------------
别名                      LISTENER
版本                      TNSLSNR for Linux: Version 21.0.0.0.0 - Production
启动日期                  30-4月 -2024 19:55:37
正常运行时间              0 天 0 小时 0 分 0 秒
跟踪级别                  off
安全性                    ON: Local OS Authentication
SNMP                      OFF
监听程序参数文件          /opt/app/admin/product/21.3.000/db_home//network/admin/listener.ora
监听程序日志文件          /opt/app/admin/diag/tnslsnr/A201-2-7/listener/alert/log.xml
监听端点概要...
  (DESCRIPTION=(ADDRESS=(PROTOCOL=tcp)(HOST=210.42.105.18)(PORT=1521)))
  (DESCRIPTION=(ADDRESS=(PROTOCOL=ipc)(KEY=EXTPROC1521)))
服务摘要..
服务 "drugdb" 包含 1 个实例。
  实例 "drugdb", 状态 UNKNOWN, 包含此服务的 5 个处理程序...
服务 "pdbdrugdb" 包含 1 个实例。
  实例 "drugdb", 状态 UNKNOWN, 包含此服务的 5 个处理程序...
命令执行成功
```

## Start the database

```bash
sqlplus / as sysdba
```

In the database console, start the database.

```sql
startup
```
```bash
ORACLE 例程已经启动。

Total System Global Area 4932500048 bytes
Fixed Size                  9697872 bytes
Variable Size             956301312 bytes
Database Buffers         3959422976 bytes
Redo Buffers                7077888 bytes
数据库装载完毕。
数据库已经打开。
```

## Show the purgeable database

```sql
show pdbs
```
```bash
    CON_ID CON_NAME                       OPEN MODE  RESTRICTED
---------- ------------------------------ ---------- ----------
         2 PDB$SEED                       READ ONLY  NO
         3 PDBDRUGDB                      MOUNTED
```

## Open the purgeable database

```sql
alter pluggable database PDBDRUGDB open;
```
```bash
插接式数据库已变更。
```
You can see the status of the database by running the following command.

```sql
show pdbs
```
```bash
    CON_ID CON_NAME                       OPEN MODE  RESTRICTED
---------- ------------------------------ ---------- ----------
         2 PDB$SEED                       READ ONLY  NO
         3 PDBDRUGDB                      READ WRITE NO
```

## Change session

```sql
alter session set "_ORACLE_SCRIPT"=true;
```
```bash
会话已更改。
```

## Set the container

```sql
alter session set container=PDBDRUGDB;
```
```bash
会话已更改。
```

## Initialize the purgable database

Using perl to initialize the database outside the database console.


You should go to the directory where the database initialization files 'db-sample-schemas-21.1' are located.
In this article, the location is '/opt/app/db-sample-schemas-21.1'.

You can download and unzip the database initialization files from the following script.

Strongly recommend you to download the files right after you change the listener IP address.

### If you can access github.com
```bash
wget -c https://raw.githubusercontent.com/Lucas04-nhr/database-instruction/main/db-sample-schemas-21.1.tar.gz -P /opt/app
tar -xvf /opt/app/db-sample-schemas-21.1.tar.gz -C /opt/app
```

### If you can't access github.com
```bash
#! /bin/bash
wget -c https://mirror.ghproxy.com/?q=https%3A%2F%2Fgithub.com%2FLucas04-nhr%2Fdatabase-instruction%2Fblob%2Fmain%2Fdb-sample-schemas-21.1.tar.gz -O /opt/app/db-sample-schemas-21.1.tar.gz
tar -xvf /opt/app/db-sample-schemas-21.1.tar.gz -C /opt/app
```

Then, run the following command in the `db-sample-schemas-21.1` directory.

```bash
cd /opt/app/db-sample-schemas-21.1
perl -p -i.bak -e 's#__SUB__CWD__#'$(pwd)'#g' *.sql */*.sql */*.dat

```

After that, you can run the following command to initialize the database in the database console.

> Due to the change of the properties of the database, you should reconnect to the database or the user 'SYS'.
> You can quit the current database console by running the command `quit` and re-login to the database by running the command `sqlplus / as sysdba` or directly reconnect to the database by running the command `conn / as sysdba`

Then execute the following command in the database console.

```sql
@/opt/app/db-sample-schemas-21.1/human_resources/hr_main.sql 
```

```bash
specify password for HR as parameter 1:
输入 1 的值:  wtsgyh2024

specify default tablespeace for HR as parameter 2:
输入 2 的值:  USERS

specify temporary tablespace for HR as parameter 3:
输入 3 的值:  TEMP

specify password for SYS as parameter 4:
输入 4 的值:  wtsgyh2024

specify log path as parameter 5:
输入 5 的值:  /opt/app/oracle/product/21.3.000/db_home/demo/schema/log/

specify connect string as parameter 6:
输入 6 的值:  PDBDURGDB
```

After some time, the database will be initialized.

```bash
Comment created.


Commit complete.


PL/SQL procedure successfully completed.
```
You may failed to connect to the database "pdbuserConnecttest" due to password error. You can change the password by running the following command in sqlplus.

```sql
alter user HR identified by wtsgyh2024;
```