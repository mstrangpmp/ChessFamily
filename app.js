/**
 * app.js
 * Quản lý trạng thái học tập, điều phối giao diện (Tab switcher), hiệu ứng âm thanh (Web Audio API),
 * hệ thống giải câu đố, trắc nghiệm và hiệu ứng pháo hoa ăn mừng cho ChessFamily.
 */

class AppCoordinator {
  constructor() {
    this.lessons = LESSONS_DATA;
    this.currentLessonIdx = 0;
    this.activeTab = "lessons"; // "lessons" | "practice" | "quiz" | "parent"
    this.board = null;
    
    // Hệ thống âm thanh Web Audio API
    this.audioCtx = null;
    
    // Tiến độ học tập lưu trong localStorage
    this.unlockedLessons = JSON.parse(localStorage.getItem("chess_unlocked_lessons")) || ["lesson1"];
    this.achievements = JSON.parse(localStorage.getItem("chess_achievements")) || [];

    // Trạng thái trắc nghiệm
    this.quizAnswers = {};
    
    // Đấu trường gia đình
    this.versusBoard = null;
    this.scoreKid = parseInt(localStorage.getItem("chess_family_score_kid")) || 0;
    this.scoreParent = parseInt(localStorage.getItem("chess_family_score_parent")) || 0;
    this.undoCharges = 2;
    this.doubleMoveCharges = 1;
    this.doubleMoveActive = false;

    this.initDOM();
    this.initAudio();
    this.loadLesson(this.currentLessonIdx);
  }

  // Khởi tạo Audio Context sau tương tác đầu tiên để tuân thủ bảo mật trình duyệt
  initAudio() {
    const startAudio = () => {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    };
    document.addEventListener("click", startAudio, { once: true });
    document.addEventListener("keydown", startAudio, { once: true });
  }

  // Phương thức phát âm thanh đặt quân gỗ lách cách
  playMoveSound(isCapture = false) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (isCapture === "promote") {
      // Tiếng tốt thăng cấp: Tiếng chuông thanh thót
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      return;
    }

    // Tiếng cờ gỗ
    osc.type = "triangle";
    osc.frequency.setValueAtTime(isCapture ? 150 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(isCapture ? 80 : 60, now + 0.08);

    gain.gain.setValueAtTime(isCapture ? 0.3 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Âm thanh chiến thắng ngọt ngào (Arpeggio)
  playSuccessSound() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Hợp âm đô trưởng)

    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gain.gain.setValueAtTime(0.15, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.25);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.3);
    });
  }

  // Âm thanh báo sai khi đi nhầm trong câu đố
  playFailSound() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130.81, now); // C3
    osc.frequency.linearRampToValueAtTime(80, now + 0.3); // Tuột dốc tần số

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Khởi tạo cây DOM chính
  initDOM() {
    // Thanh chọn bài học bên tay trái (Sidebar)
    const sidebarList = document.getElementById("lessons-list");
    sidebarList.innerHTML = "";
    this.lessons.forEach((lesson, index) => {
      const isUnlocked = this.unlockedLessons.includes(lesson.id);
      
      const item = document.createElement("button");
      item.className = `lesson-item-btn ${index === this.currentLessonIdx ? "active" : ""} ${!isUnlocked ? "locked" : ""}`;
      item.disabled = !isUnlocked;
      
      item.innerHTML = `
        <div class="lesson-num">Bài ${index + 1}</div>
        <div class="lesson-title-text">${lesson.title.split(": ")[1]}</div>
        ${!isUnlocked ? '<span class="lock-icon">🔒</span>' : '<span class="check-icon">✓</span>'}
      `;
      
      item.addEventListener("click", () => {
        this.currentLessonIdx = index;
        this.loadLesson(index);
        
        // Cập nhật trạng thái active sidebar
        document.querySelectorAll(".lesson-item-btn").forEach(btn => btn.classList.remove("active"));
        item.classList.add("active");
      });
      
      sidebarList.appendChild(item);
    });

    // Sự kiện chuyển đổi Tab
    const tabButtons = document.querySelectorAll(".tab-nav-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Cấu hình Bảng Điểm Đấu Trường Gia Đình
    const kidInput = document.getElementById("kid-name-input");
    const parentInput = document.getElementById("parent-name-input");
    if (kidInput && parentInput) {
      const updateNames = () => {
        const kName = kidInput.value || "Mẹ Yêu";
        const pName = parentInput.value || "Bố & Bé";
        document.getElementById("lbl-kid-name").innerText = kName;
        document.getElementById("lbl-parent-name").innerText = pName;
        localStorage.setItem("chess_family_name_kid", kName);
        localStorage.setItem("chess_family_name_parent", pName);
        
        // Cập nhật indicator lượt đi nếu bàn cờ đang chạy
        if (this.versusBoard) {
          this.updateVersusTurnIndicator(this.versusBoard.currentTurn);
        }
      };
      
      kidInput.addEventListener("input", updateNames);
      parentInput.addEventListener("input", updateNames);
      
      kidInput.value = localStorage.getItem("chess_family_name_kid") || "Mẹ Yêu";
      parentInput.value = localStorage.getItem("chess_family_name_parent") || "Bố & Bé";
      updateNames();
    }

    // Hiển thị điểm số hiện tại
    const scoreKidEl = document.getElementById("kid-score");
    const scoreParentEl = document.getElementById("parent-score");
    if (scoreKidEl && scoreParentEl) {
      scoreKidEl.innerText = this.scoreKid;
      scoreParentEl.innerText = this.scoreParent;
    }

    // Thắng +1 Bé
    const addKidWinBtn = document.getElementById("add-kid-win");
    if (addKidWinBtn) {
      addKidWinBtn.addEventListener("click", () => {
        this.scoreKid++;
        localStorage.setItem("chess_family_score_kid", this.scoreKid);
        scoreKidEl.innerText = this.scoreKid;
        this.playSuccessSound();
        this.triggerConfetti();
        this.unlockAchievement("family_champion_kid", "Mẹ Thắng Bố/Bé!");
      });
    }

    // Thắng +1 Phụ Huynh
    const addParentWinBtn = document.getElementById("add-parent-win");
    if (addParentWinBtn) {
      addParentWinBtn.addEventListener("click", () => {
        this.scoreParent++;
        localStorage.setItem("chess_family_score_parent", this.scoreParent);
        scoreParentEl.innerText = this.scoreParent;
        this.playMoveSound("promote"); // Âm thanh thăng cấp vui tai
        this.unlockAchievement("family_champion_parent", "Phụ Huynh Bản Lĩnh");
      });
    }

    // Reset bảng điểm
    const resetScoreBtn = document.getElementById("reset-scoreboard-btn");
    if (resetScoreBtn) {
      resetScoreBtn.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn thiết lập lại toàn bộ bảng vàng điểm số gia đình?")) {
          this.scoreKid = 0;
          this.scoreParent = 0;
          localStorage.setItem("chess_family_score_kid", 0);
          localStorage.setItem("chess_family_score_parent", 0);
          scoreKidEl.innerText = 0;
          scoreParentEl.innerText = 0;
        }
      });
    }

    // Nút Bắt đầu cuộc đấu gia đình
    const startFamilyMatchBtn = document.getElementById("start-family-match-btn");
    if (startFamilyMatchBtn) {
      startFamilyMatchBtn.addEventListener("click", () => this.startFamilyMatch());
    }
  }

  // Tải nội dung của một bài học cụ thể
  loadLesson(idx) {
    const lesson = this.lessons[idx];
    
    // Cập nhật tiêu đề chính
    document.getElementById("active-lesson-title").innerText = lesson.title;
    document.getElementById("active-lesson-subtitle").innerText = lesson.subtitle;
    document.getElementById("active-lesson-intro").innerText = lesson.intro;

    // Vẽ danh sách lý thuyết trong Tab 'Lessons'
    const sectionList = document.getElementById("lesson-sections-list");
    sectionList.innerHTML = "";
    lesson.sections.forEach((sec, sIdx) => {
      const card = document.createElement("div");
      card.className = "lesson-card glass-panel";
      card.innerHTML = `
        <h3 class="card-title"><span class="bullet-num">${sIdx + 1}</span> ${sec.title}</h3>
        ${sec.value ? `<div class="card-value-badge">${sec.value}</div>` : ""}
        <p class="card-desc">${sec.desc}</p>
        ${sec.comparison ? `<div class="card-comparison-box"><strong>Pháp lệnh:</strong> ${sec.comparison}</div>` : ""}
        ${sec.benefit ? `<div class="card-benefit-box">💡 <strong>Mục tiêu chiến thuật:</strong> ${sec.benefit}</div>` : ""}
        ${sec.tip ? `<div class="card-tip-box">👨‍👩‍👦 <strong>Mẹo chơi cùng con:</strong> ${sec.tip}</div>` : ""}
      `;
      sectionList.appendChild(card);
    });

    // Ẩn/Hiện Tab Trắc nghiệm phụ thuộc vào bài học có trắc nghiệm hay không
    const quizTabBtn = document.querySelector('[data-tab="quiz"]');
    if (lesson.quiz) {
      quizTabBtn.style.display = "inline-flex";
      this.renderQuiz(lesson.quiz);
    } else {
      quizTabBtn.style.display = "none";
      if (this.activeTab === "quiz") {
        this.switchTab("lessons");
      }
    }

    // Tự động chuyển về Tab 'Lessons' khi tải bài mới
    this.switchTab("lessons");

    // Mở khóa phần luyện tập tương ứng bài học
    this.setupPracticeBoard();
  }

  // Chuyển đổi Tab
  switchTab(tab) {
    this.activeTab = tab;
    
    // Cập nhật trạng thái nút điều hướng
    document.querySelectorAll(".tab-nav-btn").forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Hiển thị khung nội dung tương ứng
    document.querySelectorAll(".tab-content-panel").forEach(panel => {
      if (panel.id === `${tab}-panel`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    // Nếu chuyển sang tab luyện tập, redraw lại mũi tên bàn cờ
    if (tab === "practice" && this.board) {
      setTimeout(() => {
        this.board.drawArrows();
      }, 100);
    }
  }

  // Khởi tạo Bàn cờ luyện tập theo bài học hiện tại
  setupPracticeBoard() {
    const lesson = this.lessons[this.currentLessonIdx];
    const practiceZone = document.getElementById("practice-zone");
    practiceZone.innerHTML = "";

    // Tiêu đề & Hướng dẫn
    const header = document.createElement("div");
    header.className = "practice-header";
    practiceZone.appendChild(header);

    // Bàn cờ container
    const boardContainer = document.createElement("div");
    boardContainer.id = "active-chessboard";
    boardContainer.className = "active-chessboard-container";
    practiceZone.appendChild(boardContainer);

    // Bảng trạng thái/Thành tích bên cạnh bàn cờ
    const controlPanel = document.createElement("div");
    controlPanel.className = "practice-controls glass-panel";
    controlPanel.id = "practice-control-panel";
    practiceZone.appendChild(controlPanel);

    // Cấu hình cụ thể cho màn chơi ăn sao hoặc câu đố chiến thuật
    if (lesson.starGame) {
      // Chế độ thu thập sao (Star Collector)
      const gameConfig = lesson.starGame;
      header.innerHTML = `
        <h3 class="practice-title">Luyện tập: Thu thập Ngôi Sao</h3>
        <p class="practice-instruction">${gameConfig.instructions}</p>
      `;

      // Khởi tạo bàn cờ ăn sao
      this.board = new InteractiveBoard("active-chessboard", {
        mode: "star",
        onMove: (from, to, isCapture) => this.playMoveSound(isCapture),
        onStarCollected: (coord) => {
          // Phát tiếng ting ting khi nhặt được sao
          this.playMoveSound("promote");
          this.updateStarPanel();
        },
        onWin: (moves) => {
          this.playSuccessSound();
          this.triggerConfetti();
          this.showVictoryDialog(`Tuyệt vời! Bạn đã điều binh khiển tướng ăn hết các ngôi sao trong **${moves} nước đi** (Số nước tối ưu: ${gameConfig.parMoves} nước).`);
          this.unlockNextLesson();
        }
      });

      // Tạo cấu hình bàn cờ ban đầu
      const initialPieces = { [gameConfig.startPos]: gameConfig.pieceType };
      this.board.setupBoard(initialPieces, gameConfig.stars, gameConfig.pieceType, gameConfig.startPos);
      
      this.updateStarPanel();

    } else if (lesson.puzzles) {
      // Chế độ giải câu đố chiến thuật (Fork, Pin, Skewer)
      header.innerHTML = `
        <h3 class="practice-title">Luyện tập: Thử thách đố thế cờ</h3>
        <p class="practice-instruction">Hãy nghiên cứu bàn cờ và tìm nước đi chiến thuật chính xác!</p>
      `;

      // Mặc định chạy câu đố đầu tiên
      this.loadPuzzle(0);
    } else {
      // Bài học lý thuyết thuần túy (như bài 5 cẩm nang) -> Sandbox bàn cờ tự do
      header.innerHTML = `
        <h3 class="practice-title">Bàn cờ thử nghiệm tự do (Sandbox)</h3>
        <p class="practice-instruction">Hãy thử di chuyển tự do các quân cờ để nắm chắc cách đi cùng bé!</p>
      `;

      this.board = new InteractiveBoard("active-chessboard", {
        mode: "sandbox",
        onMove: (from, to, isCapture) => this.playMoveSound(isCapture)
      });

      // Xếp cờ chuẩn
      const standardSetup = {
        "a1": "wR", "b1": "wN", "c1": "wB", "d1": "wQ", "e1": "wK", "f1": "wB", "g1": "wN", "h1": "wR",
        "a2": "wP", "b2": "wP", "c2": "wP", "d2": "wP", "e2": "wP", "f2": "wP", "g2": "wP", "h2": "wP",
        "a7": "bP", "b7": "bP", "c7": "bP", "d7": "bP", "e7": "bP", "f7": "bP", "g7": "bP", "h7": "bP",
        "a8": "bR", "b8": "bN", "c8": "bB", "d8": "bQ", "e8": "bK", "f8": "bB", "g8": "bN", "h8": "bR",
      };
      this.board.setupBoard(standardSetup);

      controlPanel.innerHTML = `
        <h4>Bàn cờ tự học</h4>
        <p>Đây là chế độ thử nghiệm tự do. Bạn có thể tự tay di chuyển tất cả các quân cờ của cả 2 phe để tập phối hợp các đòn thế.</p>
        <button class="action-btn" id="reset-sandbox-btn">Reset Bàn Cờ</button>
      `;
      document.getElementById("reset-sandbox-btn").addEventListener("click", () => {
        this.board.setupBoard(standardSetup);
      });
    }
  }

  // Tải một câu đố chiến thuật cụ thể
  loadPuzzle(puzzleIdx) {
    const lesson = this.lessons[this.currentLessonIdx];
    const puzzle = lesson.puzzles[puzzleIdx];
    
    const header = document.querySelector(".practice-header");
    header.innerHTML = `
      <h3 class="practice-title">${puzzle.title}</h3>
      <p class="practice-instruction">${puzzle.description}</p>
    `;

    this.board = new InteractiveBoard("active-chessboard", {
      mode: "puzzle",
      onMove: (from, to, isCapture) => this.playMoveSound(isCapture),
      onWin: () => {
        this.playSuccessSound();
        this.triggerConfetti();
        this.showVictoryDialog(puzzle.successMsg);
        
        // Lưu thành tựu
        this.unlockAchievement(puzzle.id, puzzle.title);

        // Kiểm tra xem còn câu đố tiếp theo không
        if (puzzleIdx + 1 < lesson.puzzles.length) {
          const btn = document.createElement("button");
          btn.className = "action-btn success-btn";
          btn.innerText = "Câu đố tiếp theo ➜";
          btn.style.marginTop = "15px";
          btn.addEventListener("click", () => this.loadPuzzle(puzzleIdx + 1));
          document.getElementById("victory-dialog-box").appendChild(btn);
        } else {
          this.unlockNextLesson();
        }
      },
      onFail: () => {
        this.playFailSound();
        const info = document.getElementById("puzzle-info-panel");
        info.innerHTML = `
          <div class="puzzle-fail-alert">
            ❌ Nước đi chưa đúng! Đừng nản lòng, bàn cờ sẽ reset để bạn thử lại.
          </div>
        `;
      }
    });

    this.board.setupBoard(
      Object.assign({}, puzzle.setup.pieces),
      [],
      puzzle.activePiece,
      puzzle.startPos,
      puzzle.solution
    );

    // Vẽ thêm mũi tên hướng dẫn/chiến thuật trực quan tùy thuộc vào loại đòn
    setTimeout(() => {
      if (puzzle.id === "puzzle_fork") {
        // Vẽ mũi tên minh họa đòn Fork: Mã nhảy vào c6 chĩa Vua e8 và Hậu a5
        this.board.addArrow("d4", "c6", "#3b82f6"); // Đường nhảy Mã dự kiến
        this.board.addArrow("c6", "e8", "#ef4444"); // Tấn công Vua
        this.board.addArrow("c6", "a5", "#f59e0b"); // Tấn công Hậu
      } else if (puzzle.id === "puzzle_pin") {
        // Tượng lên g5 ghim bR f6 tới bK h8
        this.board.addArrow("c1", "g5", "#3b82f6"); // Tượng di chuyển lên g5
        this.board.addArrow("g5", "f6", "#ef4444"); // Tượng ghim Xe
        this.board.addArrow("f6", "h8", "#f59e0b"); // Tia ghim từ Xe tới Vua
      } else if (puzzle.id === "puzzle_scholars") {
        // Vẽ mũi tên phối hợp Hậu & Tượng nhắm f7
        this.board.addArrow("c4", "f7", "#10b981"); // Tượng bảo vệ
        this.board.addArrow("h5", "f7", "#ef4444"); // Hậu lao vào ăn f7
      }
    }, 200);

    // Cập nhật bảng thông tin câu đố bên cạnh
    const controlPanel = document.getElementById("practice-control-panel");
    controlPanel.innerHTML = `
      <div id="puzzle-info-panel">
        <h4>Chiến thuật cần dùng</h4>
        <p>Bấm chọn quân <strong>${puzzle.activePiece === "wN" ? "Mã Trắng ♘" : puzzle.activePiece === "wB" ? "Tượng Trắng ♗" : "Hậu Trắng ♕"}</strong> để xem các nước đi gợi ý. Hãy đưa quân này tới ô tạo sát chiêu thắng cuộc.</p>
        <div class="puzzle-progress">Câu đố ${puzzleIdx + 1} / ${lesson.puzzles.length}</div>
        <button class="action-btn secondary-btn" id="show-clue-btn">Nhận Gợi Ý Chiến Thuật</button>
      </div>
    `;

    document.getElementById("show-clue-btn").addEventListener("click", () => {
      // Hiện mũi tên đậm hơn và giải thích
      alert(`Gợi ý: Quân của bạn cần đi tới ô [${puzzle.solution.toUpperCase()}] để kích hoạt đòn đánh quyết định!`);
    });
  }

  // Cập nhật số liệu thu thập sao ở thanh panel bên phải
  updateStarPanel() {
    const controlPanel = document.getElementById("practice-control-panel");
    const starsRemaining = this.board.stars.length;
    const currentMoves = this.board.moveCount;
    const par = this.lessons[this.currentLessonIdx].starGame.parMoves;

    controlPanel.innerHTML = `
      <div class="star-tracker">
        <h4>Trạng thái thu thập sao</h4>
        <div class="tracker-item">
          <span>Ngôi sao còn lại:</span>
          <span class="tracker-val highlight-val">⭐ ${starsRemaining}</span>
        </div>
        <div class="tracker-item">
          <span>Số nước đã đi:</span>
          <span class="tracker-val">${currentMoves}</span>
        </div>
        <div class="tracker-item">
          <span>Kỷ lục vàng:</span>
          <span class="tracker-val gold-text">${par} nước</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${((par - Math.max(0, currentMoves - par)) / par) * 100}%"></div>
        </div>
        <button class="action-btn" id="reset-stars-btn">Bắt Đầu Lại</button>
      </div>
    `;

    document.getElementById("reset-stars-btn").addEventListener("click", () => {
      this.setupPracticeBoard();
    });
  }

  // Hiển thị hộp thoại chúc mừng chiến thắng
  showVictoryDialog(message) {
    const practiceZone = document.getElementById("practice-zone");
    
    // Xóa hộp thoại cũ nếu có
    const oldDialog = document.getElementById("victory-dialog-overlay");
    if (oldDialog) oldDialog.remove();

    const overlay = document.createElement("div");
    overlay.className = "victory-overlay";
    overlay.id = "victory-dialog-overlay";

    const box = document.createElement("div");
    box.className = "victory-box glass-panel animated scaleUp";
    box.id = "victory-dialog-box";
    box.innerHTML = `
      <div class="victory-crown">👑</div>
      <h2>Chúc Mừng Chiến Thắng!</h2>
      <p class="victory-msg">${message}</p>
    `;

    const closeBtn = document.createElement("button");
    closeBtn.className = "action-btn";
    closeBtn.innerText = "Tuyệt vời, Đóng lại";
    closeBtn.addEventListener("click", () => overlay.remove());
    box.appendChild(closeBtn);

    overlay.appendChild(box);
    practiceZone.appendChild(overlay);
  }

  // Mở khóa bài học tiếp theo khi hoàn thành bài học hiện tại
  unlockNextLesson() {
    const nextIdx = this.currentLessonIdx + 1;
    if (nextIdx < this.lessons.length) {
      const nextLessonId = this.lessons[nextIdx].id;
      if (!this.unlockedLessons.includes(nextLessonId)) {
        this.unlockedLessons.push(nextLessonId);
        localStorage.setItem("chess_unlocked_lessons", JSON.stringify(this.unlockedLessons));
        
        // Render lại Sidebar để hiển thị ổ khóa đã mở
        this.initDOM();
        
        // Gợi ý mở khóa bài mới trong hộp thoại
        const box = document.getElementById("victory-dialog-box");
        if (box) {
          const alertBox = document.createElement("div");
          alertBox.className = "new-unlock-badge";
          alertBox.innerText = `🎉 Đã mở khóa: Bài ${nextIdx + 1}!`;
          box.insertBefore(alertBox, box.querySelector(".action-btn"));
        }
      }
    } else {
      // Hoàn thành toàn bộ giáo trình!
      this.unlockAchievement("master", "Kỳ Thủ Lão Luyện");
    }
  }

  // Mở khóa huy hiệu thành tựu
  unlockAchievement(id, title) {
    if (!this.achievements.includes(id)) {
      this.achievements.push(id);
      localStorage.setItem("chess_achievements", JSON.stringify(this.achievements));
      
      // Hiện thông báo popup huy hiệu góc màn hình
      const toast = document.createElement("div");
      toast.className = "achievement-toast animated slideInRight";
      toast.innerHTML = `
        <div class="toast-icon">🏅</div>
        <div class="toast-body">
          <div class="toast-title">Đã mở khóa Huy Hiệu!</div>
          <div class="toast-name">${title}</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }

  // Biên dựng trắc nghiệm sinh động (Tab Quiz)
  renderQuiz(quizData) {
    const container = document.getElementById("quiz-questions-container");
    container.innerHTML = "";

    quizData.forEach((q, qIdx) => {
      const card = document.createElement("div");
      card.className = "quiz-question-card glass-panel";
      
      let optionsHTML = "";
      q.options.forEach((opt, oIdx) => {
        optionsHTML += `
          <label class="quiz-option-label" data-qidx="${qIdx}" data-oidx="${oIdx}">
            <input type="radio" name="question-${qIdx}" value="${oIdx}" class="quiz-radio">
            <span class="quiz-option-text">${opt}</span>
          </label>
        `;
      });

      card.innerHTML = `
        <div class="quiz-q-num">Câu hỏi ${qIdx + 1}</div>
        <h4 class="quiz-q-text">${q.question}</h4>
        <div class="quiz-options-grid">${optionsHTML}</div>
        <div class="quiz-feedback-box" id="quiz-feedback-${qIdx}"></div>
      `;

      container.appendChild(card);
    });

    // Thêm nút nộp bài trắc nghiệm
    const submitBtn = document.createElement("button");
    submitBtn.className = "action-btn primary-btn quiz-submit-btn";
    submitBtn.innerText = "Nộp bài & Kiểm tra kết quả";
    submitBtn.addEventListener("click", () => this.gradeQuiz(quizData));
    container.appendChild(submitBtn);
  }

  // Chấm điểm trắc nghiệm và hiện giải thích sinh động
  gradeQuiz(quizData) {
    let score = 0;
    quizData.forEach((q, qIdx) => {
      const selected = document.querySelector(`input[name="question-${qIdx}"]:checked`);
      const feedbackBox = document.getElementById(`quiz-feedback-${qIdx}`);
      const labels = document.querySelectorAll(`.quiz-option-label[data-qidx="${qIdx}"]`);
      
      feedbackBox.style.display = "block";
      labels.forEach(lbl => lbl.classList.remove("correct", "incorrect"));

      if (selected) {
        const val = parseInt(selected.value);
        if (val === q.answer) {
          score++;
          feedbackBox.className = "quiz-feedback-box success-feedback";
          feedbackBox.innerHTML = `🌟 <strong>Chính xác!</strong> ${q.explanation}`;
          document.querySelector(`.quiz-option-label[data-qidx="${qIdx}"][data-oidx="${val}"]`).classList.add("correct");
        } else {
          feedbackBox.className = "quiz-feedback-box fail-feedback";
          feedbackBox.innerHTML = `❌ <strong>Chưa chính xác!</strong> Hãy đọc lại hướng dẫn: ${q.explanation}`;
          document.querySelector(`.quiz-option-label[data-qidx="${qIdx}"][data-oidx="${val}"]`).classList.add("incorrect");
          document.querySelector(`.quiz-option-label[data-qidx="${qIdx}"][data-oidx="${q.answer}"]`).classList.add("correct");
        }
      } else {
        feedbackBox.className = "quiz-feedback-box warning-feedback";
        feedbackBox.innerHTML = `⚠️ Vui lòng chọn một câu trả lời để kiểm tra!`;
      }
    });

    if (score === quizData.length) {
      this.playSuccessSound();
      this.triggerConfetti();
      alert("Tuyệt đỉnh! Bạn đã trả lời đúng 100% câu hỏi trắc nghiệm của bài học này!");
      this.unlockNextLesson();
      this.unlockAchievement("quiz_champion_" + this.currentLessonIdx, "Thủ Khoa Lý Thuyết Bài " + (this.currentLessonIdx + 1));
    } else {
      this.playFailSound();
      alert(`Bạn trả lời đúng ${score}/${quizData.length} câu. Hãy xem lại các giải thích để học sâu hơn nhé!`);
    }
  }

  // Hiệu ứng hạt giấy pháo hoa ăn mừng tuyệt đẹp (Confetti Particle System)
  triggerConfetti() {
    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];

    // Tạo 120 hạt giấy pháo hoa rơi xuống
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        r: Math.random() * 6 + 4,
        d: Math.random() * width,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        speed: Math.random() * 3 + 2
      });
    }

    let animationId;
    const startTime = Date.now();

    function draw() {
      // Dừng lại sau 4 giây để giải phóng bộ nhớ
      if (Date.now() - startTime > 4000) {
        cancelAnimationFrame(animationId);
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.speed;
        p.x += Math.sin(p.tiltAngle) * 0.5;
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        // Nếu bay hết màn hình thì quay lại từ trên xuống
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(draw);
    }

    // Tự động thay đổi kích cỡ canvas khi đổi cửa sổ trình duyệt
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Dọn dẹp sự kiện
    setTimeout(() => {
      window.removeEventListener("resize", handleResize);
    }, 4500);

    draw();
  }

  // Khởi động trận giao đấu gia đình (versus mode)
  startFamilyMatch() {
    const mode = document.getElementById("family-game-mode").value;
    const motherLevel = document.getElementById("mother-skill-level").value;
    const opponentLevel = document.getElementById("opponent-skill-level").value;
    
    // Cấu hình vị trí quân cờ ban đầu
    let pieces = {};

    if (mode === "standard") {
      // Thiết lập bàn cờ tiêu chuẩn 16x16 quân
      pieces = {
        "a1": "wR", "b1": "wN", "c1": "wB", "d1": "wQ", "e1": "wK", "f1": "wB", "g1": "wN", "h1": "wR",
        "a2": "wP", "b2": "wP", "c2": "wP", "d2": "wP", "e2": "wP", "f2": "wP", "g2": "wP", "h2": "wP",
        "a7": "bP", "b7": "bP", "c7": "bP", "d7": "bP", "e7": "bP", "f7": "bP", "g7": "bP", "h7": "bP",
        "a8": "bR", "b8": "bN", "c8": "bB", "d8": "bQ", "e8": "bK", "f8": "bB", "g8": "bN", "h8": "bR"
      };

      // Áp dụng tự động Đòn Chấp cờ (nhường quân) theo mức trình độ của Bố / Bé
      if (opponentLevel === "master") {
        delete pieces["d8"]; // Cao thủ Bố: Nhường quân Hậu
      } else if (opponentLevel === "casual") {
        delete pieces["a8"]; // Biết chơi Bé: Nhường quân Xe
      }
    } else if (mode === "pawn_battle") {
      // Chế độ chơi Chiến tranh Tốt (Pawn Battle)
      pieces = {
        "a2": "wP", "b2": "wP", "c2": "wP", "d2": "wP", "e2": "wP", "f2": "wP", "g2": "wP", "h2": "wP",
        "a7": "bP", "b7": "bP", "c7": "bP", "d7": "bP", "e7": "bP", "f7": "bP", "g7": "bP", "h7": "bP"
      };
    } else if (mode === "knight_hunt") {
      // Chế độ chơi Mã Trắng của Mẹ săn Tốt Đen
      pieces = {
        "d1": "wN",
        "a7": "bP", "b7": "bP", "c7": "bP", "d7": "bP", "e7": "bP", "f7": "bP", "g7": "bP", "h7": "bP"
      };
    }

    // Dựng lại khung chứa bàn cờ mới
    const container = document.getElementById("versus-chessboard-container");
    container.innerHTML = `<div id="versus-board"></div>`;

    // Thiết lập số lượt Thẻ Quyền Năng tùy theo Trình độ của Mẹ
    this.doubleMoveActive = false;
    if (motherLevel === "beginner") {
      this.undoCharges = 2;
      this.doubleMoveCharges = 1;
    } else if (motherLevel === "intermediate") {
      this.undoCharges = 1;
      this.doubleMoveCharges = 0;
    } else {
      // Trình độ Advanced (Kỳ thủ thực thụ): Không dùng thẻ
      this.undoCharges = 0;
      this.doubleMoveCharges = 0;
    }

    // Khởi tạo bàn cờ Versus hai người chơi
    this.versusBoard = new InteractiveBoard("versus-board", {
      mode: "versus",
      showHints: (motherLevel !== "advanced"), // Tắt chấm gợi ý đi cờ nếu Mẹ chơi nâng cao
      onMove: (from, to, isCapture, capturedPiece) => {
        this.playMoveSound(isCapture);

        // Xử lý Quyền năng sấm sét "Đi đôi nước" (Double Move)
        if (this.doubleMoveActive) {
          // Trả lại lượt đi cho Mẹ Yêu (Trắng) thay vì đổi sang Đen
          this.versusBoard.currentTurn = "w";
          this.doubleMoveActive = false;
          this.updateVersusTurnIndicator("w");
          this.playSuccessSound(); // Phát âm thanh reo mừng
          alert("⚡ Quyền năng kích hoạt: Mẹ được đi tiếp thêm 1 nước nữa!");
        }
      },
      onTurnChange: (turn) => {
        this.updateVersusTurnIndicator(turn);
      }
    });

    this.versusBoard.setupBoard(pieces);
    this.updateVersusTurnIndicator("w");

    // Hiển thị hoặc ẩn khay thẻ quyền năng tùy thuộc vào trình độ của Mẹ
    const powerCardsArea = document.getElementById("power-cards-area");
    if (motherLevel === "advanced") {
      powerCardsArea.style.display = "none";
    } else {
      powerCardsArea.style.display = "block";

      // Khởi động các nút Thẻ Quyền Năng
      const undoBtn = document.getElementById("card-undo");
      const doubleBtn = document.getElementById("card-double");

      undoBtn.className = "power-card-btn";
      undoBtn.querySelector(".card-name").innerText = `Đi Lại (Còn ${this.undoCharges})`;

      doubleBtn.className = "power-card-btn";
      doubleBtn.querySelector(".card-name").innerText = `Đi Đôi (Còn ${this.doubleMoveCharges})`;

      // Cập nhật trạng thái hiển thị của nút
      if (this.undoCharges === 0) {
        undoBtn.classList.add("used");
      } else {
        undoBtn.classList.remove("used");
      }

      if (this.doubleMoveCharges === 0) {
        doubleBtn.classList.add("used");
      } else {
        doubleBtn.classList.remove("used");
      }

      // Đăng ký sự kiện nút "Đi Lại" (Undo)
      undoBtn.onclick = () => {
        if (this.versusBoard.currentTurn === "b") {
          alert("Mẹ phải đợi đến lượt mình (Quân Trắng) hoặc vừa đi xong mới có thể rút lại nước đi!");
          return;
        }
        if (this.undoCharges > 0) {
          const success = this.versusBoard.undoLastMove();
          if (success) {
            this.undoCharges--;
            undoBtn.querySelector(".card-name").innerText = `Đi Lại (Còn ${this.undoCharges})`;
            
            // Phát tiếng phù thủy thời gian (Sóng âm kéo lùi)
            if (this.audioCtx) {
              const now = this.audioCtx.currentTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              osc.connect(gain);
              gain.connect(this.audioCtx.destination);
              osc.frequency.setValueAtTime(600, now);
              osc.frequency.exponentialRampToValueAtTime(150, now + 0.35);
              gain.gain.setValueAtTime(0.25, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
              osc.start(now);
              osc.stop(now + 0.35);
            }

            if (this.undoCharges === 0) {
              undoBtn.classList.add("used");
            }
          } else {
            alert("Không có nước đi nào trước đó của Mẹ để rút lại!");
          }
        }
      };

      // Đăng ký sự kiện nút "Đi Đôi" (Double Move)
      doubleBtn.onclick = () => {
        if (this.versusBoard.currentTurn !== "w") {
          alert("Thẻ quyền năng này chỉ có thể sử dụng khi đang tới lượt đi của Mẹ!");
          return;
        }
        if (this.doubleMoveCharges > 0) {
          this.doubleMoveActive = true;
          this.doubleMoveCharges--;
          doubleBtn.querySelector(".card-name").innerText = `Đi Đôi (Còn ${this.doubleMoveCharges})`;
          doubleBtn.classList.add("used");

          // Phát tiếng sấm sét
          if (this.audioCtx) {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(500, now + 0.25);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
          }
        }
      };
    }

    // Tạo âm thanh phát súng khai chiến gia đình
    this.playSuccessSound();
  }

  // Cập nhật thanh trạng thái lượt đi của Đấu Trường
  updateVersusTurnIndicator(turn) {
    const indicator = document.getElementById("versus-turn-indicator");
    const dot = indicator.querySelector(".turn-dot");
    const txt = document.getElementById("turn-text");

    const kName = document.getElementById("kid-name-input").value || "Mẹ Yêu";
    const pName = document.getElementById("parent-name-input").value || "Bố & Bé";

    dot.className = "turn-dot";

    if (turn === "w") {
      dot.classList.add("white-turn");
      txt.innerHTML = `Lượt chơi: <strong>${kName}</strong> (Quân Trắng)`;
      indicator.style.borderColor = "rgba(255, 255, 255, 0.2)";
    } else {
      dot.classList.add("black-turn");
      txt.innerHTML = `Lượt chơi: <strong>${pName}</strong> (Quân Đen)`;
      indicator.style.borderColor = "var(--color-primary)";
    }
  }
}

// Khởi chạy ứng dụng khi tải trang xong
window.addEventListener("DOMContentLoaded", () => {
  window.app = new AppCoordinator();
});
