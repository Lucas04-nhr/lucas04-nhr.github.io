---
layout: post
title: Database Online Job Initiation
date: 20240424
category: "Database"
tags: [Database, OJ]
author: Lucas
comment: true
mathjax: true
published: true
---

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

```bash
lsnrctl start
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
Then, run the following command.

```bash
perl -p -i.bak -e 's#__SUB__CWD__#'$(pwd)'#g' *.sql */*.sql */*.dat

```

After that, you can run the following command to initialize the database in the database console.

```sql
@/opt/app/db-sample-schemas-21.1/human_resources/hr_main.sql
```
```bash
specify password for HR as parameter 1:
输入 1 的值:  HR

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

not spooling currently
```