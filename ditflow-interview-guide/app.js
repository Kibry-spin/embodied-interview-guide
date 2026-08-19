(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`ditflow-guide:${key}`);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(`ditflow-guide:${key}`, JSON.stringify(value)); } catch (_) {}
    }
  };

  const state = {
    knownCards: new Set(storage.get("knownCards", [])),
    checks: new Set(storage.get("checks", [])),
    quizBest: storage.get("quizBest", 0),
    cardIndex: 0,
    quizIndex: 0,
    quizScore: 0,
    quizLocked: false
  };

  const flashcards = [
    { q: "DiTFlow 训练时构造的中间状态 xₜ 是什么？", a: "xₜ = (1−t)ε + ta；t=0 对应高斯噪声，t=1 对应真实动作轨迹。" },
    { q: "速度场的监督目标为什么是 a−ε？", a: "因为线性插值路径对 t 求导：d[(1−t)ε+ta]/dt = a−ε。" },
    { q: "推理时如何从噪声得到动作？", a: "从 ε 出发，以 vθ(x,t,c) 为导数，用 Euler 法从 t=0 积分到 t=1。" },
    { q: "观测条件 c 包含什么？", a: "最近 S 帧的机器人状态、编码后的多相机视觉特征，以及可选环境状态；拼接后跨时间展平。" },
    { q: "DiT 中谁是 token，条件怎样注入？", a: "每个动作时间步是 token；流时间 t 与观测条件 c 通过 AdaLN 的 shift、scale、gate 调制 block。" },
    { q: "默认 horizon=16、n_obs_steps=2 时，当前动作从哪个索引开始？", a: "从索引 n_obs_steps−1=1 开始；默认切片 [1:9]，执行 8 步。" },
    { q: "select_action 什么时候重新调用 Flow 模型？", a: "只有 action deque 为空时；否则持续弹出上一次生成的动作，同时更新观测队列。" },
    { q: "默认动作为什么要归一化到约 [−1,1]？", a: "采样过程每个 Euler 步默认都会裁剪到 ±1；后处理器再把动作反归一化回真实量纲。" },
    { q: "Flow Matching 与典型 DDPM 路线的一句话区别？", a: "本实现回归噪声到动作路径的速度并求解 ODE；典型 DDPM 常预测噪声/score 并执行反向去噪。" },
    { q: "加入触觉时，最关键的三个工程点是什么？", a: "扩展触觉特征编码与 global conditioning、在 processor 中配置归一化、保证触觉与视觉/动作时间对齐。" },
    { q: "为什么多模态融合不能只理解为 torch.cat？", a: "拼接只是最后一步；此前还要解决各模态编码方式、采样频率、时间同步、缺帧和数值尺度统一。" },
    { q: "生成式策略相对单点 MSE 回归的价值是什么？", a: "它学习条件动作分布，可用不同噪声表达同一场景下多种合理动作模式，避免把多种行为简单平均。" },
    { q: "Action Chunk 的核心收益与核心代价分别是什么？", a: "收益是联合建模时序并降低推理频率；代价是块内反馈滞后，执行越长越接近开环。" },
    { q: "为什么动作 token 需要位置编码？", a: "Self-Attention 本身不包含先后顺序；可学习位置编码用于区分动作块中的不同时间位置。" }
  ];

  const quiz = [
    {
      q: "本仓库的网络在训练时直接回归什么？",
      options: ["真实动作 a", "高斯噪声 ε", "速度 a−ε", "离散动作类别"],
      answer: 2,
      note: "线性路径 xₜ=(1−t)ε+ta 的导数是 a−ε。"
    },
    {
      q: "默认设置下，模型一次生成 16 步后实际入队多少步？",
      options: ["2 步", "8 步", "15 步", "16 步"],
      answer: 1,
      note: "n_action_steps=8，从当前时刻对应的索引开始切片。"
    },
    {
      q: "观测条件在 DiT block 中主要怎样注入？",
      options: ["拼成额外 action token", "作为 cross-attention 的 KV", "通过 AdaLN shift/scale/gate 调制", "只在输出层相加"],
      answer: 2,
      note: "源码把 condition 与 time embedding 相加，再生成调制与门控参数。"
    },
    {
      q: "推理采样的更新式是哪一个？",
      options: ["x ← x − ε", "x ← x + Δt·vθ(x,t,c)", "x ← softmax(x)", "x ← a + tε"],
      answer: 1,
      note: "_DiTNoiseNet.sample 使用显式 Euler 积分。"
    },
    {
      q: "动作队列尚未耗尽时，select_action 会怎样？",
      options: ["每一步都重新采样", "继续弹出缓存动作并更新观测队列", "停止更新观测", "将旧动作与新动作平均"],
      answer: 1,
      note: "只有 deque 为空时才生成新动作块。"
    },
    {
      q: "下面哪项最准确地描述这个仓库？",
      options: ["完整机器人训练框架", "独立的视觉 backbone", "接入 LeRobot 的第三方 policy 插件", "机器人驱动 SDK"],
      answer: 2,
      note: "数据集、训练循环、factory 等主要由配套 LeRobot 提供。"
    },
    {
      q: "多模态条件构建中，下面哪项通常必须先于特征拼接？",
      options: ["把所有模态强制变成图像", "完成编码、时间对齐与尺度处理", "删除本体状态", "对动作做 softmax"],
      answer: 1,
      note: "多模态系统首先需要解决表示、同步与尺度，再谈 concat。"
    },
    {
      q: "把 n_action_steps 从 8 降到 1，最直接的影响是什么？",
      options: ["完全不再需要 ODE", "闭环反馈更频繁，但平均推理开销更高", "horizon 自动变为 1", "动作不再归一化"],
      answer: 1,
      note: "每执行一步就更快重新规划，但 ODE 模型调用频率也会显著上升。"
    }
  ];

  const coreSteps = [
    {
      title: "配置注册：让 LeRobot 认识 ditflow",
      file: "configuration_ditflow.py",
      purpose: "第三方包被发现并导入后，装饰器把字符串 policy type 映射到配置类。",
      input: "已安装并被自动导入的插件包",
      output: "\"ditflow\" → DiTFlowConfig",
      code: `@PreTrainedConfig.register_subclass("ditflow")
@dataclass
class DiTFlowConfig(PreTrainedConfig):
    n_obs_steps: int = 2
    horizon: int = 16
    n_action_steps: int = 8

    hidden_dim: int = 512
    num_blocks: int = 6
    num_heads: int = 16`,
      explanation: [
        "LeRobot 扫描名称以 lerobot_policy_ 开头的已安装包并导入。",
        "导入 __init__.py 时会继续导入 DiTFlowConfig，装饰器立即执行注册。",
        "训练配置里的 policy.type=\"ditflow\" 因而能实例化这个配置类。"
      ],
      interview: "这是插件式扩展，不需要把策略源码直接复制进 LeRobot 主仓库。"
    },
    {
      title: "时间索引：数据集怎样取历史观测和未来动作",
      file: "configuration_ditflow.py",
      purpose: "把 n_obs_steps 与 horizon 转换为相对当前样本时刻的数据窗口。",
      input: "当前数据索引 n；S=2，H=16",
      output: "obs=[n−1,n]；action=[n−1,…,n+14]",
      code: `@property
def observation_delta_indices(self):
    return list(range(1 - self.n_obs_steps, 1))

@property
def action_delta_indices(self):
    return list(range(
        1 - self.n_obs_steps,
        1 - self.n_obs_steps + self.horizon,
    ))

# defaults:
# observation: [-1, 0]
# action:      [-1, 0, 1, ..., 14]`,
      explanation: [
        "观测窗口以当前时刻 0 结尾，因此两帧观测是 [-1,0]。",
        "动作 horizon 从最早观测时刻 -1 开始，不是从当前时刻 0 开始。",
        "这解释了推理后为什么要跳过第一个历史动作，再从索引 S−1 开始执行。"
      ],
      interview: "horizon 的时间原点是第一帧观测，这是理解动作切片的关键。"
    },
    {
      title: "预后处理：统一 batch、设备与真实动作量纲",
      file: "processor_ditflow.py",
      purpose: "让训练数据和真实机器人输入都以模型期待的格式与尺度进入 policy。",
      input: "原始 observation / action + dataset stats",
      output: "归一化 batch；反归一化 CPU action",
      code: `input_steps = [
    RenameObservationsProcessorStep(rename_map={}),
    AddBatchDimensionProcessorStep(),
    DeviceProcessorStep(device=config.device),
    NormalizerProcessorStep(
        features={**config.input_features,
                  **config.output_features},
        norm_map=config.normalization_mapping,
        stats=dataset_stats,
    ),
]

output_steps = [
    UnnormalizerProcessorStep(...),
    DeviceProcessorStep(device="cpu"),
]`,
      explanation: [
        "推理单帧首先补 batch 维，并移动到训练设备。",
        "视觉默认 mean-std，状态和动作默认 min-max；统计量来自数据集。",
        "模型输出仍是归一化动作，必须反归一化后才能发送给真实控制器。"
      ],
      interview: "归一化不是外围细节：采样默认裁剪到 ±1，动作尺度错了会直接改变控制含义。"
    },
    {
      title: "多模态条件：图像、状态如何组成 c",
      file: "modeling_ditflow.py · _prepare_global_conditioning",
      purpose: "分别编码不同观测模态，再按相机和观测时间拼成一个全局条件向量。",
      input: "state [B,S,Ds]；images [B,S,N,C,H,W]",
      output: "global_cond [B,S×Dcond]",
      code: `batch_size, n_obs_steps = batch[OBS_STATE].shape[:2]
global_cond_feats = [batch[OBS_STATE]]

# 共享 RGB encoder：合并 B、S、N 后一次编码
images = einops.rearrange(
    batch[OBS_IMAGES], "b s n ... -> (b s n) ..."
)
img_features = self.rgb_encoder(images)
img_features = einops.rearrange(
    img_features, "(b s n) ... -> b s (n ...)",
    b=batch_size, s=n_obs_steps,
)
global_cond_feats.append(img_features)

if self.config.env_state_feature:
    global_cond_feats.append(batch[OBS_ENV_STATE])

return torch.cat(global_cond_feats, dim=-1).flatten(1)`,
      explanation: [
        "默认所有相机共享一个 RGB encoder，也可为每个相机配置独立 encoder。",
        "相机维 N 最终并入特征维，因此每个观测时刻得到一个融合特征。",
        "再把 S 个观测时刻展平，使 DiT 的每次速度预测都看到完整短历史。"
      ],
      interview: "本仓库采用 early/global conditioning：观测先融合成单个 c，再通过 AdaLN 调制动作 Transformer。"
    },
    {
      title: "DiT 前向：把动作轨迹变成 token 并预测速度",
      file: "modeling_ditflow.py · _DiTNoiseNet.forward",
      purpose: "将 x_t 的每个动作时间步投影成 token，用 Transformer 联合预测逐步速度。",
      input: "x_t [B,H,Da]；t [B]；c [B,Dc]",
      output: "pred velocity [B,H,Da]",
      code: `def forward(self, noisy_actions, time, global_cond):
    c = self.cond_proj(global_cond)      # [B, hidden]
    time_enc = self.time_net(time)       # [B, hidden]

    tokens = self.ac_proj(noisy_actions) # [B,H,Da]→[B,H,D]
    tokens = tokens.transpose(0, 1)      # MultiheadAttention: [H,B,D]
    x = tokens + self.dec_pos[:tokens.size(0)]

    x = self.decoder(x, time_enc, c)
    velocity = self.eps_out(x, time_enc, c)
    return velocity.transpose(0, 1)`,
      explanation: [
        "动作序列中的每个时刻是一个 token，可学习位置编码区分其先后位置。",
        "Self-Attention 没有 causal mask，因此任一动作 token 都能看到整段轨迹。",
        "eps_out 名称沿用旧命名；结合 loss 看，它实际输出的是 velocity。"
      ],
      interview: "Transformer 处理的是动作时间轴，不是直接把图像切成 patch；视觉已经先被 CNN 编码。"
    },
    {
      title: "AdaLN Block：时间和观测条件怎样注入",
      file: "modeling_ditflow.py · _DiTDecoder.forward",
      purpose: "用 t+c 生成 shift、scale 与 gate，调制注意力和 MLP 两个残差分支。",
      input: "action tokens x；time embedding t；condition c",
      output: "被条件调制后的 action tokens",
      code: `def forward(self, x, t, cond):
    cond = cond + t

    x2 = self.attn_modulate(self.norm1(x), cond)
    x2, _ = self.self_attn(x2, x2, x2)
    x = x + self.attn_gate(x2, cond)

    x3 = self.mlp_modulate(self.norm2(x), cond)
    x3 = self.mlp(x3)
    x3 = self.mlp_gate(x3, cond)
    return x + x3

# modulate: x * (1 + scale(c)) + shift(c)`,
      explanation: [
        "LayerNorm 后的 token 先由条件生成的 scale 与 shift 调制。",
        "注意力和 MLP 输出还经过条件 gate，再进入残差连接。",
        "调制层和最终层采用零初始化，使网络初始接近稳定的恒等/零输出。"
      ],
      interview: "条件不是 cross-attention 的 KV，也不是额外 token，而是通过 adaptive LayerNorm 控制每个 block。"
    },
    {
      title: "训练损失：Flow Matching 的五行核心",
      file: "modeling_ditflow.py · compute_loss",
      purpose: "在噪声与真实动作之间采样中间点，监督条件速度场。",
      input: "真实动作 a [B,H,Da]；观测条件 c",
      output: "标量 MSE loss",
      code: `trajectory = batch["action"]
noise = self.velocity_net.sample_noise(B, device)
t = self.noise_distribution.sample((B,)).to(device)

t3 = t[:, None, None]
x_t = (1 - t3) * noise + t3 * trajectory

pred = self.velocity_net(x_t, t, global_cond)
target = trajectory - noise
loss = F.mse_loss(pred, target, reduction="none")

if self.config.do_mask_loss_for_padding:
    loss *= (~batch["action_is_pad"]).unsqueeze(-1)
return loss.mean()`,
      explanation: [
        "每个 batch 样本独立采样 t；默认 t 均匀分布，也支持变换 Beta 分布。",
        "直线插值 x_t=(1−t)ε+ta 对 t 求导得到恒定目标 a−ε。",
        "可选 padding mask 避免 episode 边界复制动作参与 loss。"
      ],
      interview: "pred = velocity_net(x_t,t,c) 回答的是当前位置的运动方向；它既不是最终动作，也不是噪声本身。"
    },
    {
      title: "ODE 采样：沿学到的速度场从 0 走到 1",
      file: "modeling_ditflow.py · _DiTNoiseNet.sample",
      purpose: "从与动作块同形状的高斯噪声开始，用显式 Euler 法生成动作轨迹。",
      input: "condition c；随机噪声 [B,H,Da]",
      output: "归一化动作块 [B,H,Da]",
      code: `x = self.sample_noise(batch_size, device)
dt = 1.0 / timesteps
t_all = torch.arange(timesteps, device=device) / timesteps

for k in range(timesteps):
    t = t_all[k].expand(batch_size)
    velocity = self.forward(x, t, condition)
    x = x + dt * velocity

    if self.clip_sample:
        x = torch.clamp(
            x, -self.clip_sample_range,
               self.clip_sample_range,
        )
return x`,
      explanation: [
        "训练定义 t=0 为噪声、t=1 为动作，所以推理按正时间方向积分。",
        "默认 100 步意味着速度网络评估 100 次，是主要推理开销。",
        "每步裁剪到 ±1 与动作 min-max 归一化相互配合。"
      ],
      interview: "这是确定性 ODE solver；给定条件和初始噪声后，后续轨迹由速度场与积分器确定。"
    },
    {
      title: "动作切片：从完整 horizon 取出当前可执行部分",
      file: "modeling_ditflow.py · generate_actions",
      purpose: "ODE 先生成完整轨迹，再按观测历史的时间对齐关系截取执行块。",
      input: "完整动作 [B,H,Da]；S、n_action_steps",
      output: "可执行动作 [B,n_action_steps,Da]",
      code: `global_cond = self._prepare_global_conditioning(batch)
actions = self.conditional_sample(
    batch_size,
    global_cond=global_cond,
)

# horizon 从第一帧历史观测开始
start = n_obs_steps - 1
end = start + self.config.n_action_steps
actions = actions[:, start:end]
return actions

# defaults: start=1, end=9 → 8 actions`,
      explanation: [
        "conditional_sample 先产生 horizon=16 的完整动作。",
        "S=2 时第 0 个动作与过去观测对齐，当前动作从索引 1 开始。",
        "只保留 8 步用于真实执行，其余预测不会进入 action deque。"
      ],
      interview: "不要把 horizon 等同于从当前开始的未来长度；源码中的 horizon 包含历史对齐部分。"
    },
    {
      title: "队列执行：何时重规划、何时复用动作",
      file: "modeling_ditflow.py · select_action",
      purpose: "持续收集最新观测，仅在动作队列为空时生成新块，然后逐步弹出控制命令。",
      input: "每个环境时刻的一帧 observation",
      output: "单步 action [B,Da]",
      code: `# 多相机先堆叠成统一 OBS_IMAGES
batch[OBS_IMAGES] = torch.stack(
    [batch[key] for key in self.config.image_features],
    dim=-4,
)

# 更新最近 S 帧观测
self._queues = populate_queues(self._queues, batch)

if len(self._queues[ACTION]) == 0:
    actions = self.predict_action_chunk(batch)
    self._queues[ACTION].extend(
        actions.transpose(0, 1)
    )

return self._queues[ACTION].popleft()`,
      explanation: [
        "即使 action deque 未空，观测队列仍在每个环境时刻持续更新。",
        "deque 为空时，predict_action_chunk 堆叠最近 S 帧观测并生成新动作块。",
        "新块转置后逐时间步放入 deque；之后每次只 popleft 一个动作。"
      ],
      interview: "这是 receding-horizon 风格的分块执行，但块内不重规划；闭环频率由 n_action_steps 决定。"
    }
  ];

  const modalQuestions = [
    "请从训练目标和推理过程解释 DiTFlow。",
    "为什么这个实现要同时使用 action chunk 和 action queue？",
    "Flow Matching 与 Diffusion Policy 有哪些相同点和不同点？",
    "DiT 中动作、时间和观测条件分别如何进入网络？",
    "如果把触觉加入这个策略，你会修改哪些模块？",
    "num_inference_steps 与 n_action_steps 分别怎样影响真实部署？",
    "请解释 horizon、n_obs_steps 与当前动作切片的对齐关系。",
    "你在这份源码中发现了哪些值得改进的工程问题？",
    "为什么生成式策略比单点 MSE 回归更适合多模态行为数据？",
    "多模态条件融合时，除了拼接特征还必须解决哪些工程问题？"
  ];

  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    $("#scroll-progress-bar").style.width = `${Math.min(100, ratio * 100)}%`;
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(item => item.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    items.forEach(item => observer.observe(item));
  }

  function setupActiveNavigation() {
    const sections = $$("main section[id]");
    const links = $$(".side-nav a, .topnav a");
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
    }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, .1, .35] });
    sections.forEach(section => observer.observe(section));
  }

  function setupCopyButtons() {
    $$('[data-copy-target]').forEach(button => {
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target) return;
        const original = button.textContent;
        try {
          await navigator.clipboard.writeText(target.innerText.trim());
          button.textContent = "已复制 ✓";
        } catch (_) {
          const range = document.createRange();
          range.selectNodeContents(target);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = "已选中，请复制";
        }
        setTimeout(() => { button.textContent = original; }, 1400);
      });
    });
  }

  function setupFileTabs() {
    $$(".file-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.file;
        $$(".file-tab").forEach(item => {
          const active = item === tab;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
        });
        $$(".file-content").forEach(panel => panel.classList.toggle("active", panel.dataset.filePanel === name));
      });
    });
  }

  function setupConfigFilters() {
    $$(".config-filter").forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.dataset.configFilter;
        $$(".config-filter").forEach(item => item.classList.toggle("active", item === button));
        $$(".config-row[data-config-group]").forEach(row => {
          row.classList.toggle("hidden", filter !== "all" && row.dataset.configGroup !== filter);
        });
      });
    });
  }

  function setupAnswerToggle() {
    const button = $("#answer-toggle");
    button.addEventListener("click", () => {
      const shouldHide = button.getAttribute("aria-pressed") !== "true";
      $$("#qa-list details").forEach(item => { item.open = !shouldHide; });
      button.setAttribute("aria-pressed", String(shouldHide));
      button.textContent = shouldHide ? "全部展开答案" : "全部隐藏答案";
    });
  }

  function setupChecks() {
    $$(".study-check").forEach(input => {
      input.checked = state.checks.has(input.dataset.check);
      input.addEventListener("change", () => {
        if (input.checked) state.checks.add(input.dataset.check);
        else state.checks.delete(input.dataset.check);
        storage.set("checks", [...state.checks]);
        updateMastery();
      });
    });
  }

  function updateMastery() {
    const completed = state.checks.size + state.knownCards.size + state.quizBest;
    const total = 5 + flashcards.length + quiz.length;
    const percent = Math.round(completed / total * 100);
    $("#mastery-percent").textContent = `${percent}%`;
    $("#mastery-bar").style.width = `${percent}%`;
    $("#mastery-text").textContent = percent >= 80 ? "已经具备完整讲述能力" : percent >= 45 ? "主线已建立，继续主动回忆" : "完成闪卡与测验后自动记录";
  }

  function renderFlashcard() {
    const card = flashcards[state.cardIndex];
    const cardElement = $("#flashcard");
    cardElement.classList.remove("flipped");
    $("#flash-question").textContent = card.q;
    $("#flash-answer").textContent = card.a;
    $("#card-position").textContent = `${String(state.cardIndex + 1).padStart(2, "0")} / ${flashcards.length}`;
    $("#card-score").textContent = `已掌握 ${state.knownCards.size}`;
    const dots = $("#card-dots");
    dots.innerHTML = "";
    flashcards.forEach((_, index) => {
      const dot = document.createElement("i");
      if (index === state.cardIndex) dot.classList.add("current");
      if (state.knownCards.has(index)) dot.classList.add("known");
      dots.appendChild(dot);
    });
  }

  function moveCard(delta) {
    state.cardIndex = (state.cardIndex + delta + flashcards.length) % flashcards.length;
    renderFlashcard();
  }

  function setupFlashcards() {
    $("#flashcard").addEventListener("click", event => event.currentTarget.classList.toggle("flipped"));
    $("#card-prev").addEventListener("click", () => moveCard(-1));
    $("#card-next").addEventListener("click", () => moveCard(1));
    $("#card-again").addEventListener("click", () => {
      state.knownCards.delete(state.cardIndex);
      storage.set("knownCards", [...state.knownCards]);
      updateMastery();
      moveCard(1);
    });
    $("#card-known").addEventListener("click", () => {
      state.knownCards.add(state.cardIndex);
      storage.set("knownCards", [...state.knownCards]);
      updateMastery();
      moveCard(1);
    });
    renderFlashcard();
  }

  function startQuiz() {
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizLocked = false;
    $("#quiz-intro").hidden = true;
    $("#quiz-result").hidden = true;
    $("#quiz-body").hidden = false;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    state.quizLocked = false;
    const item = quiz[state.quizIndex];
    $("#quiz-progress").textContent = `问题 ${state.quizIndex + 1} / ${quiz.length}`;
    $("#quiz-progress-bar").style.width = `${(state.quizIndex / quiz.length) * 100}%`;
    $("#quiz-question").textContent = item.q;
    $("#quiz-feedback").textContent = "";
    $("#quiz-next").disabled = true;
    const options = $("#quiz-options");
    options.innerHTML = "";
    item.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
      button.addEventListener("click", () => chooseQuizOption(index, button));
      options.appendChild(button);
    });
  }

  function chooseQuizOption(index, selectedButton) {
    if (state.quizLocked) return;
    state.quizLocked = true;
    const item = quiz[state.quizIndex];
    const buttons = $$("button", $("#quiz-options"));
    buttons.forEach((button, optionIndex) => {
      button.disabled = true;
      if (optionIndex === item.answer) button.classList.add("correct");
    });
    if (index === item.answer) {
      state.quizScore += 1;
      $("#quiz-feedback").textContent = `回答正确。${item.note}`;
    } else {
      selectedButton.classList.add("wrong");
      $("#quiz-feedback").textContent = `正确答案是 ${String.fromCharCode(65 + item.answer)}。${item.note}`;
    }
    $("#quiz-next").disabled = false;
    $("#quiz-progress-bar").style.width = `${((state.quizIndex + 1) / quiz.length) * 100}%`;
  }

  function nextQuizQuestion() {
    if (state.quizIndex < quiz.length - 1) {
      state.quizIndex += 1;
      renderQuizQuestion();
      return;
    }
    state.quizBest = Math.max(state.quizBest, state.quizScore);
    storage.set("quizBest", state.quizBest);
    updateMastery();
    $("#quiz-body").hidden = true;
    $("#quiz-result").hidden = false;
    $("#quiz-score").textContent = `${state.quizScore} / ${quiz.length}`;
    $("#quiz-message").textContent = state.quizScore === quiz.length ? "可以进入模拟面试了" : state.quizScore >= 6 ? "主线掌握不错" : "建议再看一遍训练与推理";
    $("#quiz-result-note").textContent = state.quizScore === quiz.length ? "尝试不看页面，完整口述 2 分钟版本。" : "错题重点通常在速度监督、动作切片或条件注入。";
  }

  function setupQuiz() {
    $("#quiz-start").addEventListener("click", startQuiz);
    $("#quiz-next").addEventListener("click", nextQuizQuestion);
    $("#quiz-restart").addEventListener("click", startQuiz);
  }

  function setupConceptTabs() {
    $$(".concept-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const concept = tab.dataset.concept;
        $$(".concept-tab").forEach(item => {
          const active = item === tab;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
        });
        $$(".concept-panel").forEach(panel => {
          panel.classList.toggle("active", panel.dataset.conceptPanel === concept);
        });
      });
    });
  }

  function setupFlowAnimation() {
    const slider = $("#flow-time");
    const playButton = $("#flow-play");
    const particle = $("#flow-particle");
    let animationFrame = null;
    let animationStart = null;

    function renderFlow(value) {
      const t = Math.max(0, Math.min(1, value / 100));
      slider.value = String(Math.round(t * 100));
      $("#flow-time-output").textContent = t.toFixed(2);
      $("#noise-weight").textContent = (1 - t).toFixed(2);
      $("#action-weight").textContent = t.toFixed(2);
      particle.style.left = `${t * 100}%`;
      $("#noise-vector-bars").style.opacity = String(.95 - .55 * t);
    }

    function stopFlow() {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      animationStart = null;
      playButton.setAttribute("aria-pressed", "false");
      playButton.innerHTML = "<i>▶</i> 自动播放";
    }

    function animateFlow(timestamp) {
      if (animationStart === null) animationStart = timestamp;
      const elapsed = timestamp - animationStart;
      const value = Math.min(100, elapsed / 38);
      renderFlow(value);
      if (value >= 100) {
        stopFlow();
        return;
      }
      animationFrame = requestAnimationFrame(animateFlow);
    }

    slider.addEventListener("input", () => {
      stopFlow();
      renderFlow(Number(slider.value));
    });
    playButton.addEventListener("click", () => {
      if (animationFrame !== null) {
        stopFlow();
        return;
      }
      if (Number(slider.value) >= 100) renderFlow(0);
      playButton.setAttribute("aria-pressed", "true");
      playButton.innerHTML = "<i>Ⅱ</i> 暂停";
      animationStart = performance.now() - Number(slider.value) * 38;
      animationFrame = requestAnimationFrame(animateFlow);
    });
    renderFlow(0);
  }

  function setupChunkAnimation() {
    const button = $("#chunk-play");
    const cells = $$("#chunk-cells i");
    const queue = $("#action-queue");
    let timer = null;
    let step = -1;

    function buildQueue() {
      queue.innerHTML = "";
      for (let index = 0; index < 8; index += 1) {
        const item = document.createElement("i");
        item.textContent = index === 0 ? "aₜ" : `aₜ₊${index}`;
        queue.appendChild(item);
      }
    }

    function resetChunk() {
      if (timer !== null) clearInterval(timer);
      timer = null;
      step = -1;
      $("#chunk-call-count").textContent = "0";
      $("#chunk-env-step").textContent = "t";
      $("#robot-action").textContent = "等待执行";
      cells.forEach((cell, index) => {
        cell.className = index === 0 ? "past" : index <= 8 ? "queued" : "unused";
      });
      buildQueue();
      button.setAttribute("aria-pressed", "false");
      button.innerHTML = "<i>▶</i> 播放执行过程";
    }

    function runStep() {
      if (step === -1) {
        $("#chunk-call-count").textContent = "1";
        $("#robot-action").textContent = "已生成动作块，准备执行";
        step = 0;
        return;
      }
      if (step >= 8) {
        $("#robot-action").textContent = "队列耗尽：用最新观测重新调用模型";
        $("#chunk-call-count").textContent = "2";
        clearInterval(timer);
        timer = null;
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = "<i>↻</i> 再播放一次";
        return;
      }

      cells.forEach(cell => cell.classList.remove("executing"));
      cells[step + 1].classList.add("executing");
      $("#chunk-env-step").textContent = step === 0 ? "t" : `t+${step}`;
      $("#robot-action").textContent = `执行队首动作 ${step === 0 ? "aₜ" : `aₜ₊${step}`}`;
      const queueItems = $$("i", queue);
      if (queueItems[step]) queueItems[step].classList.add("popped");
      step += 1;
    }

    button.addEventListener("click", () => {
      if (timer !== null) {
        resetChunk();
        return;
      }
      resetChunk();
      button.setAttribute("aria-pressed", "true");
      button.innerHTML = "<i>Ⅱ</i> 停止";
      runStep();
      timer = setInterval(runStep, 620);
    });
    resetChunk();
  }

  function setupCoreCodeWalkthrough() {
    let currentStep = 0;

    function renderCoreStep(index) {
      currentStep = (index + coreSteps.length) % coreSteps.length;
      const step = coreSteps[currentStep];
      $("#core-step-index").textContent = `STEP ${String(currentStep + 1).padStart(2, "0")} / ${coreSteps.length}`;
      $("#core-step-title").textContent = step.title;
      $("#core-step-purpose").textContent = step.purpose;
      $("#core-step-file").textContent = step.file;
      $("#core-step-input").textContent = step.input;
      $("#core-step-output").textContent = step.output;
      $("#core-code-snippet code").textContent = step.code;
      $("#core-step-interview").textContent = step.interview;

      const explanation = $("#core-step-explanation");
      explanation.innerHTML = "";
      step.explanation.forEach(text => {
        const item = document.createElement("li");
        item.textContent = text;
        explanation.appendChild(item);
      });

      $$(".core-step").forEach((button, buttonIndex) => {
        button.classList.toggle("active", buttonIndex === currentStep);
      });
      $("#core-progress-bar").style.width = `${((currentStep + 1) / coreSteps.length) * 100}%`;
    }

    $$(".core-step").forEach(button => {
      button.addEventListener("click", () => renderCoreStep(Number(button.dataset.coreStep)));
    });
    $("#core-prev").addEventListener("click", () => renderCoreStep(currentStep - 1));
    $("#core-next").addEventListener("click", () => renderCoreStep(currentStep + 1));
    renderCoreStep(0);
  }

  function setRandomQuestion() {
    const question = modalQuestions[Math.floor(Math.random() * modalQuestions.length)];
    $("#modal-question").textContent = question;
  }

  function openModal() {
    setRandomQuestion();
    const modal = $("#question-modal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = $("#question-modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function setupModal() {
    $("#random-question").addEventListener("click", openModal);
    $("#another-question").addEventListener("click", setRandomQuestion);
    $$('[data-close-modal]').forEach(element => element.addEventListener("click", closeModal));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });
  }

  function setupFocusMode() {
    const button = $("#focus-toggle");
    button.addEventListener("click", () => {
      const active = document.body.classList.toggle("focus-mode");
      button.setAttribute("aria-pressed", String(active));
    });
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  const jumpToSection = target => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "start" });
    requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
  };
  window.addEventListener("load", () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) setTimeout(() => jumpToSection(target), 0);
  });
  if (window.location.hash) {
    const initialTarget = document.querySelector(window.location.hash);
    if (initialTarget) {
      jumpToSection(initialTarget);
      setTimeout(() => jumpToSection(initialTarget), 160);
    }
  }
  const requestedSection = new URLSearchParams(window.location.search).get("section");
  if (requestedSection) {
    const requestedTarget = document.getElementById(requestedSection);
    if (requestedTarget) {
      jumpToSection(requestedTarget);
      setTimeout(() => jumpToSection(requestedTarget), 220);
    }
  }
  setupReveal();
  setupActiveNavigation();
  setupCopyButtons();
  setupFileTabs();
  setupConceptTabs();
  setupFlowAnimation();
  setupChunkAnimation();
  setupCoreCodeWalkthrough();
  setupConfigFilters();
  setupAnswerToggle();
  setupChecks();
  setupFlashcards();
  setupQuiz();
  setupModal();
  setupFocusMode();
  updateMastery();
  updateScrollProgress();
})();
