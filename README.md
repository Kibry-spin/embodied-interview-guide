# Embodied AI Interview Guide

面向具身智能算法、VLA、模仿学习、触觉与机器人系统岗位的个人复习网站。内容按照真实端到端链路组织：

**任务与证据 → 传感器与数据 → 表示与融合 → 动作策略 → 实时执行 → 真机评测**

## 在线阅读

- [统一 Main 页面](https://kibry-spin.github.io/embodied-interview-guide/)
- [面试官视角：Action、架构、真机 Debug 与本体迁移](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/interviewer-view.html)
- [简历项目与端到端系统](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/resume-end-to-end.html)
- [VLA 系统架构](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/vla-interview.html)
- [WAM 世界动作模型与 LaWAM](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/wam.html)
- [LeRobot 数据、UMI 对齐与一二面串讲](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/lerobot-data.html)
- [机器人触觉](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/tactile-interview.html)
- [ACT 模仿学习](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/act.html)
- [DiT：Transformer × Diffusion / Flow](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/dit.html)
- [RTC 实时动作分块](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/rtc.html)

DiTFlow 的架构、训练公式、张量、采样、动作队列、源码地图、配置、工程审视与面试问答已经完整并入 Main 页面，不再维护独立专题页。旧地址会自动跳转到 Main 的 DiTFlow 章节。

## 统一内容结构

### 1. 基础与手撕

- Attention：Self/Cross Attention、MHA/GQA/MQA、Mask、位置编码与 KV Cache
- Transformer：Encoder–Decoder、BN/LN/RMSNorm、分布式训练与多模态融合
- Loss：CE、MSE、Flow Matching、Action Chunk 与 Temporal Ensemble
- 强化学习与算法题：DQN、Double DQN、SAC、BFS、DFS、DP

### 2. 动作策略

- ACT：CVAE、DETR Action Query、Masked L1+KL 与动作队列
- DiTFlow：LeRobot 条件编码、Flow velocity、Euler sampling 与真机执行
- DiT：adaLN-Zero、DDPM 参数化、Action DiT 与 Flow Matching
- RTC：异步推理、action inpainting 与训练时 prefix conditioning

### 3. VLA 与多模态

- VLA 架构、动作生成、微调与后训练、智元一面复盘、鲁棒性、评测及部署安全
- WAM、World Model、LaWAM、DreamZero 与 VLA 对比
- π 系列模型演进
- WALL-OSS-0.5 的 MoT、Gradient Bridge、RVQ 与跨本体数据
- AT-VLA 的触觉门控、Adaptive Query 与快慢双流

### 4. 工程与项目

- 面试官视角的问题树：Action Contract、Condition 信息流、架构边界、快慢系统接口、真机分层排障与新本体迁移
- QTac、无本体数采、双臂遥操作、G3 触觉与硬件复现
- LeRobot Dataset v2.1/v3.0 的目录、metadata、episode/file 组织差异、迁移检查与时间窗口
- UMI 到真机的频率与延迟对齐、任务空间轨迹、IK/可视化验收和失败数据利用
- 触觉传感器分类、选型、标定、数据流、融合与故障诊断
- LeRobot 数据组织、时序同步、动作语义、部署评测与证据边界

## 推荐复习路线

1. **端到端策略：** Transformer → ACT → Main/DiTFlow → RTC
2. **VLA / WAM 模型：** VLA → WAM / π 系列 → WALL → DiT / RTC
3. **触觉具身：** 触觉 → AT-VLA → QTac / DiTFlow → RTC
4. **手撕冲刺：** Attention → Loss → RL → 算法题

## 本地运行

在仓库根目录执行：

```bash
python -m http.server 8000
```

浏览器访问 `http://localhost:8000`。同一局域网内的手机可以通过 `http://电脑局域网IP:8000` 访问。

## 说明

本仓库用于个人面试复习与技术交流。论文结论、模型参数和代码行为以对应的一手论文、官方仓库及锁定提交为准；页面会明确区分论文事实、源码事实、工程解释与个人项目证据。
