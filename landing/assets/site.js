/* Elitze Agentic Security — shared behaviour. Each block is guarded by element presence. */
(function () {
  "use strict";
  var D = window.ELITZE_DATA || { scan: { findings: [], stats: {}, enrichment: {} }, site: {} };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sidebar ---------- */
  function initNav() {
    var body = document.body;
    var KEY = "elitze.nav";
    if (window.innerWidth > 900) {
      body.setAttribute("data-nav", localStorage.getItem(KEY) === "rail" ? "rail" : "open");
    } else {
      body.setAttribute("data-nav", "closed");
    }
    var toggle = document.getElementById("nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = body.getAttribute("data-nav") === "rail" ? "open" : "rail";
        body.setAttribute("data-nav", next);
        localStorage.setItem(KEY, next);
      });
    }
    var burger = document.getElementById("nav-burger");
    if (burger) {
      burger.addEventListener("click", function () {
        body.setAttribute("data-nav", body.getAttribute("data-nav") === "open" ? "closed" : "open");
      });
    }
    document.querySelectorAll(".sidebar a.navlink").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.innerWidth <= 900) body.setAttribute("data-nav", "closed");
      });
    });
  }

  /* ---------- palette ---------- */
  var INDEX = [], current = [], cursor = 0;

  function buildIndex() {
    document.querySelectorAll(".sidebar a.navlink").forEach(function (a) {
      INDEX.push({ t: (a.textContent || "").trim(), k: "page", target: a.getAttribute("href") });
    });
    (D.scan.findings || []).forEach(function (f) {
      INDEX.push({ t: f.title, k: "finding · " + f.severity, target: "scans.html", id: f.id });
    });
    ["Security Atlas", "Guardrail simulator", "Patch plans", "DMARC", "TeamSpeak",
     "Parity matrix", "Pricing", "Trust page", "security.txt"].forEach(function (t) {
      var map = {
        "Security Atlas": "graph.html", "Guardrail simulator": "guardrails.html",
        "Patch plans": "scans.html", "DMARC": "email.html", "TeamSpeak": "integrations.html",
        "Parity matrix": "compare.html", "Pricing": "plans.html", "Trust page": "trust.html",
        "security.txt": "security.txt"
      };
      INDEX.push({ t: t, k: "shortcut", target: map[t] });
    });
  }

  function renderResults() {
    var box = document.getElementById("results");
    if (!box) return;
    if (!current.length) {
      box.innerHTML = '<div class="empty">No match. Try “undici”, “TeamSpeak”, “DMARC”.</div>';
      return;
    }
    box.innerHTML = current.map(function (r, i) {
      return '<div class="res" role="option" aria-selected="' + (i === cursor) + '" data-i="' + i + '">' +
        "<span>" + String(r.t).replace(/</g, "&lt;") + "</span><small>" + r.k + "</small></div>";
    }).join("");
    box.querySelectorAll(".res").forEach(function (el) {
      el.addEventListener("click", function () { choose(Number(el.getAttribute("data-i"))); });
    });
  }

  function search(q) {
    var query = (q || "").trim().toLowerCase();
    current = (query ? INDEX.filter(function (i) {
      return (i.t + " " + i.k).toLowerCase().indexOf(query) >= 0;
    }) : INDEX).slice(0, 10);
    cursor = 0;
    renderResults();
  }

  function choose(i) {
    var r = current[i];
    if (!r) return;
    closePalette();
    if (r.id) {
      var url = r.target + "#" + r.id;
      if (location.pathname.split("/").pop() === r.target) { focusFinding(r.id); }
      else { location.href = url; }
    } else { location.href = r.target; }
  }

  function focusFinding(id) {
    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) { row.scrollIntoView({ block: "center" }); row.click(); }
  }

  function openPalette() {
    var scrim = document.getElementById("scrim"), pal = document.getElementById("palette");
    if (!scrim || !pal) return;
    scrim.setAttribute("data-open", "true"); pal.setAttribute("data-open", "true");
    var q = document.getElementById("q");
    if (q) { q.value = ""; search(""); q.focus(); }
  }
  function closePalette() {
    var scrim = document.getElementById("scrim"), pal = document.getElementById("palette");
    if (scrim) scrim.setAttribute("data-open", "false");
    if (pal) pal.setAttribute("data-open", "false");
  }

  function initPalette() {
    buildIndex();
    var openBtn = document.getElementById("open-search");
    if (openBtn) openBtn.addEventListener("click", openPalette);
    var scrim = document.getElementById("scrim");
    if (scrim) scrim.addEventListener("click", closePalette);
    var q = document.getElementById("q");
    if (q) q.addEventListener("input", function () { search(this.value); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
      if (e.key === "Escape") { closePalette(); return; }
      var pal = document.getElementById("palette");
      if (!pal || pal.getAttribute("data-open") !== "true") return;
      if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, current.length - 1); renderResults(); }
      if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); renderResults(); }
      if (e.key === "Enter") { e.preventDefault(); choose(cursor); }
    });
    if (location.hash.length > 1) {
      var id = location.hash.slice(1);
      setTimeout(function () { focusFinding(id); }, 120);
    }
  }

  /* ---------- graph ---------- */
  var DOMAINS = {
    identity: { color: "#a78bfa", label: "Identity" }, mcp: { color: "#22d3ee", label: "MCP" },
    cloud: { color: "#38bdf8", label: "Cloud" }, data: { color: "#fcd34d", label: "Data" },
    runtime: { color: "#34d399", label: "Runtime" }, secops: { color: "#fb7185", label: "SecOps" }
  };
  var NODES = [
    { id: "sso", n: "Entra ID · SSO", d: "identity", s: "DECLARED", note: "documented adapter, no live tenant" },
    { id: "sara", n: "Sara", d: "identity", s: "OBSERVED", note: "assistant, cannot self-grant" },
    { id: "ci", n: "Actions · OIDC", d: "identity", s: "DECLARED", note: "workload identity" },
    { id: "svc", n: "non-human id", d: "identity", s: "UNKNOWN", note: "inventory needs a grant" },
    { id: "gw", n: "MCP gateway", d: "mcp", s: "DECLARED", note: "policy enforcement point" },
    { id: "t-read", n: "fs.read", d: "mcp", s: "DECLARED", note: "low sensitivity" },
    { id: "t-pr", n: "create_pull_request", d: "mcp", s: "DECLARED", note: "writes source control" },
    { id: "t-mail", n: "send_external", d: "mcp", s: "DECLARED", note: "egress, needs approval" },
    { id: "t-secret", n: "read_secret", d: "mcp", s: "UNKNOWN", note: "sensitivity unclassified" },
    { id: "srv-fs", n: "server · filesystem", d: "mcp", s: "DECLARED", note: "root path scoped" },
    { id: "aws-iam", n: "AWS IAM", d: "cloud", s: "DECLARED", note: "CloudTrail adapter" },
    { id: "k8s", n: "Kubernetes", d: "cloud", s: "DECLARED", note: "RBAC adapter" },
    { id: "azure", n: "Azure sub", d: "cloud", s: "UNKNOWN", note: "not connected" },
    { id: "pg", n: "Postgres", d: "data", s: "UNKNOWN", note: "health 503: database unavailable" },
    { id: "s3", n: "S3 evidence", d: "data", s: "DECLARED", note: "retention documented" },
    { id: "vec", n: "vector index", d: "data", s: "UNKNOWN", note: "not measured" },
    { id: "rt", n: "runtime gateway", d: "runtime", s: "DECLARED", note: "pre-execution decision" },
    { id: "pol", n: "policy engine", d: "runtime", s: "DECLARED", note: "default deny" },
    { id: "appr", n: "approval queue", d: "runtime", s: "DECLARED", note: "named operator" },
    { id: "osv", n: "OSV.dev", d: "secops", s: "VERIFIED", note: "queried live at build" },
    { id: "kev", n: "CISA KEV", d: "secops", s: "VERIFIED", note: "catalog fetched live" },
    { id: "epss", n: "FIRST EPSS", d: "secops", s: "VERIFIED", note: "scores fetched live" },
    { id: "soc", n: "SOC analyst", d: "secops", s: "OBSERVED", note: "console routes exist" },
    { id: "ev", n: "evidence store", d: "secops", s: "DECLARED", note: "append-only intent" }
  ];
  var EDGES = [["sara","gw"],["ci","gw"],["svc","gw"],["sso","gw"],["gw","t-read"],["gw","t-pr"],
    ["gw","t-mail"],["gw","t-secret"],["gw","srv-fs"],["t-read","s3"],["t-pr","aws-iam"],["t-mail","rt"],
    ["t-secret","pg"],["srv-fs","pg"],["rt","pol"],["pol","appr"],["appr","ev"],["osv","soc"],["kev","soc"],
    ["epss","soc"],["soc","ev"],["k8s","aws-iam"],["azure","aws-iam"],["vec","s3"]
  ].map(function (e) { return { a: e[0], b: e[1] }; });
  var byId = {};
  NODES.forEach(function (n) { byId[n.id] = n; });

  function initGraph() {
    var canvas = document.getElementById("graph-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, DPR = 1, hover = null, selected = null, filter = "all";
    var paused = reduceMotion, t0 = performance.now();

    var centers = { identity: [0.15, 0.28], mcp: [0.50, 0.20], cloud: [0.85, 0.28],
                    data: [0.74, 0.74], runtime: [0.36, 0.76], secops: [0.10, 0.76] };
    var buckets = {};
    NODES.forEach(function (n) { (buckets[n.d] = buckets[n.d] || []).push(n); });
    Object.keys(buckets).forEach(function (d) {
      var g = buckets[d], c = centers[d] || [0.5, 0.5];
      g.forEach(function (n, i) {
        var a = (i / g.length) * Math.PI * 2 + d.length * 0.7;
        n.x = c[0] + Math.cos(a) * 0.145 * (0.78 + (i % 2 ? 0.22 : 0));
        n.y = c[1] + Math.sin(a) * 0.13;
      });
    });

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      // A hidden or zero-width pane must not produce a zero-sized buffer.
      W = Math.round(r.width || canvas.clientWidth || canvas.parentElement.clientWidth || 640);
      H = Math.round(r.height || canvas.clientHeight || canvas.parentElement.clientHeight || 400);
      if (W < 1) W = 640;
      if (H < 1) H = 400;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function pos(n) { return { x: n.x * W, y: n.y * H }; }

    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      if (W < 2 || H < 2) { requestAnimationFrame(draw); return; }
      EDGES.forEach(function (e, i) {
        var A = byId[e.a], B = byId[e.b];
        if (!A || !B) return;
        var p1 = pos(A), p2 = pos(B);
        var dim = filter !== "all" && A.d !== filter && B.d !== filter;
        ctx.strokeStyle = dim ? "rgba(90,130,150,.10)" : "rgba(70,150,180,.30)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        if (!dim && !paused) {
          var k = ((t * 0.22) + i * 0.13) % 1;
          var px = p1.x + (p2.x - p1.x) * k, py = p1.y + (p2.y - p1.y) * k;
          var g = ctx.createRadialGradient(px, py, 0, px, py, 7);
          g.addColorStop(0, "rgba(165,243,252,.95)"); g.addColorStop(1, "rgba(34,211,238,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
        }
      });
      NODES.forEach(function (n) {
        var p = pos(n), meta = DOMAINS[n.d] || DOMAINS.secops;
        var dim = filter !== "all" && n.d !== filter;
        var r = n.s === "VERIFIED" ? 7.5 : 6.5;
        if (n === hover || n === selected) r += 2.5;
        if (!dim && (n === hover || n === selected)) {
          ctx.strokeStyle = "rgba(165,243,252,.55)"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = dim ? 0.18 : 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = meta.color; ctx.fill();
        if (n.s !== "VERIFIED") {
          ctx.strokeStyle = (n.s === "UNKNOWN" || n.s === "UNMEASURABLE") ? "#64748b" : "rgba(252,211,77,.8)";
          ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.globalAlpha = 1;
        if (W > 560 || n === hover || n === selected) {
          ctx.font = "11.5px ui-sans-serif,system-ui,sans-serif";
          ctx.fillStyle = dim ? "rgba(157,191,210,.35)" : "#cfe8f4";
          ctx.textAlign = "center";
          ctx.fillText(n.n, p.x, p.y + r + 15);
        }
      });
      if (!paused) requestAnimationFrame(draw);
    }

    function pick(mx, my) {
      var best = null, bd = 20;
      NODES.forEach(function (n) {
        var p = pos(n), dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = n; }
      });
      return best;
    }

    function inspect(n) {
      var t = document.getElementById("ins-title"), s = document.getElementById("ins-sub"),
          dl = document.getElementById("ins-dl");
      if (!t) return;
      if (!n) { t.textContent = "Select a node"; s.textContent = "Hover to trace, click to inspect."; dl.innerHTML = ""; return; }
      t.textContent = n.n;
      s.textContent = (DOMAINS[n.d] || {}).label + " · " + n.note;
      dl.innerHTML = [["State", '<span class="badge" data-s="' + n.s + '">' + n.s + "</span>"],
        ["Domain", (DOMAINS[n.d] || {}).label],
        ["Edges", String(EDGES.filter(function (e) { return e.a === n.id || e.b === n.id; }).length)],
        ["Source", "product topology"]].map(function (r) {
          return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
        }).join("");
    }

    resize(); inspect(null); requestAnimationFrame(draw);
    // Exposed for automated checks: renders one frame synchronously on demand.
    window.__elitzeGraph = { draw: draw, resize: resize, nodes: NODES };
    window.addEventListener("resize", function () { resize(); if (paused) draw(performance.now()); });
    canvas.addEventListener("mousemove", function (ev) {
      var r = canvas.getBoundingClientRect();
      var n = pick(ev.clientX - r.left, ev.clientY - r.top);
      if (n !== hover) { hover = n; canvas.style.cursor = n ? "pointer" : "crosshair"; if (paused) draw(performance.now()); }
    });
    canvas.addEventListener("mouseleave", function () { hover = null; if (paused) draw(performance.now()); });
    canvas.addEventListener("click", function (ev) {
      var r = canvas.getBoundingClientRect();
      selected = pick(ev.clientX - r.left, ev.clientY - r.top);
      inspect(selected);
      if (paused) draw(performance.now());
    });
    document.querySelectorAll("[data-domain]").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-domain");
        document.querySelectorAll("[data-domain]").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        if (paused) draw(performance.now());
      });
    });
    var pb = document.getElementById("g-pause");
    if (pb) pb.addEventListener("click", function () {
      paused = !paused;
      pb.setAttribute("aria-pressed", paused ? "true" : "false");
      pb.textContent = paused ? "Resume motion" : "Pause motion";
      if (!paused) requestAnimationFrame(draw); else draw(performance.now());
    });
    var rb = document.getElementById("g-reset");
    if (rb) rb.addEventListener("click", function () {
      filter = "all"; selected = null; hover = null;
      document.querySelectorAll("[data-domain]").forEach(function (x) {
        x.setAttribute("aria-pressed", x.getAttribute("data-domain") === "all" ? "true" : "false");
      });
      inspect(null); if (paused) draw(performance.now());
    });
  }

  /* ---------- policy ---------- */
  var TOOLS = {
    read_inventory: { sens: "low", egress: false, name: "mcp.filesystem.read" },
    create_pr: { sens: "medium", egress: false, name: "github.create_pull_request" },
    send_email: { sens: "high", egress: true, name: "email.send_external" },
    attach_policy: { sens: "critical", egress: false, name: "aws.iam.attach_role_policy" },
    export_evidence: { sens: "critical", egress: true, name: "data.export_tenant_evidence" }
  };
  var PRINCIPALS = {
    human_verified: { verified: true, label: "human SSO" },
    agent_sara: { verified: true, label: "assistant agent" },
    agent_unverified: { verified: false, label: "unregistered runtime" },
    svc_ci: { verified: true, label: "workload identity" }
  };

  function evaluate(input) {
    var p = PRINCIPALS[input.principal], tool = TOOLS[input.tool];
    var trace = [], decision = "ALLOW";
    function rule(id, ok, detail) {
      trace.push({ id: id, ok: ok, detail: detail });
      if (!ok && decision === "ALLOW") decision = "DENY";
    }
    rule("identity", p.verified, p.verified ? "principal verified (" + p.label + ")"
      : "no verified workload identity");
    rule("scope", input.scope === "in_scope", input.scope === "in_scope"
      ? "call maps to an active written authorization"
      : input.scope === "expired" ? "authorization expired; re-authorize" : "asset outside written scope");
    rule("egress", !tool.egress || input.principal !== "agent_unverified",
      tool.egress ? "egress checked against tenant allow-list" : "no external egress");
    var needs = tool.sens === "critical" || tool.sens === "high";
    if (needs && input.approval !== "yes") {
      trace.push({ id: "approval", ok: false, detail: "sensitivity " + tool.sens + " needs a named approver" });
      if (decision === "ALLOW") decision = "APPROVAL";
    } else {
      trace.push({ id: "approval", ok: true, detail: needs ? "approval recorded against exact arguments"
        : "no approval required at this sensitivity" });
    }
    if (input.principal === "agent_sara" && tool.sens === "critical") {
      trace.push({ id: "boundary", ok: false, detail: "assistant cannot execute critical calls" });
      decision = "DENY";
    }
    return { decision: decision, trace: trace, tool: tool };
  }

  function initPolicy() {
    var sel = document.getElementById("p-tool");
    if (!sel) return;
    function render() {
      var out = evaluate({
        principal: document.getElementById("p-principal").value,
        tool: document.getElementById("p-tool").value,
        scope: document.getElementById("p-scope").value,
        approval: document.getElementById("p-approval").value
      });
      var v = document.getElementById("verdict");
      v.textContent = out.decision; v.setAttribute("data-v", out.decision);
      document.getElementById("verdict-why").textContent = out.tool.name;
      document.getElementById("trace").innerHTML = out.trace.map(function (r) {
        return '<li data-r="' + (r.ok ? "pass" : "fail") + '"><b>' + (r.ok ? "PASS" : "STOP") +
          "</b><span>" + r.id + ": " + r.detail + "</span></li>";
      }).join("");
    }
    ["p-principal", "p-tool", "p-scope", "p-approval"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", render);
    });
    render();
  }

  /* ---------- scans ---------- */
  var sevFilter = "all", activeRow = null;
  function rank(s) { return { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 }[s] || 0; }

  function initScans() {
    var body = document.getElementById("fbody");
    if (!body) return;

    function render() {
      var rows = (D.scan.findings || []).filter(function (f) {
        return sevFilter === "all" || f.severity === sevFilter;
      }).sort(function (a, b) { return rank(b.severity) - rank(a.severity) || (b.epss || 0) - (a.epss || 0); });

      body.innerHTML = rows.map(function (f) {
        var pkg = (f.title.split(":")[0] || "").trim();
        var fix = f.patch && f.patch.target_version ? f.patch.target_version : "no forward fix";
        return '<tr tabindex="0" data-id="' + f.id + '">' +
          '<td><span class="sev" data-s="' + f.severity + '">' + String(f.severity).toUpperCase() + "</span></td>" +
          "<td>" + (f.kev ? '<span class="kevdot"></span>' : "") + String(f.title).replace(/</g, "&lt;") + "</td>" +
          '<td class="mono">' + pkg.replace(/</g, "&lt;") + "</td>" +
          '<td class="mono">' + (f.cvss_score === null ? "—" : Number(f.cvss_score).toFixed(1)) + "</td>" +
          '<td class="mono">' + (f.epss === null ? "—" : Number(f.epss).toFixed(3)) + "</td>" +
          '<td class="mono">' + fix + "</td></tr>";
      }).join("");

      body.querySelectorAll("tr").forEach(function (tr) {
        function open() { select(tr.getAttribute("data-id"), tr); }
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      });
      var meta = document.getElementById("scan-meta");
      if (meta) meta.textContent = rows.length + " of " + (D.scan.findings || []).length + " shown";
    }

    function select(id, tr) {
      var f = (D.scan.findings || []).filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      if (activeRow) activeRow.removeAttribute("aria-selected");
      if (tr) { tr.setAttribute("aria-selected", "true"); activeRow = tr; }
      var drawer = document.getElementById("drawer");
      drawer.hidden = false;
      document.getElementById("d-title").textContent = f.title;
      var ids = Object.keys(f.ids || {}).map(function (k) { return k.toUpperCase() + " " + f.ids[k]; }).join(" · ");
      document.getElementById("d-meta").textContent = [f.asset, ids, "evidence " + f.evidence]
        .filter(Boolean).join(" · ");
      var p = f.patch || {};
      document.getElementById("d-strategy").textContent = p.strategy || "none produced";
      document.getElementById("d-blast").textContent = p.blast_radius || "—";
      document.getElementById("d-cmd").textContent = p.command || "no command — see notes";
      document.getElementById("d-rollback").textContent = p.rollback || "—";
      document.getElementById("d-verify").innerHTML = (p.verification || ["—"]).map(function (v) {
        return "<li>" + String(v).replace(/</g, "&lt;") + "</li>";
      }).join("");
      document.getElementById("d-sources").innerHTML = (f.sources || []).map(function (s) {
        return '<a href="' + s.url + '" rel="noopener">' + s.name + "</a>";
      }).join(" · ");
      drawer.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }

    document.querySelectorAll("[data-sev]").forEach(function (b) {
      b.addEventListener("click", function () {
        sevFilter = b.getAttribute("data-sev");
        document.querySelectorAll("[data-sev]").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        render();
      });
    });
    var close = document.getElementById("d-close");
    if (close) close.addEventListener("click", function () { document.getElementById("drawer").hidden = true; });
    var copy = document.getElementById("d-copy");
    if (copy) copy.addEventListener("click", function () {
      var text = document.getElementById("d-cmd").textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      var btn = this; btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy"; }, 1400);
    });
    render();
  }

  function initBars() {
    var host = document.getElementById("bars");
    if (!host) return;
    var top = (D.scan.findings || []).filter(function (f) { return f.epss !== null; })
      .sort(function (a, b) { return b.epss - a.epss; }).slice(0, 6);
    if (!top.length) { host.innerHTML = '<p class="muted">No EPSS-scored findings in this scan.</p>'; return; }
    var max = Math.max.apply(null, top.map(function (f) { return f.epss; }).concat([0.001]));
    host.innerHTML = top.map(function (f) {
      var pct = Math.max(3, (f.epss / max) * 100);
      var color = f.severity === "high" ? "#fb923c" : f.severity === "medium" ? "#fbbf24" : "#38bdf8";
      return '<div class="bar"><div class="name"><span>' + String(f.title).replace(/</g, "&lt;") +
        '</span><span class="mono">EPSS ' + Number(f.epss).toFixed(3) + "</span></div>" +
        '<div class="track"><div class="fill" data-w="' + pct + '" style="background:' + color + '"></div></div>' +
        '<div class="val">' + (f.cvss_score === null ? "no CVSS" : "CVSS " + Number(f.cvss_score).toFixed(1)) +
        "</div></div>";
    }).join("");
    requestAnimationFrame(function () {
      host.querySelectorAll(".fill").forEach(function (el) { el.style.width = el.getAttribute("data-w") + "%"; });
    });
  }

  /* ---------- email ---------- */
  function analyse(text) {
    var trace = [], verdict = "PASS";
    var ar = /Authentication-Results:([^\n]*(?:\n[ \t][^\n]*)*)/i.exec(text);
    var line = ar ? ar[1].replace(/\s+/g, " ") : "";
    function field(name) {
      var m = new RegExp(name + "\\s*=\\s*([a-z]+)", "i").exec(line);
      return m ? m[1].toLowerCase() : null;
    }
    var spf = field("spf"), dkim = field("dkim"), dmarc = field("dmarc");
    trace.push({ ok: spf === "pass", id: "spf", detail: spf ? "spf=" + spf : "no SPF result present" });
    trace.push({ ok: dkim === "pass", id: "dkim", detail: dkim ? "dkim=" + dkim : "no DKIM signature result" });
    if (dmarc === null) { verdict = "UNKNOWN"; trace.push({ ok: false, id: "dmarc", detail: "no DMARC result — cannot conclude" }); }
    else if (dmarc === "pass") trace.push({ ok: true, id: "dmarc", detail: "dmarc=pass" });
    else { verdict = "FAIL"; trace.push({ ok: false, id: "dmarc", detail: "dmarc=" + dmarc + " — sender not authorized" }); }

    var from = /From:.*?<([^>]+)>/i.exec(text) || /From:\s*(\S+@\S+)/i.exec(text);
    var rp = /Return-Path:\s*<([^>]+)>/i.exec(text);
    if (from && rp) {
      var fd = from[1].split("@")[1] || "", rd = rp[1].split("@")[1] || "";
      var aligned = fd.toLowerCase() === rd.toLowerCase();
      trace.push({ ok: aligned, id: "alignment", detail: aligned ? "From/Return-Path align (" + fd + ")"
        : "From " + fd + " does not align with envelope " + rd });
      if (!aligned && verdict === "PASS") verdict = "FAIL";
    } else trace.push({ ok: false, id: "alignment", detail: "From or Return-Path missing" });

    var hops = (text.match(/^Received:/gim) || []).length;
    trace.push({ ok: hops > 0, id: "hops", detail: hops + " Received header(s)" });
    if (spf !== "pass" && verdict === "PASS") verdict = "SUSPECT";
    return { verdict: verdict, trace: trace };
  }

  function initEmail() {
    var ta = document.getElementById("hdr");
    if (!ta) return;
    function run() {
      var out = analyse(ta.value);
      var v = document.getElementById("mail-verdict");
      v.textContent = out.verdict;
      v.setAttribute("data-v", out.verdict === "PASS" ? "ALLOW" : out.verdict === "FAIL" ? "DENY" : "APPROVAL");
      document.getElementById("mail-why").textContent =
        out.verdict === "PASS" ? "Authentication passed on the evidence provided."
        : out.verdict === "FAIL" ? "Do not trust this sender. Quarantine and verify out of band."
        : out.verdict === "SUSPECT" ? "Partially authenticated — treat links and attachments as untrusted."
        : "Insufficient evidence to conclude.";
      document.getElementById("mail-trace").innerHTML = out.trace.map(function (r) {
        return '<li data-r="' + (r.ok ? "pass" : "fail") + '"><b>' + (r.ok ? "PASS" : "STOP") +
          "</b><span>" + r.id + ": " + r.detail + "</span></li>";
      }).join("");
    }
    document.getElementById("hdr-run").addEventListener("click", run);
    document.getElementById("hdr-clear").addEventListener("click", function () {
      ta.value = ""; document.getElementById("mail-verdict").textContent = "—";
    });
    run();
  }

  /* ---------- planner ---------- */
  var STEPS = {
    email: ["Pull the thread and classify intent (billing / disclosure / noise)",
            "Extract the ask and any deadline into the evidence record",
            "Draft a reply — no send until a named approver signs",
            "Attach the scan and policy record to the draft"],
    patch: ["Resolve the advisory set for the named package and version",
            "Diff the fixed-version plan and blast radius",
            "Prepare the branch and test command — execution needs approval",
            "Re-scan after merge and record the retest evidence"],
    scan: ["Confirm written authorization and scope boundary",
           "Enumerate manifests and exact versions",
           "Query OSV + KEV + EPSS, compute CVSS from vectors",
           "Write patch plans and an evidence pack"],
    meet: ["Read the thread for participants and constraints",
           "Propose two slots inside working hours",
           "Hold the slot only after confirmation",
           "Log the commitment in the evidence record"],
    def: ["Restate the goal as an authorized action with a named scope",
          "Gather the tenant-scoped evidence needed to act",
          "Prepare the change and its verification command",
          "Stop at the approval gate and record the decision"]
  };

  function initPlanner() {
    var input = document.getElementById("goal");
    if (!input) return;
    function render() {
      var g = (input.value || "").toLowerCase();
      var kind = /email|thread|inbox|reply/.test(g) ? "email"
        : /patch|upgrade|fix|undici|vite|zod/.test(g) ? "patch"
        : /scan|audit|find|vuln/.test(g) ? "scan"
        : /meet|schedule|calendar|slot/.test(g) ? "meet" : "def";
      var steps = STEPS[kind];
      document.getElementById("plan").innerHTML = steps.map(function (s, i) {
        return "<li>" + s + (i >= steps.length - 2 ? ' <span class="badge" data-s="DECLARED">approval gate</span>' : "") + "</li>";
      }).join("");
    }
    document.getElementById("goal-run").addEventListener("click", render);
    render();
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav(); initPalette(); initGraph(); initPolicy(); initScans(); initBars();
    initEmail(); initPlanner(); initReveal();
  });
})();
