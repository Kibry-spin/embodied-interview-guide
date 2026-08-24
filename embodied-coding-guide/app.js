(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const currentPage = location.pathname.split("/").pop() || "index.html";
  const navGroups = [
    {
      label: "基础",
      pages: ["attention.html", "transformer.html", "vla-loss.html"],
      links: [
      ["attention.html", "Attention", "QKV、MHA/GQA、Mask 与 KV Cache"],
      ["transformer.html", "Transformer", "Norm、完整手写与分布式训练"],
        ["vla-loss.html", "Loss", "CE、MSE、Flow 与 Action Chunk"],
      ],
    },
    {
      label: "策略",
      pages: ["act.html", "dit.html"],
      links: [
        ["act.html", "ACT", "CVAE、Action Query、Temporal Ensemble"],
        ["dit.html", "DiT", "Transformer × Diffusion / Flow"],
        ["index.html#ditflow", "DiTFlow", "完整源码主线（已并入 Main）"],
      ],
    },
    {
      label: "VLA",
      pages: ["vla-interview.html", "wam.html", "pi-series.html", "wall-oss.html", "at-vla.html"],
      links: [
      ["vla-interview.html", "VLA 总览", "架构、智元面经、评测与部署"],
        ["wam.html", "WAM", "未来世界建模、LaWAM 与 VLA 对比"],
        ["pi-series.html", "π 系列", "Flow Action Expert 演进"],
        ["wall-oss.html", "WALL", "Gradient Bridge 与跨本体"],
        ["at-vla.html", "AT-VLA", "触觉门控与快慢双流"],
      ],
    },
    {
      label: "系统",
      pages: ["interviewer-view.html", "resume-end-to-end.html", "lerobot-data.html", "tactile-interview.html", "rtc.html"],
      links: [
        ["interviewer-view.html", "面试官视角", "Action、架构、Debug 与本体迁移"],
        ["resume-end-to-end.html", "项目主线", "数据—训练—部署闭环"],
        ["lerobot-data.html", "LeRobot 数据", "v2.1/v3、UMI 对齐与失败数据"],
        ["tactile-interview.html", "触觉", "传感器、数据流与策略融合"],
        ["rtc.html", "RTC", "异步推理与动作衔接"],
      ],
    },
    {
      label: "训练",
      pages: ["rl.html", "leetcode.html"],
      links: [
        ["rl.html", "强化学习", "DQN、SAC 与重参数化"],
        ["leetcode.html", "算法题", "BFS、DFS、DP"],
      ],
    },
  ];

  const topnav = $(".topnav");
  if (topnav) {
    const mainActive = currentPage === "index.html" ? " active" : "";
    topnav.innerHTML = `<a class="nav-main${mainActive}" href="index.html">Main</a>${navGroups.map(group => {
      const active = group.pages.includes(currentPage) ? " active" : "";
      const menu = group.links.map(([href, title, note]) => `<a href="${href}"><strong>${title}</strong><small>${note}</small></a>`).join("");
      return `<span class="nav-cluster"><button class="nav-cluster-button${active}" type="button" aria-haspopup="true">${group.label}<i>⌄</i></button><span class="nav-menu">${menu}</span></span>`;
    }).join("")}`;
  }

  const relatedMap = {
    "interviewer-view.html": [
      ["resume-end-to-end.html", "项目证据", "用 QTac、遥操作和触觉部署经历回答系统问题。"],
      ["lerobot-data.html", "数据契约", "继续拆解 episode、时间同步、失败数据与动作语义。"],
      ["pi-series.html", "架构深挖", "对照 π₀、π₀.₅ 的 VLM 与 Action Expert 信息流。"],
      ["wam.html", "路线比较", "区分直接动作策略与预测未来后再规划。"],
    ],
    "resume-end-to-end.html": [
      ["tactile-interview.html", "感知层", "用触觉页补全传感器选型、标定与融合。"],
      ["lerobot-data.html", "数据层", "把 LeRobot v2.1/v3、UMI 对齐和失败数据讲完整。"],
      ["rtc.html", "部署层", "把动作队列继续升级为异步闭环执行。"],
      ["interviewer-view.html", "面试判断", "把项目经历转换成 Action、Debug 与迁移证据。"],
    ],
    "lerobot-data.html": [
      ["resume-end-to-end.html", "项目证据", "把通用数据知识落回 QTac、数采和遥操作经历。"],
      ["tactile-interview.html", "高频模态", "继续理解触觉采样、同步、标定和质量检查。"],
      ["vla-loss.html", "训练目标", "看 action window 怎样进入 CE、MSE 与 Flow loss。"],
      ["pi-series.html", "大模型训练", "继续深挖 π₀.₅ 的数据配方与 Action Expert。"],
    ],
    "vla-interview.html": [
      ["wam.html", "预测式策略", "比较直接 observation-to-action 与未来世界建模。"],
      ["wall-oss.html", "训练机制", "理解语义模型与连续动作的梯度桥。"],
      ["at-vla.html", "触觉 VLA", "观察高频触觉如何进入慢速 VLA。"],
      ["index.html#ditflow", "代码落地", "在 Main 中对照一个完整 LeRobot 生成策略。"],
    ],
    "wam.html": [
      ["vla-interview.html", "对照基线", "回到 VLA 的语义主干、融合与 Action Expert。"],
      ["dit.html", "生成基础", "理解视频 DiT、Action DiT 与 Flow Matching。"],
      ["rtc.html", "实时执行", "把高延迟 world-action policy 接入异步闭环。"],
      ["tactile-interview.html", "接触拓展", "从当前触觉输入继续理解未来接触与滑移预测。"],
    ],
    "tactile-interview.html": [
      ["at-vla.html", "模型融合", "从传感原理继续学习触觉门控与双流。"],
      ["index.html#ditflow", "生成策略", "把触觉编码为 DiTFlow 的全局条件。"],
      ["rtc.html", "实时闭环", "接触事件发生后如何及时修改动作块。"],
      ["resume-end-to-end.html", "项目表达", "把硬件、数据和模型组织成简历证据。"],
    ],
    "at-vla.html": [
      ["tactile-interview.html", "输入基础", "回到触觉信号、标定与时序同步。"],
      ["vla-interview.html", "VLA 骨架", "明确图像、语言、本体与动作的公共框架。"],
      ["rtc.html", "快慢系统", "比较双流反应与异步动作生成的边界。"],
      ["index.html#ditflow", "参考实现", "用更小的 DiTFlow 验证触觉条件链路。"],
    ],
    "rtc.html": [
      ["act.html", "动作分块起点", "先理解同步 Action Chunk 与时序集成。"],
      ["index.html#ditflow", "生成式 Chunk", "对应 ODE 生成、动作队列与执行 horizon。"],
      ["pi-series.html", "大模型动作头", "理解 RTC 为什么对 Flow VLA 尤其重要。"],
      ["tactile-interview.html", "事件反馈", "触觉变化是缩短闭环延迟的典型动机。"],
    ],
    "wall-oss.html": [
      ["pi-series.html", "路线对照", "比较 π 系列与 WALL 的动作学习设计。"],
      ["dit.html", "连续生成", "补全条件 Transformer 与 Flow velocity。"],
      ["vla-interview.html", "系统定位", "把模型机制放回 VLA 全景。"],
      ["index.html#ditflow", "最小实现", "用小型策略看清 Flow 的训练和采样。"],
    ],
    "pi-series.html": [
      ["vla-interview.html", "总体框架", "先确定 VLM、融合和动作空间的位置。"],
      ["dit.html", "Action Expert", "理解 Transformer 如何参数化条件速度场。"],
      ["wall-oss.html", "同类路线", "比较离散语义与连续控制如何协同。"],
      ["rtc.html", "实时执行", "把 action chunk 生成接入在线闭环。"],
    ],
    "attention.html": [
      ["transformer.html", "下一层", "把 QKV 拼成完整 Encoder–Decoder。"],
      ["dit.html", "生成模型", "看 Self-Attention 如何处理带噪动作 token。"],
      ["act.html", "模仿学习", "看 Action Query 如何 Cross-Attend 观测。"],
      ["vla-interview.html", "多模态", "把 Self/Cross Attention 放入 VLA 融合。"],
    ],
    "transformer.html": [
      ["attention.html", "前置基础", "复习 QKV、Mask 与位置编码。"],
      ["act.html", "序列回归", "DETR Query 并行预测未来动作。"],
      ["dit.html", "条件生成", "从普通 Block 过渡到 adaLN-Zero。"],
      ["vla-interview.html", "多模态骨架", "理解 Encoder、Decoder 在 VLA 中的变体。"],
    ],
    "act.html": [
      ["transformer.html", "架构前置", "回看 Encoder–Decoder 与 Query 的来源。"],
      ["index.html#ditflow", "生成式替代", "比较 L1+KL 与 Flow velocity。"],
      ["rtc.html", "实时升级", "从同步 chunk 走向异步前缀续写。"],
      ["vla-loss.html", "代码练习", "手写 Action Chunk 与 Temporal Ensemble。"],
    ],
    "dit.html": [
      ["transformer.html", "网络骨架", "复习 Self-Attention、FFN 与残差。"],
      ["index.html#ditflow", "源码落地", "把 xₜ、t、condition 和 velocity 对回代码。"],
      ["vla-loss.html", "目标函数", "区分 ε、diffusion-v 与 Flow velocity。"],
      ["wall-oss.html", "大模型应用", "观察连续 Action Expert 如何桥接 VLM。"],
    ],
    "vla-loss.html": [
      ["act.html", "直接回归", "理解 L1+KL 的 action chunk 策略。"],
      ["dit.html", "网络实现", "理解 DiT 如何参数化去噪或速度场。"],
      ["index.html#ditflow", "完整闭环", "从 loss 一直看到 Euler 与动作队列。"],
      ["rl.html", "目标构造", "继续练习 target、detach 与期望。"],
    ],
    "rl.html": [
      ["vla-loss.html", "监督目标", "对照生成式策略与 TD target。"],
      ["pi-series.html", "VLA + RL", "理解大模型策略怎样从经验继续学习。"],
      ["leetcode.html", "手撕训练", "补齐基础数据结构与动态规划。"],
    ],
    "leetcode.html": [
      ["attention.html", "深度学习手撕", "从算法模板切回张量实现。"],
      ["rl.html", "强化学习手撕", "练 gather、no_grad 与采样。"],
      ["index.html#review-routes", "复习计划", "回 Main 选择下一条训练路线。"],
    ],
  };

  const relatedItems = relatedMap[currentPage];
  const footer = $("main > .footer");
  if (relatedItems && footer) {
    const section = document.createElement("section");
    section.className = "section related-section reveal visible";
    section.innerHTML = `<div class="section-heading split-heading"><div><p class="section-index">CONNECTIONS · 融会贯通</p><h2>这一页要和什么一起学</h2></div><p>按“前置概念—相邻方法—工程落地”建立关联，而不是孤立背术语。</p></div><div class="related-grid">${relatedItems.map(([href, tag, text]) => `<a href="${href}"><span>${tag}</span><strong>${href.includes("#ditflow") ? "DiTFlow 主线" : href.replace(".html", "")}</strong><p>${text}</p><i>关联学习 →</i></a>`).join("")}</div>`;
    footer.before(section);
  }

  const progress = $("#scroll-progress-bar");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  };
  addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }), { threshold: .08 })
    : null;
  $$(".reveal").forEach(el => observer ? observer.observe(el) : el.classList.add("visible"));

  const sections = $$("main section[id]");
  const sideLinks = $$(".side-nav a");
  if (sections.length && sideLinks.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(entries => {
      const active = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      sideLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${active.target.id}`));
    }, { rootMargin: "-20% 0px -65%", threshold: [0, .2, .6] });
    sections.forEach(section => navObserver.observe(section));
  }

  const focusToggle = $("#focus-toggle");
  focusToggle?.addEventListener("click", () => {
    const enabled = document.body.classList.toggle("focus-mode");
    focusToggle.setAttribute("aria-pressed", String(enabled));
    focusToggle.textContent = enabled ? "退出专注" : "专注阅读";
  });

  $$('[data-copy]').forEach(button => button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);
    if (!target) return;
    const content = target.innerText;
    try {
      await navigator.clipboard.writeText(content);
      const old = button.textContent;
      button.textContent = "已复制";
      setTimeout(() => button.textContent = old, 1200);
    } catch (_) {
      button.textContent = "请手动复制";
    }
  }));

  $$("[data-tabs]").forEach(group => {
    const buttons = $$("[data-tab]", group);
    const panels = $$("[data-panel]", group);
    buttons.forEach(button => button.addEventListener("click", () => {
      const key = button.dataset.tab;
      buttons.forEach(item => item.classList.toggle("active", item === button));
      panels.forEach(panel => panel.classList.toggle("active", panel.dataset.panel === key));
    }));
  });

  $$('[data-reveal]').forEach(button => button.addEventListener("click", () => {
    const solution = document.getElementById(button.dataset.reveal);
    if (!solution) return;
    button.dataset.showLabel ||= button.textContent.trim();
    const visible = solution.classList.toggle("visible");
    button.textContent = visible ? (button.dataset.hideLabel || "隐藏参考实现") : button.dataset.showLabel;
  }));

  $$(".quiz-item").forEach(item => {
    const answer = Number(item.dataset.answer);
    const buttons = $$(".quiz-options button", item);
    buttons.forEach((button, index) => button.addEventListener("click", () => {
      if (item.classList.contains("answered")) return;
      item.classList.add("answered");
      buttons[answer]?.classList.add("correct");
      if (index !== answer) button.classList.add("wrong");
      buttons.forEach(option => option.disabled = true);
    }));
  });

  const attentionCalc = $("#attention-calculator");
  const updateAttention = () => {
    if (!attentionCalc) return;
    const B = Math.max(1, Number($("#calc-b")?.value) || 1);
    const L = Math.max(1, Number($("#calc-l")?.value) || 1);
    const D = Math.max(1, Number($("#calc-d")?.value) || 1);
    const H = Math.max(1, Number($("#calc-h")?.value) || 1);
    const result = $("#attention-result");
    if (D % H !== 0) {
      result.innerHTML = `<strong style="color:var(--rose)">d_model 必须能被 head 数整除</strong>：${D} ÷ ${H} 不是整数。`;
      return;
    }
    const Dh = D / H;
    result.innerHTML = `<code>Q/K/V [${B}, ${H}, ${L}, ${Dh}]</code><code>scores [${B}, ${H}, ${L}, ${L}]</code><code>output [${B}, ${L}, ${D}]</code>`;
  };
  if (attentionCalc) {
    $$("input", attentionCalc).forEach(input => input.addEventListener("input", updateAttention));
    updateAttention();
  }

  const flowSlider = $("#flow-slider");
  const updateFlow = () => {
    if (!flowSlider) return;
    const t = Number(flowSlider.value) / 100;
    $("#flow-t").textContent = t.toFixed(2);
    $("#flow-noise-weight").textContent = (1 - t).toFixed(2);
    $("#flow-action-weight").textContent = t.toFixed(2);
    const marker = $("#flow-marker");
    if (marker) marker.style.left = `${t * 100}%`;
  };
  flowSlider?.addEventListener("input", updateFlow);
  updateFlow();

  const ensemble = $("#ensemble-calculator");
  const updateEnsemble = () => {
    if (!ensemble) return;
    const values = $$("[data-action]", ensemble).map(i => Number(i.value) || 0);
    const decay = Math.max(0, Number($("#ensemble-decay")?.value) || 0);
    const weights = values.map((_, i) => Math.exp(-decay * i));
    const sumW = weights.reduce((a, b) => a + b, 0);
    const result = values.reduce((sum, value, i) => sum + value * weights[i], 0) / sumW;
    $("#ensemble-result").innerHTML = `权重约为 <code>${weights.map(w => w.toFixed(2)).join(", ")}</code>，融合动作 = <strong>${result.toFixed(3)}</strong>`;
  };
  if (ensemble) {
    $$("input", ensemble).forEach(input => input.addEventListener("input", updateEnsemble));
    updateEnsemble();
  }

  const dqnDemo = $("#dqn-demo");
  if (dqnDemo) {
    const online = [2.1, 4.8, 4.2];
    const target = [2.4, 3.1, 4.5];
    const renderDqn = mode => {
      const action = mode === "double" ? online.indexOf(Math.max(...online)) : target.indexOf(Math.max(...target));
      const value = target[action];
      $("#dqn-choice").textContent = `a* = ${action}`;
      $("#dqn-value").textContent = `Q_target = ${value.toFixed(1)}`;
      $("#dqn-explain").textContent = mode === "double"
        ? "Online 网络选择动作 1，Target 网络只负责评价该动作，因此取 3.1。"
        : "Target 网络同时选择并评价，最大值位于动作 2，因此取 4.5。";
      $$("[data-dqn-mode]", dqnDemo).forEach(b => b.classList.toggle("active", b.dataset.dqnMode === mode));
    };
    $$("[data-dqn-mode]", dqnDemo).forEach(button => button.addEventListener("click", () => renderDqn(button.dataset.dqnMode)));
    renderDqn("dqn");
  }

  const traceButtons = $$("[data-trace-step]");
  traceButtons.forEach(button => button.addEventListener("click", () => {
    const group = button.closest("[data-trace]");
    if (!group) return;
    const index = button.dataset.traceStep;
    $$("[data-trace-step]", group).forEach(item => item.classList.toggle("active", item === button));
    $$("[data-trace-panel]", group).forEach(panel => panel.classList.toggle("active", panel.dataset.tracePanel === index));
  }));
})();
