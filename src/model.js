      const PARTY_INFO = {
        EL: { name: "Enhedslisten", color: "#fbb4ba", lr: -3.0 },
        ALT: { name: "Alternativet", color: "#f7c2cb", lr: -2.5 },
        SF: { name: "Socialistisk Folkeparti", color: "#f4cfd5", lr: -2.3 },
        S: { name: "Socialdemokratiet", color: "#f1dbdf", lr: -2.2 },
        IA: { name: "Inuit Ataqatigiit", color: "#eee8e9", lr: -2.0 },
        T: { name: "Tjóðveldi", color: "#eeeaea", lr: -1.7 },
        B: { name: "Radikale Venstre", color: "#eceded", lr: -0.5 },
        M: { name: "Moderaterne", color: "#e6ebee", lr: 0.0 },
        UFG: { name: "Uden for grupperne", color: "#ededed", lr: 0.6 },
        V: { name: "Venstre", color: "#e2e9ef", lr: 1.2 },
        C: { name: "Det Konservative Folkeparti", color: "#cae4f1", lr: 2.3 },
        LA: { name: "Liberal Alliance", color: "#afd7ec", lr: 2.4 },
        DD: { name: "Danmarksdemokraterne", color: "#a3c9dd", lr: 2.5 },
        DF: { name: "Dansk Folkeparti", color: "#91bcd2", lr: 2.6 },
        NB: { name: "Nye Borgerlige", color: "#9fcbe0", lr: 3.0 },
      };

      function normalizePartyColor(party, fallbackIdx) {
        const info = PARTY_INFO[party];
        if (info) return { color: info.color, lr: info.lr ?? 0, name: info.name ?? party };
        const palette = ["#94a3b8", "#38bdf8", "#a78bfa", "#f472b6", "#facc15", "#34d399", "#fb7185"];
        const color = palette[fallbackIdx % palette.length];
        return { color, lr: 0, name: party };
      }

      const $viz = d3.select("#viz");
      const tooltip = d3.select("#tooltip");
      const sidePanel = {
        root: document.getElementById("sidePanel"),
        title: document.getElementById("selectedTitle"),
        sub: document.getElementById("selectedSub"),
        search: document.getElementById("panelSearch"),
        body: document.getElementById("panelBody"),
      };
      const layoutEl = document.getElementById("layout");
      const partyFilterBar = document.getElementById("partyFilterBar");
      const partyResetBtn = document.getElementById("partyReset");
      const panelCloseBtn = document.getElementById("panelCloseBtn");

      let activeParty = null;
      let selectedNode = null;
      let selectedPropositions = [];
      let activeProposalId = null;

      function updateSidePanel() {
        if (!selectedNode) {
          activeProposalId = null;
          layoutEl.classList.remove("panel-open");
          sidePanel.title.textContent = "Select a node";
          sidePanel.sub.textContent = "Click a politician to see their signed propositions.";
          sidePanel.search.value = "";
          sidePanel.search.disabled = true;
          sidePanel.body.innerHTML =
            '<div class="panelHint">Tip: use the party filter chips at the bottom to isolate a cluster.</div>';
          return;
        }

        layoutEl.classList.add("panel-open");
        const partyInfo = PARTY_INFO[selectedNode.party] || { name: selectedNode.party, color: "#94a3b8" };
        sidePanel.search.disabled = false;
        sidePanel.title.textContent = selectedNode.name;
        sidePanel.sub.textContent = `${partyInfo.name} (${selectedNode.party}) • ${selectedNode.count} lovforslag`;

        renderPropositionsList(sidePanel.search.value || "");
      }

      panelCloseBtn.addEventListener("click", () => {
        if (!selectedNode) return;
        selectedNode = null;
        selectedPropositions = [];
        activeProposalId = null;
        updateSidePanel();
        
        if (nodeSel && linkSel) updatePartyIsolation();
      });

      function renderPropositionsList(query) {
        function propositionTagFromUrl(url) {
          const u = (url || "").toLowerCase();
          if (u.includes("efter_2behandling")) return "Som optrykt efter 2. behandling";
          if (u.includes("fremsaettelsestale.htm")) return "Fremsaettelsestale";
          if (u.includes("som_fremsat.htm")) return "Som fremsat";
          if (u.includes("som_vedtaget.htm")) return "Som vedtaget";
          if (u.includes("index.htm")) return "Som fremsat";
          return null;
        }

        const q = (query || "").trim().toLowerCase();
        const list = q
          ? selectedPropositions.filter((p) => {
              const hay = `${p.title} ${p.year} ${p.url}`.toLowerCase();
              return hay.includes(q);
            })
          : selectedPropositions;

        const frag = document.createDocumentFragment();
        const clickHint = document.createElement("div");
        clickHint.className = "panelHint";
        clickHint.textContent = "Klik på et lovforslag for at se hvilke folketingsmedlemmer, der står bag.";
        frag.appendChild(clickHint);

        if (list.length === 0) {
          const el = document.createElement("div");
          el.className = "panelHint";
          el.textContent = "Ingen forslag matcher din søgning.";
          frag.appendChild(el);
        } else {
          for (const p of list) {
            const item = document.createElement("div");
            item.className = "propItem";

            const title = document.createElement("div");
            title.className = "propTitle";
            const titleBtn = document.createElement("button");
            titleBtn.type = "button";
            titleBtn.className = "propTitleBtn";
            if (activeProposalId === p._id) titleBtn.classList.add("active");
            titleBtn.textContent = p.title || "Untitled proposition";
            titleBtn.addEventListener("click", () => {
              activeProposalId = activeProposalId === p._id ? null : p._id;
              updatePartyIsolation();
              renderPropositionsList(sidePanel.search.value || "");
            });
            title.appendChild(titleBtn);

            const meta = document.createElement("div");
            meta.className = "propMeta";
            const year = document.createElement("span");
            year.textContent = `År: ${p.year}`;
            meta.appendChild(year);
            const tagText = propositionTagFromUrl(p.url);
            if (tagText) {
              const tag = document.createElement("span");
              tag.className = "propTag";
              tag.textContent = tagText;
              meta.appendChild(tag);
            }
            if (p.url) {
              const link = document.createElement("a");
              link.className = "propLink";
              link.href = p.url;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.textContent = "ft.dk";
              meta.appendChild(link);
            }

            item.appendChild(title);
            item.appendChild(meta);
            frag.appendChild(item);
          }
        }
        sidePanel.body.innerHTML = "";
        sidePanel.body.appendChild(frag);
      }

      function tooltipShow(node, event) {
        tooltip.style("display", "block");
        const partyCode = node.party;
        const info = PARTY_INFO[partyCode] || { name: partyCode, color: "#94a3b8" };
        tooltip.select(".tName").text(node.name);
        tooltip.select(".tMeta").text(`${info.name} (${partyCode}) • ${node.count} lovforslag`);
        tooltip
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY + 14 + "px");
      }

      function tooltipMove(event) {
        tooltip
          .style("left", event.clientX + 14 + "px")
          .style("top", event.clientY + 14 + "px");
      }

      function tooltipHide() {
        tooltip.style("display", "none");
      }

      sidePanel.search.addEventListener("input", () => {
        if (!selectedNode) return;
        renderPropositionsList(sidePanel.search.value || "");
      });

      partyResetBtn.addEventListener("click", () => {
        activeParty = null;
        updatePartyIsolation();
        partyFilterBar.querySelectorAll(".partyBtn.active").forEach((b) => b.classList.remove("active"));
      });

      let simulation;
      let nodeSel;
      let linkSel;
      let nodes = [];
      let links = [];
      let propById = [];
      let partyCodes = [];
      let partyColorByCode = new Map();
      let partyXByCode = new Map();
      let partyYByCode = new Map();

      function computePartyTargets(width, height) {
        partyXByCode = new Map();
        partyYByCode = new Map();
        partyColorByCode = new Map();

        const unique = partyCodes.slice();
        const withLr = unique.map((p, idx) => {
          const info = normalizePartyColor(p, idx);
          return { p, ...info, idx };
        });

        const left = withLr.filter((x) => x.lr < 0);
        const right = withLr.filter((x) => x.lr >= 0);

        const partyOrder = Object.keys(PARTY_INFO);
        const orderIndex = new Map(partyOrder.map((p, i) => [p, i]));
        const orderOf = (p) => orderIndex.get(p) ?? 1e9;

        left.sort((a, b) => orderOf(a.p) - orderOf(b.p));
        right.sort((a, b) => orderOf(a.p) - orderOf(b.p));

        const maxX = (width / 2 - 90) * 0.5;
        const yBand = Math.max(26, Math.min(44, height / Math.max(6, unique.length)));

        const yCompression = 0.15;

        function assignSide(sideArr, sideSign) {
          for (let i = 0; i < sideArr.length; i++) {
            const item = sideArr[i];
            partyColorByCode.set(item.p, item.color);

            const t = sideArr.length === 1 ? 0.5 : i / (sideArr.length - 1); 
            const x = sideSign < 0 ? -maxX + t * maxX : t * maxX;
            partyXByCode.set(item.p, x);

            const mid = (sideArr.length - 1) / 2;
            partyYByCode.set(item.p, (i - mid) * yBand * yCompression);
          }
        }

        assignSide(left, -1);
        assignSide(right, 1);
      }

      function updatePartyIsolation() {
        const isPartyActive = activeParty !== null && activeParty !== undefined;
        const isProposalActive = Number.isInteger(activeProposalId);
        const proposalNodeIds = isProposalActive
          ? new Set(nodes.filter((n) => Array.isArray(n.propIds) && n.propIds.includes(activeProposalId)).map((n) => n.id))
          : null;

        const nodeIdFromLinkEnd = (end) => (typeof end === "object" && end !== null ? end.id : end);

        linkSel.attr("opacity", (d) => {
          let opacity = 1;
          if (isPartyActive) {
            opacity = d.sourceParty === activeParty || d.targetParty === activeParty ? 0.25 : 0.03;
          }
          if (isProposalActive) {
            const sourceId = nodeIdFromLinkEnd(d.source);
            const targetId = nodeIdFromLinkEnd(d.target);
            const keep = proposalNodeIds.has(sourceId) && proposalNodeIds.has(targetId);
            opacity = keep ? Math.max(opacity, 0.28) : Math.min(opacity, 0.02);
          }
          return opacity;
        });

        nodeSel.attr("opacity", (d) => {
          let opacity = 1;
          if (isPartyActive) {
            opacity = d.party === activeParty ? 1 : 0.07;
          }
          if (isProposalActive && !proposalNodeIds.has(d.id)) {
            opacity = Math.min(opacity, 0.04);
          }
          return opacity;
        });

        if (selectedNode && isPartyActive && selectedNode.party !== activeParty) {
          nodeSel.classed("selected", (d) => d.id === selectedNode.id && d.party === activeParty);
        } else {
          nodeSel.classed("selected", (d) => selectedNode && d.id === selectedNode.id);
        }
      }

      function buildPartyFilterUI() {
        const filterChips = [];
        const seen = new Set();
        for (const p of partyCodes) {
          if (seen.has(p)) continue;
          seen.add(p);
          filterChips.push(p);
        }

        const old = partyFilterBar.querySelectorAll(".partyBtn[data-party]");
        old.forEach((n) => n.remove());

        for (let i = 0; i < filterChips.length; i++) {
          const p = filterChips[i];
          const info = normalizePartyColor(p, i);
          partyColorByCode.set(p, info.color);

          const btn = document.createElement("button");
          btn.className = "partyBtn";
          btn.type = "button";
          btn.dataset.party = p;

          const dot = document.createElement("span");
          dot.className = "partyDot";
          dot.style.background = info.color;

          const label = document.createElement("span");
          label.textContent = p;

          btn.appendChild(dot);
          btn.appendChild(label);
          btn.addEventListener("click", () => {
            activeParty = p;
            partyFilterBar.querySelectorAll(".partyBtn.active").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            updatePartyIsolation();
          });

          partyFilterBar.appendChild(btn);
        }
      }

      function renderGraph(raw) {
        nodes = raw.politicians.map((p) => ({
          id: p.id,
          name: p.name,
          party: p.party,
          propIds: p.propIds,
          count: p.propIds.length,
        }));
        propById = raw.propositions;

        const nodeById = new Map(nodes.map((n) => [n.id, n]));

        links = raw.edges
          .map((e) => {
            if (!nodeById.has(e.source) || !nodeById.has(e.target)) return null;
            return {
              source: e.source,
              target: e.target,
              weight: e.weight,
              sourceParty: nodeById.get(e.source).party,
              targetParty: nodeById.get(e.target).party,
            };
          })
          .filter(Boolean);

        partyCodes = Array.from(new Set(nodes.map((d) => d.party))).sort((a, b) => {
          const la = (PARTY_INFO[a] && PARTY_INFO[a].lr) ?? 0;
          const lb = (PARTY_INFO[b] && PARTY_INFO[b].lr) ?? 0;
          return la - lb;
        });

        const { width, height } = $viz.node().getBoundingClientRect();
        computePartyTargets(width, height);

        const maxCount = d3.max(nodes, (d) => d.count) || 1;
        const rFor = (d) => 2.2 + Math.sqrt(d.count) * 0.7;
        const radius = new Map(nodes.map((d) => [d.id, rFor(d)]));

        $viz.selectAll("*").remove();
        $viz.attr("viewBox", `0 0 ${width} ${height}`);

        const graphLayer = $viz.append("g").attr("class", "graphLayer");

        const zoom = d3
          .zoom()
          .scaleExtent([0.25, 4])
          .on("start", () => {
            
            if (simulation) simulation.stop();
          })
          .on("zoom", (event) => {
            graphLayer.attr("transform", event.transform);
          })
          .on("end", () => {
            
            if (simulation) simulation.alpha(0.4).restart();
          });

        $viz.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1));

        const linkLayer = graphLayer.append("g").attr("class", "links");
        linkSel = linkLayer
          .selectAll("line")
          .data(links)
          .enter()
          .append("line")
          .attr("class", "edge")
          .attr("stroke-width", (d) => 0.35 + Math.log2(d.weight + 1) * 0.6)
          .attr("opacity", 1);

        const nodeLayer = graphLayer.append("g").attr("class", "nodes");
        nodeSel = nodeLayer
          .selectAll("circle")
          .data(nodes)
          .enter()
          .append("circle")
          .attr("class", "node")
          .attr("r", (d) => radius.get(d.id))
          .attr("fill", (d) => partyColorByCode.get(d.party) || "#94a3b8")
          .on("mouseover", function (event, d) {
            tooltipShow(d, event);
          })
          .on("mousemove", function (event) {
            tooltipMove(event);
          })
          .on("mouseout", function () {
            tooltipHide();
          })
          .on("click", function (event, d) {
            selectedNode = d;
            selectedPropositions = d.propIds
              .map((pid) => {
                const p = propById[pid];
                if (!p) return null;
                return { ...p, _id: pid };
              })
              .filter(Boolean);
            activeProposalId = null;

            updateSidePanel();
            nodeSel.classed("selected", (x) => x.id === d.id);
          });

        const maxLinksDistance = 120;
        const minLinksDistance = 55;

        simulation = d3
          .forceSimulation(nodes)
          .force(
            "link",
            d3
              .forceLink(links)
              .id((d) => d.id)
              .distance((d) => {
                const t = Math.min(1, d.weight / 10);
                return minLinksDistance + (1 - t) * (maxLinksDistance - minLinksDistance);
              })
              .strength((d) => 0.05 + Math.min(0.18, d.weight * 0.01))
          )
          .force("charge", d3.forceManyBody().strength(-26))
          .force("x", d3.forceX((d) => partyXByCode.get(d.party) || 0).strength(0.7))
          .force("y", d3.forceY((d) => partyYByCode.get(d.party) || 0).strength(0.18))
          .force("collide", d3.forceCollide((d) => radius.get(d.id) + 3).iterations(2))
          .alpha(1)
          .alphaDecay(0.06)
          .on("tick", () => {
            linkSel
              .attr("x1", (d) => d.source.x)
              .attr("y1", (d) => d.source.y)
              .attr("x2", (d) => d.target.x)
              .attr("y2", (d) => d.target.y);

            nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
          });

        buildPartyFilterUI();
        updateSidePanel();
        updatePartyIsolation();

        document.getElementById("zoomIn").onclick = () => {
          $viz.transition().duration(200).call(zoom.scaleBy, 1.2);
        };
        document.getElementById("zoomOut").onclick = () => {
          $viz.transition().duration(200).call(zoom.scaleBy, 1 / 1.2);
        };
        document.getElementById("resetView").onclick = () => {
          $viz.transition().duration(300).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
          );
        };

        window.addEventListener("resize", () => {
          const rect = $viz.node().getBoundingClientRect();
          const nw = rect.width;
          const nh = rect.height;
          computePartyTargets(nw, nh);
          simulation
            .force("x", d3.forceX((d) => partyXByCode.get(d.party) || 0).strength(0.7))
            .force("y", d3.forceY((d) => partyYByCode.get(d.party) || 0).strength(0.18));
          simulation.alpha(0.4).restart();
        });
      }

      async function buildRawDataFromDataJs(rawRows) {
        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          throw new Error("data.js RAW_DATA is missing or empty");
        }

        const propKeyToId = new Map();
        const propositions = [];
        const nodeMap = new Map(); 
        const edgeMap = new Map(); 
        const yearFrom = 2005;
        const yearTo = 2025;

        function getPropId(title, url, year) {
          const key = `${title}|||${url}|||${year}`;
          const existing = propKeyToId.get(key);
          if (existing !== undefined) return existing;
          const id = propositions.length;
          propKeyToId.set(key, id);
          propositions.push({ title, year: String(year), url });
          return id;
        }

        for (const row of rawRows) {
          const title = (row && row.title ? String(row.title) : "").trim();
          const url = (row && row.url ? String(row.url) : "").trim();
          const yearRaw = (row && row.year ? String(row.year) : "").trim();
          const year = parseInt(yearRaw, 10);
          if (!title && !url) continue;
          if (!Number.isFinite(year) || year < yearFrom || year > yearTo) continue;

          const persons = Array.isArray(row.persons) ? row.persons : [];
          const signers = [];
          const seenSigner = new Set();

          for (const person of persons) {
            const name = (person && person.name ? String(person.name) : "").trim();
            const party = (person && person.party ? String(person.party) : "UNK").trim() || "UNK";
            if (!name) continue;
            const signerKey = `${name}|${party}`;
            if (seenSigner.has(signerKey)) continue;
            seenSigner.add(signerKey);
            signers.push({ name, party });
          }
          if (signers.length === 0) continue;

          const propId = getPropId(title, url, year);

          for (const signer of signers) {
            const nodeId = `${signer.name}|${signer.party}`;
            let entry = nodeMap.get(nodeId);
            if (!entry) {
              entry = { id: nodeId, name: signer.name, party: signer.party, propIds: new Set() };
              nodeMap.set(nodeId, entry);
            }
            entry.propIds.add(propId);
          }

          const primary = signers[0];
          const sourceId = `${primary.name}|${primary.party}`;
          for (let i = 1; i < signers.length; i++) {
            const target = signers[i];
            const targetId = `${target.name}|${target.party}`;
            const edgeKey = `${sourceId}||${targetId}`;
            edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
          }
        }

        const politicians = Array.from(nodeMap.values()).map((e) => ({
          id: e.id,
          name: e.name,
          party: e.party,
          propIds: Array.from(e.propIds.values()),
        }));

        const edges = Array.from(edgeMap.entries()).map(([k, weight]) => {
          const [source, target] = k.split("||");
          return { source, target, weight };
        });

        return {
          partyInfo: PARTY_INFO,
          propositions,
          politicians,
          edges,
        };
      }

      async function boot() {
        sidePanel.title.textContent = "Loading data...";
        sidePanel.sub.textContent = "Preparing proposition network (2005–2025)...";
        sidePanel.search.disabled = true;

        try {
          if (typeof RAW_DATA === "undefined" || !Array.isArray(RAW_DATA)) {
            throw new Error("data.js did not expose RAW_DATA");
          }
          const graphData = await buildRawDataFromDataJs(RAW_DATA);
          renderGraph(graphData);
        } catch (err) {
          console.error("Failed to initialize graph from data.js", err);
          sidePanel.title.textContent = "Failed to load visualization data";
          sidePanel.sub.textContent = "Ensure `data.js` is present and defines RAW_DATA.";
          sidePanel.search.disabled = true;
          sidePanel.body.innerHTML = "";
        }
      }

      boot().catch((err) => {
        console.error(err);
        sidePanel.title.textContent = "Failed to load visualization data";
        sidePanel.sub.textContent = "Check your browser support and ensure `data.js` is valid.";
        sidePanel.search.disabled = true;
        sidePanel.body.innerHTML = "";
      });
