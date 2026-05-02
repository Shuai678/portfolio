gsap.registerPlugin(ScrollTrigger);

// ============================================================
// DEVICE / PERFORMANCE FLAGS
// ============================================================
const IS_MOBILE = window.matchMedia('(max-width: 900px)').matches;
const IS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARTICLE_FACTOR = IS_MOBILE ? 0.4 : 1;

// ============================================================
// THREE.JS SETUP — single scene, lightweight, no shadows
// ============================================================
const stageEl = document.getElementById('stage');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06080c, 0.022);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: !IS_MOBILE,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);
stageEl.appendChild(renderer.domElement);

// Lights — kept minimal, no shadows
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const keyL = new THREE.DirectionalLight(0x66e5ff, 1.0); keyL.position.set(5, 5, 6); scene.add(keyL);
const fillL = new THREE.DirectionalLight(0xffb547, 0.6); fillL.position.set(-6, -3, 4); scene.add(fillL);

// ============================================================
// GLOBAL SMOOTH STATE — single source of truth
// All scroll input feeds into these "target" values; the render loop
// lerps the actual values toward them every frame for smooth motion.
// ============================================================
const M = {
  // mouse (smooth)
  mxT: 0, myT: 0,
  mx: 0, my: 0,
  // camera offset target/actual (driven by scrub timeline)
  camXT: 0, camYT: 0,
  camX: 0, camY: 0,
  // scene group offset (which side of screen the 3D sits on)
  // -1 = full left, 0 = center, +1 = full right
  zoneT: 0,
  zone: 0,
  // global scene scale damping when text appears
  scaleT: 1,
  scale: 1,
};

// Mouse with damped target
window.addEventListener('mousemove', (e) => {
  M.mxT = (e.clientX / innerWidth - 0.5) * 2;
  M.myT = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

// Lerp helper
const lerp = (a, b, t) => a + (b - a) * t;

// ============================================================
// SHARED ATMOSPHERE — light particle field, kept far back
// ============================================================
const ambientPCount = Math.floor(400 * PARTICLE_FACTOR);
const ambientPGeo = new THREE.BufferGeometry();
const apPos = new Float32Array(ambientPCount * 3);
for (let i = 0; i < ambientPCount; i++) {
  const r = 18 + Math.random() * 22;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  apPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  apPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  apPos[i * 3 + 2] = r * Math.cos(phi) - 8;
}
ambientPGeo.setAttribute('position', new THREE.BufferAttribute(apPos, 3));
const ambientPMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.018,
  transparent: true,
  opacity: 0.32,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const ambientParticles = new THREE.Points(ambientPGeo, ambientPMat);
scene.add(ambientParticles);

// ============================================================
// SCENE OPACITY HELPERS
// We tag each material's base opacity so we can fade groups uniformly.
// ============================================================
function tagOpacity(mat, base) {
  mat.userData.baseOpacity = base;
  mat.transparent = true;
  mat.opacity = 0;
  return mat;
}

function setGroupOpacity(group, op) {
  group.traverse(o => {
    if (o.material) {
      const apply = (m) => {
        if (m.userData && m.userData.baseOpacity !== undefined) {
          m.opacity = m.userData.baseOpacity * op;
        }
      };
      if (Array.isArray(o.material)) o.material.forEach(apply);
      else apply(o.material);
    }
  });
}

// ============================================================
// SCENE BUILDERS — each returns { group, update(t) }
// All scenes are designed to fit comfortably in roughly a
// 4-unit radius bubble so they never leak into the text zone.
// ============================================================

/* ---------- 0 · HERO — Identity Core ---------- */
function buildHero() {
  const g = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.2, roughness: 0.08,
      transmission: 0.85, thickness: 1.2, ior: 1.45,
      clearcoat: 1, clearcoatRoughness: 0.05,
    }), 0.95)
  );
  g.add(core);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.42, 1)),
    tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.45)
  );
  g.add(wire);

  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 0),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 0.65)
  );
  g.add(innerCore);

  // 3 floating identity cards (was 4) — less crowded
  const cards = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.5),
      tagOpacity(new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.5, thickness: 0.2,
        roughness: 0.3, side: THREE.DoubleSide,
      }), 0.16)
    );
    const angle = (i / 3) * Math.PI * 2;
    card.userData = { angle, r: 2.7, phase: Math.random() * Math.PI * 2 };
    cards.add(card);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(card.geometry),
      tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.28)
    );
    card.add(edge);
  }
  g.add(cards);

  // Smoothed inertia for hero rotation
  const inertia = { rotY: 0, rotYT: 0 };

  return {
    group: g,
    update: (t, dt) => {
      // Slow, calm rotation with inertia-style damping
      inertia.rotYT = t * 0.12;
      inertia.rotY = lerp(inertia.rotY, inertia.rotYT, 0.04);
      g.rotation.y = inertia.rotY;
      g.rotation.x = Math.sin(t * 0.3) * 0.04;

      innerCore.scale.setScalar(0.9 + Math.sin(t * 1.2) * 0.1);

      cards.children.forEach((c) => {
        const a = c.userData.angle + t * 0.12;
        c.position.x = Math.cos(a) * c.userData.r;
        c.position.z = Math.sin(a) * c.userData.r - 0.5;
        c.position.y = Math.sin(t * 0.5 + c.userData.phase) * 0.3;
        c.lookAt(0, 0, 0);
      });
    }
  };
}

/* ---------- 1 · LANGUAGES — orbiting badge plates ---------- */
function buildLanguages() {
  const g = new THREE.Group();

  const spine = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 0),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 0.8, thickness: 0.8, roughness: 0.1, ior: 1.4,
    }), 0.85)
  );
  g.add(spine);

  const spineWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.62, 0)),
    tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.45)
  );
  g.add(spineWire);

  const langs = [
    { glyph: '中文', sub: 'NATIVE', color: '#66e5ff' },
    { glyph: 'IT',   sub: 'NATIVE', color: '#ffb547' },
    { glyph: 'EN',   sub: 'B2',     color: '#eef1f5' },
  ];

  const badges = new THREE.Group();
  langs.forEach((lng, i) => {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    const cx = cv.getContext('2d');
    cx.fillStyle = 'rgba(10,14,21,0.85)';
    cx.fillRect(0, 0, 256, 256);
    cx.strokeStyle = lng.color;
    cx.lineWidth = 3;
    cx.strokeRect(8, 8, 240, 240);
    cx.fillStyle = lng.color;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.font = '700 110px "JetBrains Mono", monospace';
    cx.fillText(lng.glyph, 128, 120);
    cx.font = '500 22px "JetBrains Mono", monospace';
    cx.fillStyle = '#8590a0';
    cx.fillText(lng.sub, 128, 200);
    cx.strokeStyle = lng.color;
    cx.lineWidth = 2;
    [[24,24],[232,24],[24,232],[232,232]].forEach(([x,y]) => {
      cx.beginPath(); cx.moveTo(x-8,y); cx.lineTo(x+8,y); cx.moveTo(x,y-8); cx.lineTo(x,y+8); cx.stroke();
    });

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      tagOpacity(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), 1.0)
    );
    badge.userData.angle = (i / langs.length) * Math.PI * 2;
    badges.add(badge);
  });
  g.add(badges);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.006, 16, 160),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 0.35)
  );
  orbitRing.rotation.x = Math.PI / 2;
  g.add(orbitRing);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.05;
      spine.rotation.y = -t * 0.25;
      spine.rotation.x = t * 0.12;
      badges.children.forEach((b, i) => {
        const a = b.userData.angle + t * 0.18;  // slowed
        b.position.x = Math.cos(a) * 2.4;
        b.position.z = Math.sin(a) * 2.4;
        b.position.y = Math.sin(t * 0.4 + i * 1.5) * 0.18;
        b.lookAt(camera.position);
      });
    }
  };
}

/* ---------- 2 · W&H — Industrial dashboard ---------- */
function buildIndustrial() {
  const g = new THREE.Group();

  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1.8, 24, 1, true),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 0.6, thickness: 0.5, roughness: 0.2, side: THREE.DoubleSide,
    }), 0.35)
  );
  g.add(cyl);

  const gauges = new THREE.Group();
  for (let i = 0; i < 4; i++) {  // was 5
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45 + i * 0.12, 0.01, 12, 80),
      tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 0.5 - i * 0.06)
    );
    ring.position.y = i * 0.42 - 0.63;
    ring.rotation.x = Math.PI / 2;
    ring.userData.baseY = ring.position.y;
    gauges.add(ring);
  }
  g.add(gauges);

  const panels = new THREE.Group();
  const panelLabels = ['CALIB.json', 'log_2026.csv', 'PROCESS_03'];  // was 4
  panelLabels.forEach((label, i) => {
    const cv = document.createElement('canvas');
    cv.width = 384; cv.height = 128;
    const cx = cv.getContext('2d');
    cx.fillStyle = 'rgba(10,14,21,0.9)';
    cx.fillRect(0, 0, 384, 128);
    cx.strokeStyle = '#66e5ff';
    cx.lineWidth = 1.5;
    cx.strokeRect(4, 4, 376, 120);
    cx.fillStyle = 'rgba(102,229,255,0.15)';
    cx.fillRect(4, 4, 376, 24);
    cx.fillStyle = '#66e5ff';
    cx.font = '500 12px "JetBrains Mono", monospace';
    cx.textBaseline = 'middle';
    cx.fillText(label, 14, 16);
    cx.fillStyle = '#8590a0';
    cx.font = '400 11px "JetBrains Mono", monospace';
    ['> reading sensor[3]', '> drift = 0.0021 °C', '> within tolerance ✓', '> next cycle: 04:12']
      .forEach((ln, li) => cx.fillText(ln, 14, 50 + li * 16));

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.5),
      tagOpacity(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), 0.8)
    );
    const a = (i / panelLabels.length) * Math.PI * 2 + Math.PI / 4;
    p.userData = { angle: a, r: 2.2, baseY: (i - 1) * 0.55 };
    p.position.set(Math.cos(a) * p.userData.r, p.userData.baseY, Math.sin(a) * p.userData.r);
    p.lookAt(0, p.position.y, 0);
    panels.add(p);
  });
  g.add(panels);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.06;
      cyl.rotation.y = -t * 0.25;
      gauges.children.forEach((r, i) => {
        r.position.y = r.userData.baseY + Math.sin(t * 0.5 + i) * 0.025;
        r.rotation.z = t * (0.1 + i * 0.03);
      });
      panels.children.forEach((p, i) => {
        p.position.y = p.userData.baseY + Math.sin(t * 0.3 + i) * 0.06;
      });
    }
  };
}

/* ---------- 3 · MUST — wireframe globe + arcs ---------- */
function buildGlobe() {
  const g = new THREE.Group();

  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.SphereGeometry(1.4, 22, 16)),
    tagOpacity(new THREE.LineBasicMaterial({ color: 0xffb547 }), 0.35)
  );
  g.add(globe);

  const globeFill = new THREE.Mesh(
    new THREE.SphereGeometry(1.36, 32, 24),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffb547, transmission: 0.5, thickness: 0.5, roughness: 0.3,
    }), 0.07)
  );
  g.add(globeFill);

  const nodes = new THREE.Group();
  const nodePositions = [];
  for (let i = 0; i < 8; i++) {  // was 12
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 1.42;
    const pos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    nodePositions.push(pos);

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      tagOpacity(new THREE.MeshBasicMaterial({ color: 0xffb547 }), 1)
    );
    node.position.copy(pos);
    node.userData.phase = Math.random() * Math.PI * 2;
    nodes.add(node);
  }
  g.add(nodes);

  const arcs = new THREE.Group();
  for (let i = 0; i < 5; i++) {  // was 8
    const a = nodePositions[Math.floor(Math.random() * nodePositions.length)];
    const b = nodePositions[Math.floor(Math.random() * nodePositions.length)];
    if (a.equals(b)) continue;
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(2);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const points = curve.getPoints(36);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arc = new THREE.Line(arcGeo, tagOpacity(
      new THREE.LineBasicMaterial({ color: 0x66e5ff, blending: THREE.AdditiveBlending }), 0.5
    ));
    arc.userData.phase = Math.random() * Math.PI * 2;
    arcs.add(arc);
  }
  g.add(arcs);

  // Outer AI particles (slim ring)
  const aiCount = Math.floor(40 * PARTICLE_FACTOR);
  const aiGeo = new THREE.BufferGeometry();
  const aiPos = new Float32Array(aiCount * 3);
  const aiSeeds = [];
  for (let i = 0; i < aiCount; i++) {
    const r = 2.2 + Math.random() * 0.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    aiPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    aiPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    aiPos[i*3+2] = r * Math.cos(phi);
    aiSeeds.push({ r, theta, phi, speed: 0.15 + Math.random() * 0.15 });
  }
  aiGeo.setAttribute('position', new THREE.BufferAttribute(aiPos, 3));
  const aiPoints = new THREE.Points(aiGeo, tagOpacity(new THREE.PointsMaterial({
    color: 0xffb547, size: 0.04, blending: THREE.AdditiveBlending, depthWrite: false,
  }), 0.7));
  aiPoints.userData.seeds = aiSeeds;
  g.add(aiPoints);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.06;
      globe.rotation.y = -t * 0.04;
      globeFill.rotation.y = -t * 0.04;
      nodes.children.forEach((n) => {
        n.scale.setScalar(0.95 + Math.sin(t * 1.0 + n.userData.phase) * 0.25);
      });
      arcs.children.forEach((arc) => {
        const baseO = arc.material.userData.baseOpacity;
        // smoothed pulse
        const pulse = 0.5 + Math.sin(t * 0.5 + arc.userData.phase) * 0.4;
        arc.material.opacity = baseO * pulse * (setGroupOpacity._currentScale || 1);
      });
      const arr = aiPoints.geometry.attributes.position.array;
      aiPoints.userData.seeds.forEach((s, i) => {
        const theta = s.theta + t * s.speed * 0.2;
        arr[i*3]   = s.r * Math.sin(s.phi) * Math.cos(theta);
        arr[i*3+1] = s.r * Math.sin(s.phi) * Math.sin(theta);
        arr[i*3+2] = s.r * Math.cos(s.phi);
      });
      aiPoints.geometry.attributes.position.needsUpdate = true;
    }
  };
}

/* ---------- 4 · LIARS BAR — distributed network ---------- */
function buildNetwork() {
  const g = new THREE.Group();

  const server = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0x66e5ff, metalness: 0.3, roughness: 0.15,
      transmission: 0.6, thickness: 0.5, ior: 1.4,
    }), 0.85)
  );
  g.add(server);

  const serverWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.52, 0)),
    tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.6)
  );
  g.add(serverWire);

  const clients = new THREE.Group();
  const clientCount = 4;  // was 5
  const clientPositions = [];
  for (let i = 0; i < clientCount; i++) {
    const angle = (i / clientCount) * Math.PI * 2;
    const r = 2.2;
    const pos = new THREE.Vector3(
      Math.cos(angle) * r,
      Math.sin(i * 1.7) * 0.4,
      Math.sin(angle) * r
    );
    clientPositions.push(pos);

    const client = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      tagOpacity(new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.7, thickness: 0.4, roughness: 0.2,
      }), 0.8)
    );
    client.position.copy(pos);
    client.userData.angle = angle;
    client.userData.baseY = pos.y;
    clients.add(client);

    const cw = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.22, 0)),
      tagOpacity(new THREE.LineBasicMaterial({ color: 0xffb547 }), 0.45)
    );
    cw.position.copy(pos);
    cw.userData = client.userData;
    clients.add(cw);
  }
  g.add(clients);

  const lines = new THREE.Group();
  clientPositions.forEach((pos) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), pos.clone()]);
    const ln = new THREE.Line(lineGeo, tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.3));
    lines.add(ln);
  });
  g.add(lines);

  // Message packets
  const packets = new THREE.Group();
  for (let i = 0; i < clientCount * 2; i++) {
    const pkt = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      tagOpacity(new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x66e5ff : 0xffb547 }), 1)
    );
    pkt.userData.clientIdx = i % clientCount;
    pkt.userData.t = Math.random();
    pkt.userData.speed = 0.18 + Math.random() * 0.15;
    pkt.userData.dir = i % 2 === 0 ? 1 : -1;
    packets.add(pkt);
  }
  g.add(packets);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.05;
      server.rotation.y = t * 0.35;
      server.rotation.x = t * 0.18;
      serverWire.rotation.y = t * 0.35;
      serverWire.rotation.x = t * 0.18;

      clients.children.forEach((c) => {
        c.position.y = c.userData.baseY + Math.sin(t * 0.5 + c.userData.angle) * 0.08;
      });

      lines.children.forEach((ln, i) => {
        const baseO = ln.material.userData.baseOpacity;
        const pulse = 0.6 + Math.sin(t * 1.0 + i) * 0.4;
        ln.material.opacity = baseO * pulse;
      });

      packets.children.forEach((pkt) => {
        pkt.userData.t += pkt.userData.speed * 0.008;  // slowed
        if (pkt.userData.t > 1) pkt.userData.t = 0;
        const target = clientPositions[pkt.userData.clientIdx];
        const tt = pkt.userData.dir > 0 ? pkt.userData.t : 1 - pkt.userData.t;
        pkt.position.x = target.x * tt;
        pkt.position.y = target.y * tt;
        pkt.position.z = target.z * tt;
      });
    }
  };
}

/* ---------- 5 · PROJECTS — pipeline + threads ---------- */
function buildPipelineThreads() {
  const g = new THREE.Group();

  const splitter = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.4, roughness: 0.1,
      transmission: 0.8, thickness: 0.5,
    }), 0.85)
  );
  g.add(splitter);

  // pipeline boxes — top
  const pipeline = new THREE.Group();
  pipeline.position.y = 0.9;
  for (let i = 0; i < 5; i++) {  // was 6
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.2, 0.26),
      tagOpacity(new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transmission: 0.5, roughness: 0.25, thickness: 0.3,
      }), 0.7)
    );
    box.userData.t = i / 5;
    box.userData.speed = 0.2;
    pipeline.add(box);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(box.geometry),
      tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.55)
    );
    box.add(edge);
  }
  g.add(pipeline);

  // thread streams — bottom
  const threads = new THREE.Group();
  threads.position.y = -0.9;

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.0, 0.3),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0xffb547 }), 0.7)
  );
  threads.add(gate);

  const streamCount = 10;  // was 14
  const stream1 = new THREE.Group();
  const stream2 = new THREE.Group();
  for (let i = 0; i < streamCount; i++) {
    const p1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 1)
    );
    p1.userData.t = i / streamCount;
    p1.userData.speed = 0.15 + Math.random() * 0.04;
    stream1.add(p1);

    const p2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      tagOpacity(new THREE.MeshBasicMaterial({ color: 0xffb547 }), 1)
    );
    p2.userData.t = i / streamCount;
    p2.userData.speed = 0.15 + Math.random() * 0.04;
    stream2.add(p2);
  }
  threads.add(stream1);
  threads.add(stream2);

  const railMat = tagOpacity(new THREE.LineBasicMaterial({ color: 0xffffff }), 0.12);
  const rail1 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.4, 0.35, 0), new THREE.Vector3(1.4, 0.35, 0)]),
    railMat.clone()
  );
  const rail2 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.4, -0.35, 0), new THREE.Vector3(1.4, -0.35, 0)]),
    railMat.clone()
  );
  threads.add(rail1);
  threads.add(rail2);
  g.add(threads);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = Math.sin(t * 0.1) * 0.1;
      splitter.rotation.y = t * 0.3;
      splitter.rotation.x = t * 0.18;

      pipeline.children.forEach((b) => {
        b.userData.t += b.userData.speed * 0.003;  // slower
        if (b.userData.t > 1) b.userData.t = 0;
        b.position.x = -1.4 + b.userData.t * 2.8;
        b.position.y = Math.sin(b.userData.t * Math.PI * 2) * 0.05;
        b.rotation.y = t * 0.3 + b.userData.t * 4;
      });

      stream1.children.forEach((p) => {
        p.userData.t += p.userData.speed * 0.003;
        if (p.userData.t > 1) p.userData.t = 0;
        p.position.x = -1.4 + p.userData.t * 2.8;
        const conv = Math.max(0, p.userData.t - 0.45) * 1.6;
        p.position.y = 0.35 - conv;
      });
      stream2.children.forEach((p) => {
        p.userData.t += p.userData.speed * 0.003;
        if (p.userData.t > 1) p.userData.t = 0;
        p.position.x = -1.4 + p.userData.t * 2.8;
        const conv = Math.max(0, p.userData.t - 0.45) * 1.6;
        p.position.y = -0.35 + conv;
      });

      const baseO = gate.material.userData.baseOpacity;
      gate.material.opacity = baseO * (0.7 + Math.sin(t * 1.6) * 0.2);
    }
  };
}

/* ---------- 6 · SKILLS — floating code panels ---------- */
function buildSkillPanels() {
  const g = new THREE.Group();

  const labels = [
    { lbl: 'C#',         color: '#66e5ff' },
    { lbl: 'C++',        color: '#66e5ff' },
    { lbl: 'Go',         color: '#ffb547' },
    { lbl: 'JavaScript', color: '#66e5ff' },
    { lbl: '.NET',       color: '#eef1f5' },
    { lbl: 'Networking', color: '#ffb547' },
    { lbl: 'Threads',    color: '#ffb547' },
  ];  // trimmed from 9 to 7

  const panels = [];
  labels.forEach((item, i) => {
    const cv = document.createElement('canvas');
    cv.width = 384; cv.height = 96;
    const cx = cv.getContext('2d');
    cx.fillStyle = 'rgba(10,14,21,0.92)';
    cx.fillRect(0, 0, 384, 96);
    cx.strokeStyle = item.color;
    cx.lineWidth = 2;
    cx.strokeRect(4, 4, 376, 88);
    cx.fillStyle = item.color;
    cx.fillRect(20, 38, 18, 2);
    cx.fillRect(20, 56, 8, 2);
    cx.fillStyle = '#eef1f5';
    cx.font = 'italic 500 32px "Fraunces", serif';
    cx.textBaseline = 'middle';
    cx.fillText(item.lbl, 60, 48);
    cx.fillStyle = item.color;
    cx.font = '500 11px "JetBrains Mono", monospace';
    cx.textAlign = 'right';
    cx.fillText(`SKILL · ${String(i+1).padStart(2,'0')}`, 366, 22);

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 8;
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      tagOpacity(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), 0.85)
    );
    const angle = (i / labels.length) * Math.PI * 2;
    panel.userData = {
      angle,
      baseY: (i - labels.length / 2) * 0.5,
      phase: Math.random() * Math.PI * 2,
      r: 1.5,
    };
    panels.push(panel);
    g.add(panel);
  });

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.06;
      panels.forEach((p) => {
        const a = p.userData.angle + t * 0.04;
        p.position.x = Math.cos(a) * p.userData.r;
        p.position.z = Math.sin(a) * p.userData.r;
        p.position.y = p.userData.baseY + Math.sin(t * 0.4 + p.userData.phase) * 0.08;
        p.lookAt(camera.position);
      });
    }
  };
}

/* ---------- 7 · CAPABILITIES — torus knot ---------- */
function buildCapabilities() {
  const g = new THREE.Group();

  const center = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.7, 0.15, 100, 16),
    tagOpacity(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.25, roughness: 0.15,
      transmission: 0.6, thickness: 0.4,
    }), 0.65)
  );
  g.add(center);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(0.72, 0.16, 100, 16)),
    tagOpacity(new THREE.LineBasicMaterial({ color: 0x66e5ff }), 0.35)
  );
  g.add(wire);

  const dots = new THREE.Group();
  for (let i = 0; i < 5; i++) {  // was 6
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 1)
    );
    d.userData.angle = (i / 5) * Math.PI * 2;
    d.userData.r = 2;
    dots.add(d);
  }
  g.add(dots);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = t * 0.08;
      g.rotation.x = Math.sin(t * 0.2) * 0.1;
      center.rotation.y = t * 0.18;
      wire.rotation.y = t * 0.18;
      dots.children.forEach((d) => {
        const a = d.userData.angle + t * 0.25;
        d.position.x = Math.cos(a) * d.userData.r;
        d.position.z = Math.sin(a) * d.userData.r;
        d.position.y = Math.sin(t * 0.5 + d.userData.angle) * 0.4;
      });
    }
  };
}

/* ---------- 8 · GOALS — three rising spires ---------- */
function buildGoals() {
  const g = new THREE.Group();

  const spires = [];
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 1.3, 6),
      tagOpacity(new THREE.MeshPhysicalMaterial({
        color: 0xffb547, metalness: 0.3, roughness: 0.2,
        transmission: 0.4, thickness: 0.4,
      }), 0.85)
    );
    sp.position.x = (i - 1) * 1.2;
    sp.userData.phase = i * 0.7;
    spires.push(sp);
    g.add(sp);

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.ConeGeometry(0.17, 1.3, 6)),
      tagOpacity(new THREE.LineBasicMaterial({ color: 0xffb547 }), 0.45)
    );
    wire.position.copy(sp.position);
    wire.userData = sp.userData;
    g.add(wire);
    spires.push(wire);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.006, 16, 160),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0xffb547 }), 0.25)
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.75;
  g.add(ring);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = Math.sin(t * 0.15) * 0.15;
      spires.forEach((s) => {
        s.position.y = Math.sin(t * 0.4 + s.userData.phase) * 0.1;
        s.rotation.y = t * 0.18 + s.userData.phase;
      });
    }
  };
}

/* ---------- 9 · CONTACT — final identity card ---------- */
function buildContact() {
  const g = new THREE.Group();

  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 432;
  const cx = cv.getContext('2d');
  const grad = cx.createLinearGradient(0, 0, 768, 432);
  grad.addColorStop(0, 'rgba(10,14,21,0.95)');
  grad.addColorStop(1, 'rgba(6,8,12,0.95)');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 768, 432);
  cx.strokeStyle = '#66e5ff';
  cx.lineWidth = 2;
  cx.strokeRect(12, 12, 744, 408);
  cx.lineWidth = 2;
  [[40,40],[728,40],[40,392],[728,392]].forEach(([x,y]) => {
    cx.beginPath(); cx.moveTo(x-12,y); cx.lineTo(x+12,y); cx.moveTo(x,y-12); cx.lineTo(x,y+12); cx.stroke();
  });
  cx.fillStyle = '#eef1f5';
  cx.font = '300 80px "Fraunces", serif';
  cx.textBaseline = 'top';
  cx.fillText('Nicolò', 60, 120);
  cx.font = 'italic 300 80px "Fraunces", serif';
  cx.fillStyle = '#66e5ff';
  cx.fillText('Shuai.', 60, 200);
  cx.fillStyle = '#8590a0';
  cx.font = '500 18px "JetBrains Mono", monospace';
  cx.fillText('CS · C# / C++ / Go · DISTRIBUTED SYSTEMS', 60, 320);
  cx.fillStyle = '#66e5ff';
  cx.fillText('AVAILABLE · 2026', 60, 350);

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.69),
    tagOpacity(new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), 0.85)
  );
  // push back so text in front always wins
  card.position.z = -1.5;
  g.add(card);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.006, 16, 200),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0x66e5ff }), 0.45)
  );
  ring.position.z = -1.7;
  g.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.004, 16, 200),
    tagOpacity(new THREE.MeshBasicMaterial({ color: 0xffb547 }), 0.3)
  );
  ring2.rotation.z = Math.PI / 4;
  ring2.position.z = -1.9;
  g.add(ring2);

  return {
    group: g,
    update: (t) => {
      g.rotation.y = Math.sin(t * 0.2) * 0.1 + M.mx * 0.08;
      g.rotation.x = Math.sin(t * 0.3) * 0.04 - M.my * 0.06;
      ring.rotation.z = t * 0.1;
      ring2.rotation.z = -t * 0.08;
    }
  };
}

// ============================================================
// BUILD ALL SCENES
// ============================================================
const sceneBuilders = [
  buildHero,         // 0
  buildLanguages,    // 1
  buildIndustrial,   // 2
  buildGlobe,        // 3
  buildNetwork,      // 4
  buildPipelineThreads, // 5
  buildSkillPanels,  // 6
  buildCapabilities, // 7
  buildGoals,        // 8
  buildContact,      // 9
];

const scenes = [];
sceneBuilders.forEach((b) => {
  const s = b();
  setGroupOpacity(s.group, 0);
  s.opacity = 0;        // current opacity (lerped)
  s.opacityT = 0;       // target opacity (set by scrub timeline)
  scene.add(s.group);
  scenes.push(s);
});

// First scene visible
scenes[0].opacityT = 1;

// ============================================================
// CONTINUOUS SCROLL TIMELINE — single timeline driven by overall scroll
// progress. We drive a "progress" value 0..1 mapped over the full page,
// and each scene's opacityT and the camera/zone targets are functions
// of that progress, with cosine-easing ramps for cinematic crossfades.
// ============================================================
const sectionEls = gsap.utils.toArray('section[data-step]');
const N = sectionEls.length; // 10

// Master progress ticker — uses ScrollTrigger.scrub for buttery smoothness.
// We don't tween properties inside; instead we read M_progress every frame
// in the render loop and compute opacities. This keeps a single source of
// truth and avoids competing tweens.
const Master = { progress: 0 };

ScrollTrigger.create({
  trigger: 'main',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1.4, // smooth scrub — adds inertia to scroll mapping
  onUpdate: (self) => {
    // tweening-inertia doesn't apply to scrub; we instead just store progress
    Master.progress = self.progress;
  }
});

// Section-anchored triggers — used only for: progress dot highlight,
// camera zone target, and stage-mask target. Easing of those values
// happens via M.* lerps in the render loop.
const zoneMap = {
  'center': 0,
  'right':  -0.55,  // 3D group sits to the LEFT of center, offset negative — wait, careful
  'left':   0.55,   // 3D group sits to the RIGHT of center
};
// Convention: data-zone = where the 3D BUBBLE goes.
// "right" means content-LEFT, 3D-RIGHT  → group.position.x = +offset
// "left" means content-RIGHT, 3D-LEFT  → group.position.x = -offset
const zoneOffset = (z) => z === 'right' ? 1 : z === 'left' ? -1 : 0;

const camTarget = { x: 0, y: 0, z: 10 };

// active scene index (which scene should be at full opacity NOW)
let activeIdx = 0;

sectionEls.forEach((sec, i) => {
  const zone = sec.dataset.zone || 'center';
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 70%',
    end: 'bottom 30%',
    onEnter: () => onSection(i, zone),
    onEnterBack: () => onSection(i, zone),
  });
});

function onSection(i, zone) {
  activeIdx = i;
  // smoothly target the zone
  const target = zoneOffset(zone);
  gsap.to(M, { zoneT: target, duration: 1.6, ease: 'expo.out', overwrite: 'auto' });

  // every scene fades — current scene opacityT=1, others 0
  scenes.forEach((s, idx) => {
    s.opacityT = (idx === i) ? 1 : 0;
  });

  // active progress dot
  document.querySelectorAll('.progress-item').forEach(el => el.classList.toggle('active', +el.dataset.i === i));

  // mask side
  const maskL = document.getElementById('mask-left');
  const maskR = document.getElementById('mask-right');
  const maskC = document.getElementById('mask-center');
  // when 3D is on RIGHT (zone 'right'), dim the LEFT to make text pop? No —
  // we want the text side BRIGHT, the 3D side natural, and a mask on the
  // text side to ensure 3D never overlaps. We dim the OPPOSITE side to
  // soften the 3D edge bleeding into text.
  if (zone === 'right') {
    // 3D on right → put a soft mask on the LEFT (text side) to absorb stray particles
    maskL.style.opacity = '0.85';
    maskR.style.opacity = '0';
    maskC.style.opacity = '0';
  } else if (zone === 'left') {
    maskL.style.opacity = '0';
    maskR.style.opacity = '0.85';
    maskC.style.opacity = '0';
  } else {
    maskL.style.opacity = '0';
    maskR.style.opacity = '0';
    maskC.style.opacity = '0.5';
  }
}

// ============================================================
// FADE-UP REVEALS — staggered, gentle
// ============================================================
gsap.utils.toArray('.fade-up').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

// progress click-to-scroll
document.querySelectorAll('.progress-item').forEach(el => {
  el.addEventListener('click', () => {
    const i = +el.dataset.i;
    if (sectionEls[i]) sectionEls[i].scrollIntoView({ behavior: 'smooth' });
  });
});

// ============================================================
// RENDER LOOP — single source of all per-frame motion
// All animation here uses lerp() for inertia.
// ============================================================
const clock = new THREE.Clock();

function tick() {
  const t = clock.getElapsedTime();

  // --- damped mouse (slow, smooth) ---
  M.mx = lerp(M.mx, M.mxT, 0.035);
  M.my = lerp(M.my, M.myT, 0.035);

  // --- damped zone position ---
  M.zone = lerp(M.zone, M.zoneT, 0.06);

  // --- damped scene opacities (cinematic crossfade) ---
  scenes.forEach((s) => {
    s.opacity = lerp(s.opacity, s.opacityT, 0.04); // slow fade ~ 1.5s feel
    if (s.opacity > 0.005) {
      setGroupOpacity(s.group, s.opacity);
    } else {
      setGroupOpacity(s.group, 0);
    }
  });

  // --- per-scene update — only update visible scenes ---
  scenes.forEach((s) => {
    if (s.opacity > 0.01) s.update(t);
  });

  // --- group offset: place each scene on its assigned side ---
  // The group offset is shared (we move ALL scenes together). The active
  // scene wins because others are at opacity ~0.
  // Convert M.zone (-1..+1) into a world-space x offset based on viewport.
  const offsetMagnitude = 2.6;  // units in 3D world
  const offsetX = M.zone * offsetMagnitude;
  scenes.forEach((s) => {
    // each scene group shares this offset
    s.group.position.x = offsetX + M.mx * 0.18;
    s.group.position.y = -M.my * 0.14;
  });

  // --- ambient particles drift slowly ---
  ambientParticles.rotation.y = t * 0.008 + M.mx * 0.025;
  ambientParticles.rotation.x = M.my * 0.02;

  // --- camera: very gentle parallax only (no big movement on scroll) ---
  camera.position.x = lerp(camera.position.x, M.mx * 0.25, 0.04);
  camera.position.y = lerp(camera.position.y, -M.my * 0.18, 0.04);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// ============================================================
// RESIZE — refresh ScrollTrigger after layout settles
// ============================================================
let resizeRAF;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    ScrollTrigger.refresh();
  });
});

// Refresh once after fonts/3D textures load (canvas textures generated synchronously,
// but fonts may shift layout; this ensures triggers are positioned correctly)
window.addEventListener('load', () => {
  setTimeout(() => ScrollTrigger.refresh(), 100);
});
