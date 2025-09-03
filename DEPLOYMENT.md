# Google Cloud 部署指南

本指南将帮助您将HelloWorld响应式项目部署到Google Cloud的虚拟机实例上，并通过外部IP访问。

## 前提条件

- 已创建Google Cloud账户
- 已安装Google Cloud SDK（gcloud命令行工具）
- 已创建虚拟机实例

## 步骤1：配置防火墙规则

1. 登录到[Google Cloud Console](https://console.cloud.google.com/)
2. 导航到**VPC网络** > **防火墙规则**
3. 点击**创建防火墙规则**
4. 设置以下参数：
   - 名称：`allow-http-8080`
   - 目标：指定目标标签（或选择所有实例）
   - 来源IP范围：`0.0.0.0/0`
   - 协议和端口：选择**指定的TCP端口**，输入`8080`
5. 点击**创建**

## 步骤2：上传项目文件到虚拟机

### 使用gcloud scp命令

打开本地终端，执行以下命令将项目文件上传到虚拟机：

```bash
# 上传整个项目文件夹
gcloud compute scp --recurse ./HelloWorld [INSTANCE_NAME]:~/ --zone [ZONE]

# 示例
# gcloud compute scp --recurse ./HelloWorld my-instance:~/ --zone us-central1-a
```

### 或者使用git（如果项目已托管在Git仓库）

在虚拟机上执行：

```bash
# 安装git（如果尚未安装）
sudo apt-get update
sudo apt-get install git -y

# 克隆项目
git clone [YOUR_GIT_REPO_URL] HelloWorld
cd HelloWorld
```

## 步骤3：连接到虚拟机实例

```bash
gcloud compute ssh [INSTANCE_NAME] --zone [ZONE]

# 示例
# gcloud compute ssh my-instance --zone us-central1-a
```

## 步骤4：在虚拟机上安装Node.js

```bash
# 更新包索引
sudo apt-get update

# 安装Node.js（选择合适的版本）
# 方法1：使用NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 步骤5：启动应用

```bash
# 进入项目目录
cd HelloWorld

# 启动应用
npm start

# 如果需要在后台持续运行应用，可以使用nohup或pm2
# 方法1：使用nohup
nohup npm start > app.log 2>&1 &

# 方法2：使用pm2（推荐用于生产环境）
# 安装pm2
sudo npm install -g pm2
# 启动应用
pm run start:prod
# 设置开机自启动
pm run pm2:startup
```

## 步骤6：通过外部IP访问应用

1. **查找虚拟机的外部IP地址**：
   - 通过Google Cloud Console：
     - 登录到[Google Cloud Console](https://console.cloud.google.com/)
     - 导航到**Compute Engine** > **虚拟机实例**
     - 在实例列表中找到您的虚拟机
     - 在"外部IP"列中查找分配给您虚拟机的IP地址
   - 通过gcloud命令行：
     ```bash
     gcloud compute instances list --filter="name=[INSTANCE_NAME]"
     ```
     查看结果中的"EXTERNAL_IP"字段

2. 复制实例的**外部IP地址**
3. 在浏览器中访问：`http://[EXTERNAL_IP]:8080`，其中`[EXTERNAL_IP]`是您复制的外部IP地址

**重要提示**：默认情况下，Google Cloud为虚拟机分配的是临时外部IP，当虚拟机停止后再启动时，IP地址可能会改变。对于生产环境，建议将外部IP设置为静态IP。

## 常见问题排查

1. **无法访问应用**
   - 检查防火墙规则是否正确配置
   - 确认应用正在运行（使用`ps aux | grep http-server`检查进程）
   - 检查应用是否监听在0.0.0.0:8080（使用`netstat -tuln | grep 8080`检查）
   - 检查虚拟机是否分配了外部IP地址
   - 在虚拟机内部测试访问：`curl http://127.0.0.1:8080`

2. **应用运行但无法通过外部IP访问**
   - 确认虚拟机的外部IP是静态还是动态（静态IP更适合生产环境）
   - 检查网络标签是否正确关联到虚拟机实例
   - 确认防火墙规则中的目标标签与虚拟机的网络标签匹配
   - 检查Google Cloud Console中的VPC网络设置，确保网络配置正确
   - 运行命令`ip addr show`确认虚拟机的网络接口配置

3. **解决"Available on"显示内网IP的问题**
   - 应用显示`http://10.128.0.2:8080`是正常的，这是虚拟机的内网IP
   - 您需要使用Google Cloud Console中显示的**外部IP地址**来访问应用
   - 确保您在浏览器中输入的是`http://[EXTERNAL_IP]:8080`，其中`[EXTERNAL_IP]`是虚拟机的外部IP地址
   - 再次确认防火墙规则是否正确配置了8080端口

## 扩展说明

### 设置静态外部IP

对于生产环境，建议将临时外部IP转换为静态外部IP，这样即使虚拟机停止并重新启动，IP地址也不会改变。

**步骤如下**：

1. **通过Google Cloud Console设置**：
   - 登录到[Google Cloud Console](https://console.cloud.google.com/)
   - 导航到**VPC网络** > **外部IP地址**
   - 在列表中找到您虚拟机的临时外部IP
   - 点击该IP地址旁边的下拉菜单，选择**转换为静态**
   - 输入一个名称（例如：`hello-world-static-ip`）
   - 点击**保留**

2. **通过gcloud命令行设置**：
   ```bash
   # 保留当前的临时IP作为静态IP
   gcloud compute addresses create hello-world-static-ip --addresses [YOUR_CURRENT_IP] --region [REGION]
   
   # 示例
   # gcloud compute addresses create hello-world-static-ip --addresses 34.123.45.67 --region us-central1
   
   # 将静态IP关联到虚拟机
   gcloud compute instances add-access-config [INSTANCE_NAME] --address [STATIC_IP] --zone [ZONE]
   ```

### 其他生产环境建议

- 对于生产环境，建议使用Nginx作为反向代理
- 考虑使用PM2管理Node.js进程，提供自动重启和负载均衡功能
- 为了安全，建议在生产环境中配置HTTPS
- 定期备份您的应用数据和配置