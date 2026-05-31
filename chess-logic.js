/**
 * chess-logic.js
 * Bộ dựng và điều khiển bàn cờ tương tác tùy biến dành cho giáo trình cờ vua gia đình.
 * Hỗ trợ: vẽ bàn cờ, hiển thị quân bằng SVG sắc nét, gợi ý nước đi, thu thập sao, giải đố chiến thuật, và vẽ mũi tên trực quan.
 */

class InteractiveBoard {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      mode: "sandbox", // "sandbox" | "star" | "puzzle" | "versus"
      showHints: true,  // Bật/Tắt hiển thị gợi ý ô đi cờ
      onMove: null,     // Callback khi quân di chuyển (from, to, isCapture, capturedPiece)
      onStarCollected: null, // Callback khi ăn được sao
      onWin: null,      // Callback khi hoàn thành màn chơi
      onFail: null,     // Callback khi đi sai nước trong màn puzzle
      onTurnChange: null // Callback khi đổi lượt đi trong đấu trường
    }, options);

    this.boardState = {}; // Tọa độ -> quân cờ (vd: "e4": "wP")
    this.stars = [];      // Danh sách các ô chứa sao (vd: ["c6", "f3"])
    this.activePiece = null; // Quân cờ đang được người chơi điều khiển
    this.activeSquare = null; // Ô đang được chọn
    this.moveCount = 0;
    this.legalMoves = [];
    this.puzzleSolution = null; // Ô đáp án cho màn câu đố
    this.arrows = []; // Danh sách các mũi tên vẽ trên bàn cờ [{from, to, color}]
    this.currentTurn = "w"; // Lượt đi: 'w' (Trắng - Con) hoặc 'b' (Đen - Bố/Mẹ)
    
    this.pieceSVGs = {
      wP: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 1.25.68 2.33 1.69 2.91C17.15 32.14 16 33.93 16 36v1h13v-1c0-2.07-1.15-3.86-2.69-4.31 1.01-.58 1.69-1.66 1.69-2.91 0-1.12-.58-2.1-1.41-2.75 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      wN: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,29 18,29 C 17,30 16,32 16,34 C 16,36 19,38 22,38 C 25,38 27,35 29,35 C 31,35 32,37 32,37 C 32,37 31,33 30,30 C 32,26 32,19 29,15 C 26,11 22,10 22,10 z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#000000" transform="matrix(0.861785,0.507281,-0.507281,0.861785,27.4208,-4.2754)"/></svg>`,
      wB: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M9 36c3.39 0 7.66-.69 11.77-2.3 4 1.51 8.08 2.22 11.51 2.24.64.01 1.13-.53 1.14-1.18V33.5c0-.6-.44-1.11-1.04-1.18C28.2 31.85 25 30 22.5 27.5c0 0-2.5 2.5-6.5 4.5-2.73.91-5.73 1.18-7.96 1.32-.6.04-1.04.54-1.04 1.14V35c0 .55.45 1 1 1zM22.5 8c-3.04 0-5.5 2.46-5.5 5.5 0 1.93 1.05 3.61 2.59 4.54C16.92 20.31 15 23.93 15 28c0 .55.45 1 1 1h13c.55 0 1-.45 1-1 0-4.07-1.92-7.69-4.59-9.96 1.54-.93 2.59-2.61 2.59-4.54 0-3.04-2.46-5.5-5.5-5.5z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22.5" cy="5" r="2" fill="#ffffff" stroke="#000000" stroke-width="1.5"/></svg>`,
      wR: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M9 39h27v-3H9v3zm3-13v7h21v-7H12zm2.5-11h16V9H26v3.5h-7V9h-4.5v6zm-.5 11h17v-8H14v8z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      wQ: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="#ffffff" stroke="#000000" stroke-width="1.5"/><path d="M9 37h27v-3H9v3zm3.5-21l3 15h14l3-15H12.5z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      wK: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 11.63V6M20 8h5M22.5 25c-3.58 0-6.5-2.92-6.5-6.5s2.92-6.5 6.5-6.5 6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5zM11.5 30c0-4.14 3.36-7.5 7.5-7.5h7c4.14 0 7.5 3.36 7.5 7.5v6h-22v-6z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      
      bP: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.65-1.41 1.63-1.41 2.75 0 1.25.68 2.33 1.69 2.91C17.15 32.14 16 33.93 16 36v1h13v-1c0-2.07-1.15-3.86-2.69-4.31 1.01-.58 1.69-1.66 1.69-2.91 0-1.12-.58-2.1-1.41-2.75 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      bN: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14,20 18,20 C 18,20 17,21 15,24 C 13,27 13,31 13,31 C 13,31 15,29 18,29 C 17,30 16,32 16,34 C 16,36 19,38 22,38 C 25,38 27,35 29,35 C 31,35 32,37 32,37 C 32,37 31,33 30,30 C 32,26 32,19 29,15 C 26,11 22,10 22,10 z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#ffffff" transform="matrix(0.861785,0.507281,-0.507281,0.861785,27.4208,-4.2754)"/></svg>`,
      bB: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M9 36c3.39 0 7.66-.69 11.77-2.3 4 1.51 8.08 2.22 11.51 2.24.64.01 1.13-.53 1.14-1.18V33.5c0-.6-.44-1.11-1.04-1.18C28.2 31.85 25 30 22.5 27.5c0 0-2.5 2.5-6.5 4.5-2.73.91-5.73 1.18-7.96 1.32-.6.04-1.04.54-1.04 1.14V35c0 .55.45 1 1 1zM22.5 8c-3.04 0-5.5 2.46-5.5 5.5 0 1.93 1.05 3.61 2.59 4.54C16.92 20.31 15 23.93 15 28c0 .55.45 1 1 1h13c.55 0 1-.45 1-1 0-4.07-1.92-7.69-4.59-9.96 1.54-.93 2.59-2.61 2.59-4.54 0-3.04-2.46-5.5-5.5-5.5z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22.5" cy="5" r="2" fill="#313131" stroke="#ffffff" stroke-width="1.5"/></svg>`,
      bR: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M9 39h27v-3H9v3zm3-13v7h21v-7H12zm2.5-11h16V9H26v3.5h-7V9h-4.5v6zm-.5 11h17v-8H14v8z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      bQ: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM22.5 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="#313131" stroke="#ffffff" stroke-width="1.5"/><path d="M9 37h27v-3H9v3zm3.5-21l3 15h14l3-15H12.5z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      bK: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="M22.5 11.63V6M20 8h5M22.5 25c-3.58 0-6.5-2.92-6.5-6.5s2.92-6.5 6.5-6.5 6.5 2.92 6.5 6.5-2.92 6.5-6.5 6.5zM11.5 30c0-4.14 3.36-7.5 7.5-7.5h7c4.14 0 7.5 3.36 7.5 7.5v6h-22v-6z" fill="#313131" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
      
      star: `<svg viewBox="0 0 24 24" class="star-svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#f59e0b" stroke="#fff" stroke-width="1"/></svg>`
    };

    this.files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    this.ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    this.initDOM();
  }

  // Khởi tạo khung bàn cờ HTML
  initDOM() {
    this.container.innerHTML = "";
    this.container.classList.add("chess-board-wrapper");

    const boardDiv = document.createElement("div");
    boardDiv.className = "chess-board-grid";
    boardDiv.id = "board-grid";

    // Tạo các ô cờ 8x8
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const file = this.files[f];
        const rank = this.ranks[r];
        const coord = file + rank;

        const square = document.createElement("div");
        square.className = `board-square ${(r + f) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.coord = coord;
        
        // Thêm nhãn tọa độ ở rìa
        if (f === 0) {
          const rankLabel = document.createElement("span");
          rankLabel.className = "coordinate-label rank-label";
          rankLabel.innerText = rank;
          square.appendChild(rankLabel);
        }
        if (r === 7) {
          const fileLabel = document.createElement("span");
          fileLabel.className = "coordinate-label file-label";
          fileLabel.innerText = file;
          square.appendChild(fileLabel);
        }

        // Tạo phần chứa quân cờ/sao
        const pieceContainer = document.createElement("div");
        pieceContainer.className = "piece-container";
        square.appendChild(pieceContainer);

        // Tạo vòng gợi ý gợi ý di chuyển
        const indicator = document.createElement("div");
        indicator.className = "move-indicator";
        square.appendChild(indicator);

        // Sự kiện click ô cờ
        square.addEventListener("click", () => this.handleSquareClick(coord));

        boardDiv.appendChild(square);
      }
    }

    // Container vẽ mũi tên (SVG overlay)
    const svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgOverlay.setAttribute("class", "arrows-overlay");
    svgOverlay.setAttribute("id", "board-arrows");
    
    this.container.appendChild(boardDiv);
    this.container.appendChild(svgOverlay);

    // Kích hoạt redraw mũi tên khi resize window
    window.addEventListener("resize", () => this.drawArrows());
  }

  // Thiết lập trạng thái bàn cờ ban đầu
  setupBoard(boardState, stars = [], activePiece = null, startPos = null, solution = null) {
    this.boardState = Object.assign({}, boardState);
    this.stars = [...stars];
    this.activePiece = activePiece;
    this.activeSquare = startPos;
    this.puzzleSolution = solution;
    this.moveCount = 0;
    this.legalMoves = [];
    this.arrows = [];
    this.currentTurn = "w"; // Mặc định Trắng đi trước
    
    this.updateBoardDOM();
    this.drawArrows();
  }

  // Cập nhật giao diện theo dữ liệu hiện tại
  updateBoardDOM() {
    const squares = this.container.querySelectorAll(".board-square");
    squares.forEach(sq => {
      const coord = sq.dataset.coord;
      const pieceCont = sq.querySelector(".piece-container");
      pieceCont.innerHTML = "";
      sq.classList.remove("selected", "has-star", "highlight-attack");

      // Vẽ quân cờ nếu có
      if (this.boardState[coord]) {
        const pieceCode = this.boardState[coord];
        pieceCont.innerHTML = this.pieceSVGs[pieceCode] || "";
        
        // Thêm hiệu ứng đặc biệt nếu là quân của người chơi
        if (coord === this.activeSquare) {
          sq.classList.add("selected");
        }
      }

      // Vẽ ngôi sao
      if (this.stars.includes(coord)) {
        pieceCont.innerHTML = this.pieceSVGs.star;
        sq.classList.add("has-star");
      }

      // Ẩn hiển thị chấm gợi ý đi
      sq.classList.remove("legal-move", "legal-capture");
      if (this.options.showHints && this.legalMoves.includes(coord)) {
        if (this.stars.includes(coord) || (this.boardState[coord] && this.boardState[coord][0] !== this.boardState[this.activeSquare][0])) {
          sq.classList.add("legal-capture");
        } else {
          sq.classList.add("legal-move");
        }
      }
    });
  }

  // Xử lý sự kiện click ô cờ
  handleSquareClick(coord) {
    // Màn puzzle / star: Người chơi chỉ di chuyển activePiece từ startPos
    if (this.options.mode === "puzzle" || this.options.mode === "star") {
      // Nếu click vào quân của mình để kích hoạt gợi ý nước đi
      if (this.boardState[coord] && this.boardState[coord] === this.activePiece) {
        this.activeSquare = coord;
        this.legalMoves = this.calculateLegalMoves(coord);
        this.updateBoardDOM();
        return;
      }

      // Nếu click vào ô hợp lệ để di chuyển
      if (this.legalMoves.includes(coord)) {
        this.moveActivePiece(this.activeSquare, coord);
      }
    } else if (this.options.mode === "versus") {
      // Giao đấu 2 người chơi (alternate turns)
      const turn = this.currentTurn; // 'w' hoặc 'b'
      
      // Nếu có quân đang được chọn và click vào ô di chuyển hợp lệ
      if (this.legalMoves.includes(coord)) {
        this.moveActivePiece(this.activeSquare, coord);
        return;
      }

      // Nếu click chọn quân cờ đúng lượt đi
      if (this.boardState[coord] && this.boardState[coord][0] === turn) {
        this.activeSquare = coord;
        this.legalMoves = this.calculateLegalMoves(coord);
        this.updateBoardDOM();
      } else {
        // Reset trạng thái chọn nếu click linh tinh
        this.activeSquare = null;
        this.legalMoves = [];
        this.updateBoardDOM();
      }
    } else {
      // Sandbox Mode: Cho phép chọn và đi tự do bất kỳ quân nào
      if (this.boardState[coord]) {
        this.activeSquare = coord;
        this.legalMoves = this.calculateLegalMoves(coord);
        this.updateBoardDOM();
      } else if (this.legalMoves.includes(coord)) {
        this.moveActivePiece(this.activeSquare, coord);
      } else {
        this.activeSquare = null;
        this.legalMoves = [];
        this.updateBoardDOM();
      }
    }
  }

  // Thực hiện di chuyển quân cờ
  moveActivePiece(from, to) {
    const piece = this.boardState[from];
    const capturedPiece = this.boardState[to]; // Ghi nhận quân cờ bị ăn
    
    // Ghi chép lịch sử nước đi để hỗ trợ nút QUYỀN NĂNG "ĐI LẠI" (Undo)
    this.historyState = {
      boardState: Object.assign({}, this.boardState),
      stars: [...this.stars],
      activeSquare: from,
      currentTurn: this.currentTurn,
      moveCount: this.moveCount
    };

    delete this.boardState[from];
    this.boardState[to] = piece;
    
    this.activeSquare = to;
    this.moveCount++;
    this.legalMoves = [];

    // Kích hoạt âm thanh đặt quân bằng cách gọi app.js phát qua callback
    if (this.options.onMove) {
      const isCapture = this.stars.includes(to) || capturedPiece;
      this.options.onMove(from, to, isCapture, capturedPiece);
    }

    // Xử lý ăn sao (Star Collector)
    if (this.stars.includes(to)) {
      this.stars = this.stars.filter(s => s !== to);
      if (this.options.onStarCollected) {
        this.options.onStarCollected(to);
      }
    }

    // Kiểm tra pháp lệnh Phong cấp trong Star Game (Tốt lên e8) hoặc Đấu trường (Tốt hàng 8 hoặc 1)
    if (piece[1] === "P") {
      const isPromotion = (piece[0] === "w" && to[1] === "8") || (piece[0] === "b" && to[1] === "1");
      if (isPromotion) {
        // Tự động thăng cấp thành Hậu cho đơn giản và bài bản
        const promoPiece = piece[0] + "Q";
        this.boardState[to] = promoPiece;
        if (this.options.onMove) {
          this.options.onMove(to, to, "promote");
        }
      }
    }

    this.updateBoardDOM();

    // Kiểm tra hoàn thành màn chơi
    setTimeout(() => {
      if (this.options.mode === "star") {
        if (this.stars.length === 0) {
          if (this.options.onWin) {
            this.options.onWin(this.moveCount);
          }
        } else {
          // Sau khi đi, tự động gợi ý nước đi tiếp theo
          this.legalMoves = this.calculateLegalMoves(to);
          this.updateBoardDOM();
        }
      } else if (this.options.mode === "puzzle") {
        if (to === this.puzzleSolution) {
          if (this.options.onWin) {
            this.options.onWin(this.moveCount);
          }
        } else {
          if (this.options.onFail) {
            this.options.onFail();
          }
          // Reset về ban đầu nếu đi sai
          setTimeout(() => {
            this.setupBoard(
              Object.assign({}, this.boardState, { [from]: piece }), 
              this.stars, 
              this.activePiece, 
              from, 
              this.puzzleSolution
            );
          }, 800);
        }
      } else if (this.options.mode === "versus") {
        // Luân phiên lượt đi trong đấu trường
        this.currentTurn = this.currentTurn === "w" ? "b" : "w";
        if (this.options.onTurnChange) {
          this.options.onTurnChange(this.currentTurn);
        }
      }
    }, 400);
  }

  // Khôi phục nước đi trước (Hỗ trợ thẻ bài quyền năng)
  undoLastMove() {
    if (this.historyState) {
      this.boardState = Object.assign({}, this.historyState.boardState);
      this.stars = [...this.historyState.stars];
      this.activeSquare = this.historyState.activeSquare;
      this.currentTurn = this.historyState.currentTurn;
      this.moveCount = this.historyState.moveCount;
      this.legalMoves = [];
      this.historyState = null; // Chỉ cho phép undo 1 nước gần nhất
      
      this.updateBoardDOM();
      
      if (this.options.onTurnChange) {
        this.options.onTurnChange(this.currentTurn);
      }
      return true;
    }
    return false;
  }

  // Tính toán các nước đi hợp lệ cho từng quân cờ
  calculateLegalMoves(coord) {
    const piece = this.boardState[coord];
    if (!piece) return [];

    const color = piece[0]; // 'w' hoặc 'b'
    const type = piece[1];  // 'P', 'N', 'B', 'R', 'Q', 'K'
    const file = coord[0];
    const rank = coord[1];
    const fIdx = this.files.indexOf(file);
    const rIdx = this.ranks.indexOf(rank);

    let moves = [];

    switch (type) {
      case "P": { // Tốt (Pawn)
        const direction = color === "w" ? -1 : 1; // wP đi lên (-1 rank index), bP đi xuống (+1)
        
        // Đi thẳng 1 ô
        const nextR = rIdx + direction;
        if (nextR >= 0 && nextR < 8) {
          const targetCoord = this.files[fIdx] + this.ranks[nextR];
          if (!this.boardState[targetCoord] && !this.stars.includes(targetCoord)) {
            moves.push(targetCoord);
            
            // Đi thẳng 2 ô từ hàng xuất phát (hàng 2 cho Trắng, hàng 7 cho Đen)
            const startRank = color === "w" ? "2" : "7";
            const doubleR = rIdx + 2 * direction;
            const doubleCoord = this.files[fIdx] + this.ranks[doubleR];
            if (rank === startRank && !this.boardState[doubleCoord] && !this.stars.includes(doubleCoord)) {
              moves.push(doubleCoord);
            }
          }
        }

        // Ăn chéo 1 ô (nếu có sao hoặc đối thủ đứng đó)
        const eatFiles = [fIdx - 1, fIdx + 1];
        eatFiles.forEach(ef => {
          if (ef >= 0 && ef < 8 && nextR >= 0 && nextR < 8) {
            const target = this.files[ef] + this.ranks[nextR];
            if (this.stars.includes(target) || (this.boardState[target] && this.boardState[target][0] !== color)) {
              moves.push(target);
            }
          }
        });

        // Đặc cách đặc biệt cho màn Star Game: Tốt được phép đi e7, e8 tự do
        if (this.options.mode === "star" && piece === "wP") {
          // Cho phép tốt đi thẳng ăn sao chéo hoặc ăn sao thẳng để bài học không quá phức tạp
          const targets = [this.files[fIdx] + this.ranks[nextR]];
          eatFiles.forEach(ef => {
            if (ef >= 0 && ef < 8 && nextR >= 0 && nextR < 8) {
              targets.push(this.files[ef] + this.ranks[nextR]);
            }
          });
          targets.forEach(t => {
            if (this.stars.includes(t) && !moves.includes(t)) {
              moves.push(t);
            }
          });
        }
        break;
      }
      case "R": { // Xe (Rook)
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.exploreDirections(fIdx, rIdx, dirs, color, moves);
        break;
      }
      case "B": { // Tượng (Bishop)
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.exploreDirections(fIdx, rIdx, dirs, color, moves);
        break;
      }
      case "Q": { // Hậu (Queen)
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.exploreDirections(fIdx, rIdx, dirs, color, moves);
        break;
      }
      case "K": { // Vua (King)
        const offsets = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        offsets.forEach(([df, dr]) => {
          const nf = fIdx + df;
          const nr = rIdx + dr;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
            const dest = this.files[nf] + this.ranks[nr];
            if (!this.boardState[dest] || this.boardState[dest][0] !== color || this.stars.includes(dest)) {
              moves.push(dest);
            }
          }
        });
        break;
      }
      case "N": { // Mã (Knight)
        const offsets = [
          [1, 2], [1, -2], [-1, 2], [-1, -2],
          [2, 1], [2, -1], [-2, 1], [-2, -1]
        ];
        offsets.forEach(([df, dr]) => {
          const nf = fIdx + df;
          const nr = rIdx + dr;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
            const dest = this.files[nf] + this.ranks[nr];
            // Mã có thể nhảy qua mọi quân, chỉ cần ô đến trống hoặc là quân địch/sao
            if (!this.boardState[dest] || this.boardState[dest][0] !== color || this.stars.includes(dest)) {
              moves.push(dest);
            }
          }
        });
        break;
      }
    }

    return moves;
  }

  // Khám phá các tia đi thẳng của Xe, Tượng, Hậu
  exploreDirections(fIdx, rIdx, dirs, color, moves) {
    dirs.forEach(([df, dr]) => {
      let nf = fIdx + df;
      let nr = rIdx + dr;
      while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
        const dest = this.files[nf] + this.ranks[nr];
        
        // Nếu ô trống
        if (!this.boardState[dest]) {
          moves.push(dest);
          // Trong màn ăn sao, sao không cản đường đi tiếp
          if (this.stars.includes(dest)) {
            // Sao được tính như ô trống cho phép đi xuyên qua ở cự ly xa
          }
        } else {
          // Gặp quân cản
          if (this.boardState[dest][0] !== color) {
            moves.push(dest); // Ăn quân địch
          }
          break; // Bị cản đường đi tiếp
        }
        
        nf += df;
        nr += dr;
      }
    });
  }

  // Thêm một mũi tên chiến thuật
  addArrow(from, to, color = "#10b981") {
    this.arrows.push({ from, to, color });
    this.drawArrows();
  }

  // Vẽ các mũi tên chiến thuật bằng SVG
  drawArrows() {
    const svgOverlay = this.container.querySelector(".arrows-overlay");
    if (!svgOverlay) return;
    svgOverlay.innerHTML = "";

    const boardGrid = this.container.querySelector(".chess-board-grid");
    if (!boardGrid) return;
    const boardRect = boardGrid.getBoundingClientRect();

    // Định nghĩa đầu mũi tên (marker) trong SVG
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const colors = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"]; // Emerald, Red, Yellow, Blue
    colors.forEach(col => {
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      const cleanId = "arrow-" + col.replace("#", "");
      marker.setAttribute("id", cleanId);
      marker.setAttribute("viewBox", "0 0 10 10");
      marker.setAttribute("refX", "7");
      marker.setAttribute("refY", "5");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto-start-reverse");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M 0 1 L 10 5 L 0 9 z");
      path.setAttribute("fill", col);
      
      marker.appendChild(path);
      defs.appendChild(marker);
    });
    svgOverlay.appendChild(defs);

    // Vẽ từng mũi tên
    this.arrows.forEach(({ from, to, color }) => {
      const fromSq = boardGrid.querySelector(`[data-coord="${from}"]`);
      const toSq = boardGrid.querySelector(`[data-coord="${to}"]`);
      if (!fromSq || !toSq) return;

      const fromRect = fromSq.getBoundingClientRect();
      const toRect = toSq.getBoundingClientRect();

      // Tính điểm trung tâm của mỗi ô cờ so với bàn cờ
      const x1 = fromRect.left - boardRect.left + fromRect.width / 2;
      const y1 = fromRect.top - boardRect.top + fromRect.height / 2;
      const x2 = toRect.left - boardRect.left + toRect.width / 2;
      const y2 = toRect.top - boardRect.top + toRect.height / 2;

      // Tính khoảng cách để rút ngắn mũi tên, tránh đè lên quân cờ
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const shortenFrom = 10;
      const shortenTo = 20;

      const startX = x1 + shortenFrom * Math.cos(angle);
      const startY = y1 + shortenFrom * Math.sin(angle);
      const endX = x2 - shortenTo * Math.cos(angle);
      const endY = y2 - shortenTo * Math.sin(angle);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", startX.toString());
      line.setAttribute("y1", startY.toString());
      line.setAttribute("x2", endX.toString());
      line.setAttribute("y2", endY.toString());
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "5");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("opacity", "0.85");
      
      const cleanColorId = "arrow-" + color.replace("#", "");
      line.setAttribute("marker-end", `url(#${cleanColorId})`);

      svgOverlay.appendChild(line);
    });
  }

  // Xóa toàn bộ mũi tên
  clearArrows() {
    this.arrows = [];
    this.drawArrows();
  }
}

// Xuất lớp InteractiveBoard
if (typeof module !== "undefined" && module.exports) {
  module.exports = { InteractiveBoard };
}
