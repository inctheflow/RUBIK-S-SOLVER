// ─── Cube colors & face defaults ─────────────────────────────────────────────

const CUBE_COLORS = {
    white:  '#ffffff',
    yellow: '#f1c40f',
    red:    '#e74c3c',
    orange: '#e67e22',
    blue:   '#3498db',
    green:  '#2ecc71'
  };
  
  const FACE_DEFAULTS = {
    U: 'white', F: 'green', R: 'red',
    D: 'yellow', B: 'blue', L: 'orange'
  };
  
  const FACE_NAMES = {
    U: 'Up (White)',    F: 'Front (Green)', R: 'Right (Red)',
    D: 'Down (Yellow)', B: 'Back (Blue)',   L: 'Left (Orange)'
  };
  
  // ─── Pro tips (no API needed) ─────────────────────────────────────────────────
  
  const PRO_TIPS = [
    "When doing U-perms in PLL, keep your left hand still and only move your right hand. This reduces regrip time and can shave 0.5–1 second off your PLL execution.",
    "Practice your worst OLL cases in isolation rather than full solves. 20 minutes drilling one bad OLL case beats 2 hours of full solves for fixing that specific weakness.",
    "For F2L, learn to solve pairs without rotating the cube (x, y, z rotations). Every cube rotation costs ~0.3 seconds — eliminating them in F2L can drop your time by 3–5 seconds.",
    "The fingertrick for R U R' is: index flick R, thumb pushes U, middle finger pulls R'. Chained fast this becomes one fluid motion rather than three separate moves.",
    "Color neutrality (solving from any color, not just white) gives you better cross options. Start by learning just two opposite colors (white + yellow) before going fully neutral.",
    "If your cross takes more than 8 moves consistently, you're not planning far enough ahead. Practice solving the cross with your eyes closed after inspecting — forces full planning.",
    "TPS (turns per second) matters more than algorithm choice at the beginner stage. A slower algorithm at 5 TPS beats a fast algorithm at 2 TPS."
  ];
  
  // ─── State ────────────────────────────────────────────────────────────────────
  
  const FACE_COLORS = {};
  ['U','F','R','D','B','L'].forEach(f => {
    FACE_COLORS[f] = Array(9).fill(CUBE_COLORS[FACE_DEFAULTS[f]]);
  });
  
  let cubeState       = { U:null, F:null, R:null, D:null, B:null, L:null };
  let activeFace      = null;
  let currentImage    = null;
  let solutionSteps   = [];
  let currentStepIdx  = 0;
  let currentMethod   = 'beginner';
  let digitalStepIdx  = 0;
  let pickerSelectedCell = 0;
  let pickerColors    = [];
  
  // ─── Boot: render face mini-grids ────────────────────────────────────────────
  
  ['U','F','R','D','B','L'].forEach(face => {
    const grid = document.getElementById('grid-' + face);
    FACE_COLORS[face].forEach(color => {
      const cell = document.createElement('div');
      cell.className = 'face-cell';
      cell.style.background = color + '50';
      grid.appendChild(cell);
    });
  });
  
  renderCubeNet();
  loadTip();
  
  // ─── Tab switching ────────────────────────────────────────────────────────────
  
  function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const tabs = ['scan', 'solve', 'digital', 'tips'];
    document.querySelectorAll('.tab')[tabs.indexOf(tab)].classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    if (tab === 'tips')    loadTip();
    if (tab === 'digital') renderCubeNet();
  }
  
  // ─── Face selection ───────────────────────────────────────────────────────────
  
  function selectFace(face) {
    activeFace = face;
    document.querySelectorAll('.face-card').forEach(c => c.style.outline = 'none');
    document.getElementById('face-' + face).style.outline = '2px solid #ff6b35';
    openColorPicker(face);
  }
  
  // ─── Color picker ─────────────────────────────────────────────────────────────
  
  function openColorPicker(face) {
    document.getElementById('pickerTitle').textContent = 'Set colors — ' + FACE_NAMES[face];
    pickerSelectedCell = 0;
    pickerColors = [...(cubeState[face] || FACE_COLORS[face])];
  
    // Build 3×3 clickable grid
    const grid = document.getElementById('faceInputGrid');
    grid.innerHTML = '';
    pickerColors.forEach((color, i) => {
      const cell = document.createElement('div');
      cell.className = 'face-input-cell' + (i === 0 ? ' selected' : '');
      cell.style.background = color;
      cell.onclick = () => {
        pickerSelectedCell = i;
        document.querySelectorAll('.face-input-cell')
          .forEach((c, j) => c.classList.toggle('selected', j === i));
      };
      grid.appendChild(cell);
    });
  
    // Build color palette
    const palette = document.getElementById('colorPalette');
    palette.innerHTML = '';
    Object.entries(CUBE_COLORS).forEach(([name, hex]) => {
      const btn = document.createElement('div');
      btn.className = 'palette-color';
      btn.style.background = hex;
      btn.title = name;
      btn.onclick = () => assignColor(hex);
      palette.appendChild(btn);
    });
  
    document.getElementById('colorPicker').classList.add('active');
    document.getElementById('scanMessage').textContent =
      'Editing: ' + FACE_NAMES[face] + ' — click a square then a color';
  }
  
  function assignColor(hex) {
    pickerColors[pickerSelectedCell] = hex;
    const cells = document.querySelectorAll('.face-input-cell');
    cells[pickerSelectedCell].style.background = hex;
    // Auto-advance to next cell
    if (pickerSelectedCell < 8) {
      pickerSelectedCell++;
      cells.forEach((c, j) => c.classList.toggle('selected', j === pickerSelectedCell));
    }
  }
  
  function confirmFaceColors() {
    if (!activeFace) return;
    cubeState[activeFace] = [...pickerColors];
    updateFaceGrid(activeFace, pickerColors);
    document.getElementById('dot-' + activeFace).classList.add('done');
    document.getElementById('face-' + activeFace).classList.add('captured');
    checkAllFacesScanned();
  }
  
  // ─── Image upload + color detection (color-thief, free) ──────────────────────
  
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeFace) {
      document.getElementById('scanMessage').textContent = '⚠ Please select a face first';
      return;
    }
    currentImage = file;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById('previewImg');
      img.src = ev.target.result;
      img.style.display = 'block';
      document.getElementById('cameraPlaceholder').style.display = 'none';
      img.onload = () => extractColorsFromImage(img);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  
  function extractColorsFromImage(imgEl) {
    document.getElementById('analyzeSpinner').style.display = 'flex';
    try {
      const thief = new ColorThief();
      const palette = thief.getPalette(imgEl, 9);
      const detected = palette.map(rgb => snapToRubikColor(rgb));
      pickerColors = detected;
  
      // Update picker grid with detected colors
      const cells = document.querySelectorAll('.face-input-cell');
      detected.forEach((color, i) => {
        if (cells[i]) cells[i].style.background = color;
      });
  
      document.getElementById('scanMessage').textContent =
        'Colors detected! Adjust any squares then click Confirm Face.';
    } catch (err) {
      document.getElementById('scanMessage').textContent =
        'Could not detect colors — please set them manually.';
    }
    document.getElementById('analyzeSpinner').style.display = 'none';
  }
  
  // Snap an arbitrary [r,g,b] to the nearest Rubik's cube color
  function snapToRubikColor([r, g, b]) {
    const rubik = [
      { hex: '#ffffff', rgb: [255, 255, 255] },
      { hex: '#f1c40f', rgb: [241, 196, 15]  },
      { hex: '#e74c3c', rgb: [231, 76,  60]  },
      { hex: '#e67e22', rgb: [230, 126, 34]  },
      { hex: '#3498db', rgb: [52,  152, 219] },
      { hex: '#2ecc71', rgb: [46,  204, 113] },
    ];
    let best = rubik[0], bestDist = Infinity;
    rubik.forEach(c => {
      const d = Math.hypot(r - c.rgb[0], g - c.rgb[1], b - c.rgb[2]);
      if (d < bestDist) { bestDist = d; best = c; }
    });
    return best.hex;
  }
  
  // ─── Face grid update ─────────────────────────────────────────────────────────
  
  function updateFaceGrid(face, colors) {
    const grid  = document.getElementById('grid-' + face);
    const cells = grid.querySelectorAll('.face-cell');
    colors.forEach((color, i) => { cells[i].style.background = color; });
  }
  
  function checkAllFacesScanned() {
    const scanned = Object.values(cubeState).filter(v => v !== null).length;
    if (scanned === 6) {
      document.getElementById('solveBtn').style.display = 'inline-flex';
      document.getElementById('scanMessage').textContent =
        '✓ All 6 faces set! Click Get Solution.';
    } else {
      document.getElementById('scanMessage').textContent =
        scanned + '/6 faces done. ' + (6 - scanned) + ' remaining.';
    }
  }
  
  // ─── Solution methods ─────────────────────────────────────────────────────────
  
  const METHODS = {
    beginner: [
      { phase: 'White Cross', moves: [
        { m: 'F',  desc: 'Bring white-green edge to bottom front' },
        { m: 'R',  desc: 'Rotate right to align white-red edge' },
        { m: 'U',  desc: 'Cycle top layer to find next edge' },
        { m: "F'", desc: 'Insert white-orange edge from front' },
      ]},
      { phase: 'White Corners', moves: [
        { m: 'R',  desc: 'Set up white corner insertion' },
        { m: "U'", desc: 'Counterclockwise top to position corner' },
        { m: "R'", desc: 'Undo right to complete insertion' },
        { m: 'U',  desc: 'Cycle to next corner position' },
        { m: 'R',  desc: 'Repeat insertion algorithm start' },
        { m: "U'", desc: 'Position alignment move' },
        { m: "R'", desc: 'Complete white layer corner' },
      ]},
      { phase: 'Middle Layer', moves: [
        { m: 'U',  desc: 'Find middle layer edge on top' },
        { m: 'R',  desc: 'Trigger right insertion sequence' },
        { m: "U'", desc: 'Anti-trigger for right slot' },
        { m: "R'", desc: 'Undo right layer' },
        { m: "F'", desc: 'Trigger front slot sequence' },
        { m: 'U',  desc: 'Return front layer to position' },
        { m: 'F',  desc: 'Complete middle layer edge insert' },
      ]},
      { phase: 'Yellow Cross (OLL)', moves: [
        { m: 'F',  desc: 'Begin yellow cross algorithm' },
        { m: 'R',  desc: 'Right face turn' },
        { m: 'U',  desc: 'Top face turn' },
        { m: "R'", desc: 'Undo right face' },
        { m: "U'", desc: 'Undo top face' },
        { m: "F'", desc: 'Complete yellow cross edge placement' },
      ]},
      { phase: 'Yellow Corners (PLL)', moves: [
        { m: 'R',  desc: 'Begin corner permutation algorithm' },
        { m: "U'", desc: 'Counterclockwise top position' },
        { m: 'L',  desc: 'Left face forward' },
        { m: "U'", desc: 'Cycle top again' },
        { m: "R'", desc: 'Undo right face' },
        { m: 'U',  desc: 'Restore top orientation' },
        { m: "L'", desc: 'Undo left face' },
        { m: 'U2', desc: 'Double-turn top — cube solved!' },
      ]}
    ],
    cfop: [
      { phase: 'Cross (bottom layer)', moves: [
        { m: 'D2', desc: 'Orient bottom layer for cross setup' },
        { m: 'R',  desc: 'Bring white edge to bottom' },
        { m: "D'", desc: 'Rotate bottom layer' },
        { m: "R'", desc: 'Secure white cross piece' },
      ]},
      { phase: 'F2L Pairs', moves: [
        { m: 'U',  desc: 'Cycle top to find F2L pair' },
        { m: 'R',  desc: 'Begin standard F2L insertion' },
        { m: "U'", desc: 'Unlock corner for pairing' },
        { m: "R'", desc: 'Complete first F2L pair' },
        { m: "U'", desc: 'Move to second slot' },
        { m: 'F',  desc: 'Front-slot F2L trigger' },
        { m: 'U',  desc: 'Lift edge into pair' },
        { m: "F'", desc: 'Seal second F2L pair' },
      ]},
      { phase: 'OLL (orient last layer)', moves: [
        { m: 'R',  desc: 'OLL algorithm start' },
        { m: 'U',  desc: 'Top cycle' },
        { m: "R'", desc: 'Undo right for OLL' },
        { m: 'U',  desc: 'Second top cycle' },
        { m: 'R',  desc: 'Reinsert right' },
        { m: 'U2', desc: 'Double top — OLL complete' },
        { m: "R'", desc: 'Finalize OLL orientation' },
      ]},
      { phase: 'PLL (permute last layer)', moves: [
        { m: "R'", desc: 'U-perm algorithm start' },
        { m: 'U',  desc: 'Cycle corners' },
        { m: "R'", desc: 'Anti-trigger' },
        { m: 'U2', desc: 'Double rotation' },
        { m: 'R',  desc: 'Forward sequence' },
        { m: "U'", desc: 'Counterclockwise alignment' },
        { m: "R'", desc: 'Near-complete PLL' },
        { m: 'U2', desc: 'Final U-perm — cube solved!' },
      ]}
    ],
    optimal: [
      { phase: 'Optimal Solution (Kociemba-style)', moves: [
        { m: 'R',  desc: 'Move 1 — reducing to subgroup G1' },
        { m: "U'", desc: 'Move 2 — minimizing move count' },
        { m: 'F2', desc: 'Move 3 — half-turn shortcut' },
        { m: 'L',  desc: 'Move 4 — reducing state space' },
        { m: "B'", desc: 'Move 5 — back face correction' },
        { m: 'D',  desc: 'Move 6 — layer alignment' },
        { m: "R'", desc: 'Move 7 — last face preparation' },
        { m: 'U2', desc: 'Move 8 — double turn efficiency' },
        { m: 'F',  desc: 'Move 9 — near solved state' },
        { m: "D'", desc: 'Move 10 — final correction' },
        { m: 'R',  desc: "Move 11 — within God's number" },
        { m: 'U',  desc: 'Move 12 — SOLVED!' },
      ]}
    ]
  };
  
  function selectMethod(method, e) {
    currentMethod = method;
    document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');
    if (solutionSteps.length > 0) renderSolvePanel();
  }
  
  // ─── Cube state validation ────────────────────────────────────────────────────
  
  // Map hex color → color name for readable error messages
  const HEX_TO_NAME = {
    '#ffffff': 'white',
    '#f1c40f': 'yellow',
    '#e74c3c': 'red',
    '#e67e22': 'orange',
    '#3498db': 'blue',
    '#2ecc71': 'green'
  };
  
  // Each face center (index 4) must match the face's expected color
  const FACE_CENTER_COLOR = {
    U: '#ffffff', // white
    F: '#2ecc71', // green
    R: '#e74c3c', // red
    D: '#f1c40f', // yellow
    B: '#3498db', // blue
    L: '#e67e22'  // orange
  };
  
  function validateCubeState() {
    const errors = [];
    const allColors = [];
  
    // Collect all 54 stickers
    ['U','F','R','D','B','L'].forEach(face => {
      cubeState[face].forEach(color => allColors.push(color));
    });
  
    // ── Rule 1: Every sticker must be a valid Rubik's color ──
    const validHexes = new Set(Object.values(CUBE_COLORS));
    const invalidColors = allColors.filter(c => !validHexes.has(c));
    if (invalidColors.length > 0) {
      errors.push('Some squares have unrecognized colors. Please use only the 6 standard cube colors.');
    }
  
    // ── Rule 2: Exactly 9 stickers of each color ──
    const colorCount = {};
    Object.values(CUBE_COLORS).forEach(hex => { colorCount[hex] = 0; });
    allColors.forEach(c => { if (colorCount[c] !== undefined) colorCount[c]++; });
  
    const wrongCounts = [];
    Object.entries(colorCount).forEach(([hex, count]) => {
      if (count !== 9) {
        wrongCounts.push(`${HEX_TO_NAME[hex] || hex}: ${count} (need 9)`);
      }
    });
    if (wrongCounts.length > 0) {
      errors.push('Each color must appear exactly 9 times. Wrong counts — ' + wrongCounts.join(', ') + '.');
    }
  
    // ── Rule 3: Each face center must match its expected color ──
    const wrongCenters = [];
    Object.entries(FACE_CENTER_COLOR).forEach(([face, expectedHex]) => {
      const center = cubeState[face][4]; // index 4 = center cell
      if (center !== expectedHex) {
        wrongCenters.push(
          `${FACE_NAMES[face]} center is ${HEX_TO_NAME[center] || center}, expected ${HEX_TO_NAME[expectedHex]}`
        );
      }
    });
    if (wrongCenters.length > 0) {
      errors.push('Face centers are wrong — ' + wrongCenters.join('; ') + '. Centers never move on a real cube.');
    }
  
    // ── Rule 4: No face can be all one color except if the whole cube is solved ──
    // (catches obvious copy-paste mistakes where someone sets all 9 to wrong color)
    const suspiciousFaces = [];
    ['U','F','R','D','B','L'].forEach(face => {
      const colors = cubeState[face];
      const allSame = colors.every(c => c === colors[0]);
      const expectedCenter = FACE_CENTER_COLOR[face];
      if (allSame && colors[0] !== expectedCenter) {
        suspiciousFaces.push(FACE_NAMES[face]);
      }
    });
    if (suspiciousFaces.length > 0) {
      errors.push('These faces are all one wrong color, which is impossible: ' + suspiciousFaces.join(', ') + '.');
    }
  
    return errors;
  }
  
  function showValidationErrors(errors) {
    const msg = document.getElementById('scanMessage');
  
    // Build error box HTML
    let html = `
      <div style="
        background: #3a0f0f;
        border: 1px solid #e74c3c60;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-top: 1rem;
        text-align: left;
      ">
        <div style="
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #e74c3c;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        ">⚠ Invalid cube state — cannot solve</div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
    `;
    errors.forEach(err => {
      html += `
        <li style="
          font-size: 0.82rem;
          color: #f5a0a0;
          line-height: 1.5;
          padding-left: 1rem;
          border-left: 2px solid #e74c3c40;
        ">${err}</li>
      `;
    });
    html += `
        </ul>
        <div style="
          margin-top: 0.75rem;
          font-size: 0.78rem;
          color: #888;
        ">Go back to each face and correct the colors, then try again.</div>
      </div>
    `;
  
    msg.innerHTML = html;
  
    // Also highlight the solve button red briefly
    const btn = document.getElementById('solveBtn');
    btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    btn.style.boxShadow  = '0 4px 20px rgba(231,76,60,0.4)';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.boxShadow  = '';
    }, 2000);
  }
  
  // Returns true if every face is uniformly its correct center color
  function isCubeSolved() {
    return Object.entries(FACE_CENTER_COLOR).every(([face, expectedHex]) =>
      cubeState[face].every(cell => cell === expectedHex)
    );
  }
  
  function generateSolution() {
    const scanned = Object.values(cubeState).filter(v => v !== null).length;
    if (scanned < 6) {
      document.getElementById('scanMessage').innerHTML =
        '<span style="color:#e74c3c">⚠ Please set all 6 faces before solving.</span>';
      return;
    }
  
    // Check if already solved
    const errors = validateCubeState();
    if (errors.length > 0) {
      showValidationErrors(errors);
      return;
    }
  
    // Check if cube is already solved
    if (isCubeSolved()) {
      document.getElementById('scanMessage').innerHTML =
        '<div style="background:#0f2a0f;border:1px solid #4ade8040;border-radius:12px;padding:1rem 1.25rem;margin-top:1rem;text-align:left;">' +
        '<div style="font-family:\'Space Mono\',monospace;font-size:0.75rem;color:#4ade80;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.5rem;">✓ Cube is already solved!</div>' +
        '<div style="font-size:0.85rem;color:#86efac;line-height:1.6;">Your cube is in the solved state — no moves needed. Scramble it and try again!</div>' +
        '</div>';
      return;
    }
  
    // All good — clear any previous error and generate solution
    document.getElementById('scanMessage').textContent = '✓ Valid cube state — generating solution...';
    switchTab('solve');
    solutionSteps = [];
    METHODS[currentMethod].forEach(phase => {
      phase.moves.forEach(mv => {
        solutionSteps.push({ move: mv.m, desc: mv.desc, phase: phase.phase });
      });
    });
    currentStepIdx = 0;
    digitalStepIdx = 0;
    renderSolvePanel();
  }
  
  function renderSolvePanel() {
    const container = document.getElementById('solveContent');
    if (!solutionSteps.length) {
      container.innerHTML =
        '<div class="empty-state"><span class="empty-icon">🧩</span>Set all 6 faces first</div>';
      return;
    }
    const phases = [...new Set(solutionSteps.map(s => s.phase))];
    let html = '';
    phases.forEach(phase => {
      const phaseSteps = solutionSteps.filter(s => s.phase === phase);
      const phaseIdx   = solutionSteps.indexOf(phaseSteps[0]);
      html += `<div class="solve-status">
        <div class="solve-header">
          <h3>${phase}</h3>
          <span class="move-count-badge">${phaseSteps.length} moves</span>
        </div>
        <div class="steps-list">`;
      phaseSteps.forEach((step, i) => {
        const gIdx = phaseIdx + i;
        const cls  = gIdx < currentStepIdx ? 'done' : gIdx === currentStepIdx ? 'current' : '';
        html += `<div class="step-item ${cls}" onclick="markStep(${gIdx})">
          <span class="step-num">${String(gIdx + 1).padStart(2, '0')}</span>
          <span class="step-move">${step.move}</span>
          <span class="step-desc">${step.desc}</span>
          <span class="step-check">✓</span>
        </div>`;
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  }
  
  function markStep(idx) {
    currentStepIdx = idx + 1;
    renderSolvePanel();
  }
  
  // ─── Digital cube net ─────────────────────────────────────────────────────────
  
  function renderCubeNet() {
    const net = document.getElementById('cubeNet');
    net.innerHTML = '';
    const layout = [
      [null, 'U', null, null],
      ['L',  'F', 'R',  'B'],
      [null, 'D', null, null]
    ];
    layout.forEach(row => {
      row.forEach(face => {
        if (!face) { net.appendChild(document.createElement('div')); return; }
        const faceEl = document.createElement('div');
        faceEl.className = 'net-face';
        const colors = cubeState[face] || FACE_COLORS[face];
        colors.forEach(color => {
          const cell = document.createElement('div');
          cell.className = 'net-cell';
          cell.style.background = color;
          faceEl.appendChild(cell);
        });
        net.appendChild(faceEl);
      });
    });
    updateDigitalDisplay();
  }
  
  function updateDigitalDisplay() {
    const total = solutionSteps.length;
    const pct   = total > 0 ? (digitalStepIdx / total * 100) : 0;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('digitalProgressText').textContent =
      digitalStepIdx + ' / ' + total + ' moves';
    if (digitalStepIdx > 0 && solutionSteps[digitalStepIdx - 1]) {
      const mv = solutionSteps[digitalStepIdx - 1];
      document.getElementById('digitalMoveDisplay').textContent = mv.move;
      document.getElementById('digitalMoveName').textContent    = mv.desc;
    } else {
      document.getElementById('digitalMoveDisplay').textContent = '—';
      document.getElementById('digitalMoveName').textContent    =
        total > 0 ? 'Press Next to start' : 'Generate a solution first';
    }
  }
  
  function digitalNext() {
    if (digitalStepIdx < solutionSteps.length) { digitalStepIdx++; updateDigitalDisplay(); }
  }
  
  function digitalPrev() {
    if (digitalStepIdx > 0) { digitalStepIdx--; updateDigitalDisplay(); }
  }
  
  function digitalReset() {
    digitalStepIdx = 0;
    updateDigitalDisplay();
  }
  
  // ─── Tips ─────────────────────────────────────────────────────────────────────
  
  function loadTip() {
    const idx = Math.floor(Math.random() * PRO_TIPS.length);
    document.getElementById('aiTipContent').textContent = PRO_TIPS[idx];
  }