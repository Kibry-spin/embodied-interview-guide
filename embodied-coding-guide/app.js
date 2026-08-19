(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
