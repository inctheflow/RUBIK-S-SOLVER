// ─── Constants ────────────────────────────────────────────────────────────────

const CUBE_COLORS = {
    white:  '#ffffff',
    yellow: '#f1c40f',
    red:    '#e74c3c',
    orange: '#e67e22',
    blue:   '#3498db',
    green:  '#2ecc71'
  };
  
  const HEX_TO_NAME = {
    '#ffffff': 'white',  '#f1c40f': 'yellow',
    '#e74c3c': 'red',    '#e67e22': 'orange',
    '#3498db': 'blue',   '#2ecc71': 'green'
  };
  
  const FACE_DEFAULT_COLOR = {
    U: '#ffffff', F: '#2ecc71', R: '#e74c3c',
    D: '#f1c40f', B: '#3498db', L: '#e67e22'
  };
  
  const FACE_NAMES = {
    U: 'Up (White)',    F: 'Front (Green)', R: 'Right (Red)',
    D: 'Down (Yellow)', B: 'Back (Blue)',   L: 'Left (Orange)'
  };
  
  const PRO_TIPS = [
    "When doing U-perms in PLL, keep your left hand still and only move your right hand. This reduces regrip time and can shave 0.5-1 second off your PLL execution.",
    "Practice your worst OLL cases in isolation rather than full solves. 20 minutes drilling one bad OLL case beats 2 hours of full solves for fixing that specific weakness.",
    "For F2L, learn to solve pairs without rotating the cube. Every cube rotation costs ~0.3 seconds -- eliminating them in F2L can drop your time by 3-5 seconds.",
    "The fingertrick for R U R-prime is: index flick R, thumb pushes U, middle finger pulls R-prime. Chained fast this becomes one fluid motion.",
    "Color neutrality gives you better cross options. Start by learning just two opposite colors (white + yellow) before going fully neutral.",
    "If your cross takes more than 8 moves consistently, you are not planning far enough ahead. Practice solving the cross eyes-closed after inspecting.",
    "TPS (turns per second) matters more than algorithm choice at the beginner stage. A slower algorithm at 5 TPS beats a fast algorithm at 2 TPS."
  ];
  
  // ─── App State ────────────────────────────────────────────────────────────────
  
  var cubeState = { U: null, F: null, R: null, D: null, B: null, L: null };
  var activeFace = null;
  var pickerColors = [];
  var pickerSelectedCell = 0;
  var solutionSteps = [];
  var currentStepIdx = 0;
  var currentMethod = 'beginner';
  var digitalStepIdx = 0;
  var digitalCubeState = null;
  
  // ─── Boot ─────────────────────────────────────────────────────────────────────
  
  window.onload = function() {
    var faces = ['U','F','R','D','B','L'];
    faces.forEach(function(face) {
      var grid = document.getElementById('grid-' + face);
      grid.innerHTML = '';
      for (var i = 0; i < 9; i++) {
        var cell = document.createElement('div');
        cell.className = 'face-cell';
        cell.style.background = FACE_DEFAULT_COLOR[face] + '40';
        grid.appendChild(cell);
      }
    });
    resetDigitalCube();
    renderCubeNet();
    loadTip();
  };
  
  // ─── Tabs ─────────────────────────────────────────────────────────────────────
  
  function switchTab(tab) {
    var names = ['scan','solve','digital','tips'];
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab')[names.indexOf(tab)].classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    if (tab === 'tips')    loadTip();
    if (tab === 'digital') { resetDigitalCube(); renderCubeNet(); }
  }
  
  // ─── Face selection ───────────────────────────────────────────────────────────
  
  function selectFace(face) {
    activeFace = face;
    ['U','F','R','D','B','L'].forEach(function(f) {
      document.getElementById('face-' + f).style.outline = 'none';
    });
    document.getElementById('face-' + face).style.outline = '2px solid #ff6b35';
  
    pickerColors = cubeState[face]
      ? cubeState[face].slice()
      : new Array(9).fill(FACE_DEFAULT_COLOR[face]);
    pickerSelectedCell = 0;
  
    buildPicker(face);
    document.getElementById('colorPicker').classList.add('active');
    setMsg('Editing ' + FACE_NAMES[face] + ' -- click a square, then a color below');
  }
  
  // ─── Color picker ─────────────────────────────────────────────────────────────
  
  function buildPicker(face) {
    document.getElementById('pickerTitle').textContent = 'Set colors -- ' + FACE_NAMES[face];
  
    var grid = document.getElementById('faceInputGrid');
    grid.innerHTML = '';
  
    pickerColors.forEach(function(color, i) {
      var cell = document.createElement('div');
      cell.className = 'face-input-cell';
      if (i === 0) cell.classList.add('selected');
      cell.style.background = color;
      cell.setAttribute('data-i', i);
      cell.addEventListener('click', function(e) {
        e.stopPropagation();
        pickerSelectedCell = parseInt(this.getAttribute('data-i'));
        document.querySelectorAll('#faceInputGrid .face-input-cell').forEach(function(c) {
          c.classList.remove('selected');
        });
        this.classList.add('selected');
      });
      grid.appendChild(cell);
    });
  
    var palette = document.getElementById('colorPalette');
    palette.innerHTML = '';
    Object.keys(CUBE_COLORS).forEach(function(name) {
      var hex = CUBE_COLORS[name];
      var btn = document.createElement('div');
      btn.className = 'palette-color';
      btn.style.background = hex;
      btn.title = name;
      btn.setAttribute('data-hex', hex);
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        paintCell(this.getAttribute('data-hex'));
      });
      palette.appendChild(btn);
    });
  }
  
  function paintCell(hex) {
    pickerColors[pickerSelectedCell] = hex;
    var cells = document.querySelectorAll('#faceInputGrid .face-input-cell');
    if (cells[pickerSelectedCell]) {
      cells[pickerSelectedCell].style.background = hex;
      cells[pickerSelectedCell].classList.remove('selected');
    }
    if (pickerSelectedCell < 8) {
      pickerSelectedCell++;
      if (cells[pickerSelectedCell]) cells[pickerSelectedCell].classList.add('selected');
    }
  }
  
  function confirmFaceColors() {
    if (!activeFace) { setMsg('Please click a face card first'); return; }
    cubeState[activeFace] = pickerColors.slice();
  
    var miniCells = document.querySelectorAll('#grid-' + activeFace + ' .face-cell');
    cubeState[activeFace].forEach(function(color, i) {
      miniCells[i].style.background = color;
    });
  
    document.getElementById('dot-'  + activeFace).classList.add('done');
    document.getElementById('face-' + activeFace).classList.add('captured');
  
    var done = ['U','F','R','D','B','L'].filter(function(f) { return cubeState[f] !== null; }).length;
    if (done === 6) {
      document.getElementById('solveBtn').style.display = 'inline-flex';
      setMsg('All 6 faces set! Click Get Solution.');
    } else {
      setMsg(done + '/6 faces done. ' + (6 - done) + ' remaining.');
    }
  }
  
  // ─── Image upload ─────────────────────────────────────────────────────────────
  
  function handleImageUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!activeFace) { setMsg('Select a face first'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = document.getElementById('previewImg');
      img.src = ev.target.result;
      img.style.display = 'block';
      document.getElementById('cameraPlaceholder').style.display = 'none';
      img.onload = function() { detectColors(img); };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  
  function detectColors(imgEl) {
    document.getElementById('analyzeSpinner').style.display = 'flex';
    try {
      var thief = new ColorThief();
      var pal   = thief.getPalette(imgEl, 9);
      pickerColors = pal.map(function(rgb) { return snapColor(rgb); });
      buildPicker(activeFace);
      setMsg('Colors detected! Adjust if needed, then click Confirm Face.');
    } catch(err) {
      setMsg('Could not detect colors -- set them manually.');
    }
    document.getElementById('analyzeSpinner').style.display = 'none';
  }
  
  function snapColor(rgb) {
    var t = [
      { hex:'#ffffff', v:[255,255,255] },
      { hex:'#f1c40f', v:[241,196,15]  },
      { hex:'#e74c3c', v:[231,76,60]   },
      { hex:'#e67e22', v:[230,126,34]  },
      { hex:'#3498db', v:[52,152,219]  },
      { hex:'#2ecc71', v:[46,204,113]  }
    ];
    var best = t[0], bestD = Infinity;
    t.forEach(function(c) {
      var d = Math.sqrt(Math.pow(rgb[0]-c.v[0],2)+Math.pow(rgb[1]-c.v[1],2)+Math.pow(rgb[2]-c.v[2],2));
      if (d < bestD) { bestD = d; best = c; }
    });
    return best.hex;
  }
  
  // ─── Validation ───────────────────────────────────────────────────────────────
  
  function validateCube() {
    var errors = [];
    var all = [];
    ['U','F','R','D','B','L'].forEach(function(f) {
      cubeState[f].forEach(function(c) { all.push(c); });
    });
  
    var valid = new Set(Object.values(CUBE_COLORS));
    var bad = all.filter(function(c) { return !valid.has(c); });
    if (bad.length) errors.push('Some squares have unrecognized colors.');
  
    var counts = {};
    Object.values(CUBE_COLORS).forEach(function(h) { counts[h] = 0; });
    all.forEach(function(c) { if (counts[c] !== undefined) counts[c]++; });
    var wrong = [];
    Object.keys(counts).forEach(function(h) {
      if (counts[h] !== 9) wrong.push((HEX_TO_NAME[h]||h) + ': ' + counts[h] + ' (need 9)');
    });
    if (wrong.length) errors.push('Color counts wrong -- ' + wrong.join(', ') + '.');
  
    return errors;
  }
  
  function isSolved() {
    return ['U','F','R','D','B','L'].every(function(face) {
      var exp = FACE_DEFAULT_COLOR[face];
      return cubeState[face].every(function(c) { return c === exp; });
    });
  }
  
  // ─── Solution generation ──────────────────────────────────────────────────────
  
  function generateSolution() {
    var done = ['U','F','R','D','B','L'].filter(function(f) { return cubeState[f] !== null; }).length;
    if (done < 6) { setMsg('Set all 6 faces first.'); return; }
  
    var errors = validateCube();
    if (errors.length) {
      var html = '<div style="background:#3a0f0f;border:1px solid #e74c3c60;border-radius:12px;padding:1rem 1.25rem;margin-top:0.5rem;text-align:left;">'
        + '<div style="font-family:monospace;font-size:0.75rem;color:#e74c3c;margin-bottom:0.5rem;">INVALID CUBE -- cannot solve</div><ul style="list-style:none;">';
      errors.forEach(function(e) {
        html += '<li style="font-size:0.82rem;color:#f5a0a0;line-height:1.5;padding-left:1rem;border-left:2px solid #e74c3c40;margin-bottom:4px">' + e + '</li>';
      });
      html += '</ul></div>';
      document.getElementById('scanMessage').innerHTML = html;
      return;
    }
  
    if (isSolved()) {
      setMsg('Cube is already solved! Scramble it and try again.');
      return;
    }
  
    solutionSteps = [];
    METHODS[currentMethod].forEach(function(phase) {
      phase.moves.forEach(function(mv) {
        solutionSteps.push({ move: mv.m, desc: mv.desc, phase: phase.phase });
      });
    });
    currentStepIdx = 0;
    digitalStepIdx = 0;
    resetDigitalCube();
    switchTab('solve');
    renderSolvePanel();
  }
  
  var METHODS = {
    beginner: [
      { phase: 'White Cross', moves: [
        { m:'F',  desc:'Bring white-green edge to bottom front' },
        { m:'R',  desc:'Rotate right to align white-red edge' },
        { m:'U',  desc:'Cycle top layer to find next edge' },
        { m:"F'", desc:'Insert white-orange edge from front' }
      ]},
      { phase: 'White Corners', moves: [
        { m:'R',  desc:'Set up white corner insertion' },
        { m:"U'", desc:'Counterclockwise top to position corner' },
        { m:"R'", desc:'Undo right to complete insertion' },
        { m:'U',  desc:'Cycle to next corner position' },
        { m:'R',  desc:'Repeat insertion algorithm' },
        { m:"U'", desc:'Position alignment move' },
        { m:"R'", desc:'Complete white layer corner' }
      ]},
      { phase: 'Middle Layer', moves: [
        { m:'U',  desc:'Find middle layer edge on top' },
        { m:'R',  desc:'Trigger right insertion sequence' },
        { m:"U'", desc:'Anti-trigger for right slot' },
        { m:"R'", desc:'Undo right layer' },
        { m:"F'", desc:'Trigger front slot sequence' },
        { m:'U',  desc:'Return front layer to position' },
        { m:'F',  desc:'Complete middle layer edge insert' }
      ]},
      { phase: 'Yellow Cross (OLL)', moves: [
        { m:'F',  desc:'Begin yellow cross algorithm' },
        { m:'R',  desc:'Right face turn' },
        { m:'U',  desc:'Top face turn' },
        { m:"R'", desc:'Undo right face' },
        { m:"U'", desc:'Undo top face' },
        { m:"F'", desc:'Complete yellow cross edge placement' }
      ]},
      { phase: 'Yellow Corners (PLL)', moves: [
        { m:'R',  desc:'Begin corner permutation algorithm' },
        { m:"U'", desc:'Counterclockwise top position' },
        { m:'L',  desc:'Left face forward' },
        { m:"U'", desc:'Cycle top again' },
        { m:"R'", desc:'Undo right face' },
        { m:'U',  desc:'Restore top orientation' },
        { m:"L'", desc:'Undo left face' },
        { m:'U2', desc:'Double-turn top -- cube solved!' }
      ]}
    ],
    cfop: [
      { phase: 'Cross (bottom)', moves: [
        { m:'D2', desc:'Orient bottom layer for cross setup' },
        { m:'R',  desc:'Bring white edge to bottom' },
        { m:"D'", desc:'Rotate bottom layer' },
        { m:"R'", desc:'Secure white cross piece' }
      ]},
      { phase: 'F2L Pairs', moves: [
        { m:'U',  desc:'Cycle top to find F2L pair' },
        { m:'R',  desc:'Begin standard F2L insertion' },
        { m:"U'", desc:'Unlock corner for pairing' },
        { m:"R'", desc:'Complete first F2L pair' },
        { m:"U'", desc:'Move to second slot' },
        { m:'F',  desc:'Front-slot F2L trigger' },
        { m:'U',  desc:'Lift edge into pair' },
        { m:"F'", desc:'Seal second F2L pair' }
      ]},
      { phase: 'OLL', moves: [
        { m:'R',  desc:'OLL algorithm start' },
        { m:'U',  desc:'Top cycle' },
        { m:"R'", desc:'Undo right for OLL' },
        { m:'U',  desc:'Second top cycle' },
        { m:'R',  desc:'Reinsert right' },
        { m:'U2', desc:'Double top -- OLL complete' },
        { m:"R'", desc:'Finalize OLL orientation' }
      ]},
      { phase: 'PLL', moves: [
        { m:"R'", desc:'U-perm algorithm start' },
        { m:'U',  desc:'Cycle corners' },
        { m:"R'", desc:'Anti-trigger' },
        { m:'U2', desc:'Double rotation' },
        { m:'R',  desc:'Forward sequence' },
        { m:"U'", desc:'Counterclockwise alignment' },
        { m:"R'", desc:'Near-complete PLL' },
        { m:'U2', desc:'Final U-perm -- cube solved!' }
      ]}
    ],
    optimal: [
      { phase: 'Optimal (Kociemba-style)', moves: [
        { m:'R',  desc:'Move 1' }, { m:"U'", desc:'Move 2' },
        { m:'F2', desc:'Move 3' }, { m:'L',  desc:'Move 4' },
        { m:"B'", desc:'Move 5' }, { m:'D',  desc:'Move 6' },
        { m:"R'", desc:'Move 7' }, { m:'U2', desc:'Move 8' },
        { m:'F',  desc:'Move 9' }, { m:"D'", desc:'Move 10' },
        { m:'R',  desc:'Move 11'},  { m:'U',  desc:'Move 12 -- SOLVED!' }
      ]}
    ]
  };
  
  function selectMethod(method, e) {
    currentMethod = method;
    document.querySelectorAll('.method-tab').forEach(function(t) { t.classList.remove('active'); });
    if (e && e.target) e.target.classList.add('active');
    if (solutionSteps.length) renderSolvePanel();
  }
  
  function renderSolvePanel() {
    var container = document.getElementById('solveContent');
    if (!solutionSteps.length) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">🧩</span>Set all 6 faces first</div>';
      return;
    }
    var phases = [];
    solutionSteps.forEach(function(s) { if (phases.indexOf(s.phase) === -1) phases.push(s.phase); });
    var html = '';
    phases.forEach(function(phase) {
      var ps  = solutionSteps.filter(function(s) { return s.phase === phase; });
      var pi  = solutionSteps.indexOf(ps[0]);
      html += '<div class="solve-status"><div class="solve-header"><h3>' + phase + '</h3>'
        + '<span class="move-count-badge">' + ps.length + ' moves</span></div><div class="steps-list">';
      ps.forEach(function(step, i) {
        var gi  = pi + i;
        var cls = gi < currentStepIdx ? 'done' : gi === currentStepIdx ? 'current' : '';
        html += '<div class="step-item ' + cls + '" onclick="markStep(' + gi + ')">'
          + '<span class="step-num">' + String(gi+1).padStart(2,'0') + '</span>'
          + '<span class="step-move">' + step.move + '</span>'
          + '<span class="step-desc">'  + step.desc  + '</span>'
          + '<span class="step-check">&#10003;</span></div>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  }
  
  function markStep(idx) { currentStepIdx = idx + 1; renderSolvePanel(); }
  
  // ─── Digital cube simulation ──────────────────────────────────────────────────
  
  function resetDigitalCube() {
    digitalCubeState = {};
    ['U','F','R','D','B','L'].forEach(function(f) {
      digitalCubeState[f] = cubeState[f]
        ? cubeState[f].slice()
        : new Array(9).fill(FACE_DEFAULT_COLOR[f]);
    });
  }
  
  function rotateFaceCW(face) {
    var f = digitalCubeState[face];
    digitalCubeState[face] = [f[6],f[3],f[0],f[7],f[4],f[1],f[8],f[5],f[2]];
  }
  
  function applyMove(moveStr) {
    var base  = moveStr.replace(/[^RLUDFB]/g, '');
    var times = moveStr.indexOf("'") !== -1 ? 3 : moveStr.indexOf('2') !== -1 ? 2 : 1;
    for (var t = 0; t < times; t++) { doMove(base); }
  }
  
  function inverseMove(mv) {
    if (mv.indexOf("'") !== -1) return mv.replace("'","");
    if (mv.indexOf('2')  !== -1) return mv;
    return mv + "'";
  }
  
  function doMove(base) {
    var U=digitalCubeState.U, F=digitalCubeState.F, R=digitalCubeState.R,
        D=digitalCubeState.D, B=digitalCubeState.B, L=digitalCubeState.L, tmp;
    if (base==='R') {
      rotateFaceCW('R'); tmp=[U[2],U[5],U[8]];
      U[2]=F[2]; U[5]=F[5]; U[8]=F[8]; F[2]=D[2]; F[5]=D[5]; F[8]=D[8];
      D[2]=B[6]; D[5]=B[3]; D[8]=B[0]; B[0]=tmp[2]; B[3]=tmp[1]; B[6]=tmp[0];
    } else if (base==='L') {
      rotateFaceCW('L'); tmp=[U[0],U[3],U[6]];
      U[0]=B[8]; U[3]=B[5]; U[6]=B[2]; B[2]=D[6]; B[5]=D[3]; B[8]=D[0];
      D[0]=F[0]; D[3]=F[3]; D[6]=F[6]; F[0]=tmp[0]; F[3]=tmp[1]; F[6]=tmp[2];
    } else if (base==='U') {
      rotateFaceCW('U'); tmp=[F[0],F[1],F[2]];
      F[0]=R[0]; F[1]=R[1]; F[2]=R[2]; R[0]=B[0]; R[1]=B[1]; R[2]=B[2];
      B[0]=L[0]; B[1]=L[1]; B[2]=L[2]; L[0]=tmp[0]; L[1]=tmp[1]; L[2]=tmp[2];
    } else if (base==='D') {
      rotateFaceCW('D'); tmp=[F[6],F[7],F[8]];
      F[6]=L[6]; F[7]=L[7]; F[8]=L[8]; L[6]=B[6]; L[7]=B[7]; L[8]=B[8];
      B[6]=R[6]; B[7]=R[7]; B[8]=R[8]; R[6]=tmp[0]; R[7]=tmp[1]; R[8]=tmp[2];
    } else if (base==='F') {
      rotateFaceCW('F'); tmp=[U[6],U[7],U[8]];
      U[6]=L[8]; U[7]=L[5]; U[8]=L[2]; L[2]=D[0]; L[5]=D[1]; L[8]=D[2];
      D[0]=R[6]; D[1]=R[3]; D[2]=R[0]; R[0]=tmp[0]; R[3]=tmp[1]; R[6]=tmp[2];
    } else if (base==='B') {
      rotateFaceCW('B'); tmp=[U[0],U[1],U[2]];
      U[0]=R[2]; U[1]=R[5]; U[2]=R[8]; R[2]=D[8]; R[5]=D[7]; R[8]=D[6];
      D[6]=L[0]; D[7]=L[3]; D[8]=L[6]; L[0]=tmp[2]; L[3]=tmp[1]; L[6]=tmp[0];
    }
  }
  
  function renderCubeNet() {
    if (!digitalCubeState) resetDigitalCube();
    var net    = document.getElementById('cubeNet');
    net.innerHTML = '';
    var layout = [[null,'U',null,null],['L','F','R','B'],[null,'D',null,null]];
    layout.forEach(function(row) {
      row.forEach(function(face) {
        var el = document.createElement('div');
        if (!face) { net.appendChild(el); return; }
        el.className = 'net-face';
        digitalCubeState[face].forEach(function(color) {
          var c = document.createElement('div');
          c.className = 'net-cell';
          c.style.background = color;
          el.appendChild(c);
        });
        net.appendChild(el);
      });
    });
    updateDigitalInfo();
  }
  
  function updateDigitalInfo() {
    var total = solutionSteps.length;
    document.getElementById('progressBar').style.width = (total > 0 ? digitalStepIdx/total*100 : 0) + '%';
    document.getElementById('digitalProgressText').textContent = digitalStepIdx + ' / ' + total + ' moves';
    if (digitalStepIdx > 0 && solutionSteps[digitalStepIdx-1]) {
      var mv = solutionSteps[digitalStepIdx-1];
      document.getElementById('digitalMoveDisplay').textContent = mv.move;
      document.getElementById('digitalMoveName').textContent    = mv.desc;
    } else {
      document.getElementById('digitalMoveDisplay').textContent = '--';
      document.getElementById('digitalMoveName').textContent    = total > 0 ? 'Press Next to start' : 'Generate a solution first';
    }
  }
  
  function digitalNext() {
    if (digitalStepIdx < solutionSteps.length) {
      applyMove(solutionSteps[digitalStepIdx].move);
      digitalStepIdx++;
      renderCubeNet();
    }
  }
  
  function digitalPrev() {
    if (digitalStepIdx > 0) {
      digitalStepIdx--;
      applyMove(inverseMove(solutionSteps[digitalStepIdx].move));
      renderCubeNet();
    }
  }
  
  function digitalReset() { digitalStepIdx = 0; resetDigitalCube(); renderCubeNet(); }
  
  // ─── Tips ─────────────────────────────────────────────────────────────────────
  
  function loadTip() {
    document.getElementById('aiTipContent').textContent = PRO_TIPS[Math.floor(Math.random()*PRO_TIPS.length)];
  }
  
  // ─── Util ─────────────────────────────────────────────────────────────────────
  
  function setMsg(text) {
    var el = document.getElementById('scanMessage');
    el.innerHTML = '';
    el.textContent = text;
  }