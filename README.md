# Embodied AI Interview Guide

面向具身智能算法与机器人方向秋招面试的个人复习网页，内容以可视化讲解、对比表格、代码拆解和交互练习为主。

## 在线阅读

- [面试资料总目录](https://kibry-spin.github.io/embodied-interview-guide/)
- [机器人触觉传感与反馈](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/tactile-interview.html)
- [AT-VLA 论文与源码梳理](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/at-vla.html)
- [RTC 实时动作分块](https://kibry-spin.github.io/embodied-interview-guide/embodied-coding-guide/rtc.html)
- [DiTFlow 源码理解指南](https://kibry-spin.github.io/embodied-interview-guide/ditflow-interview-guide/)

## 内容结构

### 具身智能面试专题

- VLA 系统架构、数据与 Sim2Real
- π 系列模型演进
- 机器人触觉传感器、数据流与策略融合
- AT-VLA 触觉门控、快慢双流、源码路径与 G3 适配
- RTC 异步推理、动作 inpainting、训练时 prefix conditioning 与 LeRobot 部署
- Attention、Flow Matching 与常见 Loss
- DQN、Double DQN、SAC
- 高频算法题

### DiTFlow 源码专题

- 动作张量与时间步形状
- Flow Matching 训练目标
- Velocity Network 与条件输入
- 训练及采样过程

## 本地运行

在仓库根目录执行：

```bash
python -m http.server 8000
```

浏览器访问 `http://localhost:8000`。同一局域网内的手机可以通过 `http://电脑局域网IP:8000` 访问。

## 说明

本仓库用于个人面试复习与技术交流。模型和硬件参数以相应论文、官方项目页及开源仓库为准。
