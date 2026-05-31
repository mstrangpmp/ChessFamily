/**
 * lessons.js
 * Database giáo trình, câu hỏi trắc nghiệm, và cấu hình các màn chơi tương tác (Star Collector & Tactical Puzzles)
 * cho ứng dụng ChessFamily.
 */

const LESSONS_DATA = [
  {
    id: "lesson1",
    title: "Bài 1: Binh chủng Cờ Vua",
    subtitle: "Làm quen với 6 loại quân cờ & Sức mạnh của chúng",
    intro: "Mỗi ván cờ vua là một trận chiến giữa hai vương quốc. Quân đội của bạn gồm 6 loại binh chủng khác nhau, mỗi loại có cách di chuyển và sức mạnh riêng được đo bằng điểm số. Hãy cùng khám phá nhé!",
    sections: [
      {
        title: "1. Vua (King) - Linh hồn của ván cờ",
        value: "Giá trị: Vô giá (Mất Vua là thua trận)",
        desc: "Vua là quân cờ quan trọng nhất. Mỗi nước đi, Vua chỉ được đi **1 ô duy nhất** về mọi hướng (ngang, dọc, chéo). Tuy di chuyển chậm chạm nhưng Vua có quyền lực tuyệt đối.",
        comparison: "Pháp lệnh cốt lõi: Vua đi khắp bàn cờ để chỉ huy, không bị giới hạn trong một khu vực nào."
      },
      {
        title: "2. Hậu (Queen) - Nữ tướng quân siêu năng lực",
        value: "Giá trị: 9 điểm (Quân cờ mạnh nhất)",
        desc: "Hậu là quân cờ cơ động và mạnh nhất trên bàn cờ. Hậu kết hợp sức mạnh của Xe và Tượng: có thể đi **ngang, dọc, hoặc chéo không giới hạn số ô** miễn là đường đi trống.",
        comparison: "Chiến thuật: Hãy giữ Hậu cẩn thận, đây là ngòi nổ chính cho mọi đòn tấn công."
      },
      {
        title: "3. Xe (Rook) - Pháo đài viễn chinh",
        value: "Giá trị: 5 điểm (Quân cờ hạng nặng)",
        desc: "Xe đi theo các **hàng ngang và cột dọc không giới hạn số ô**. Xe cực kỳ mạnh mẽ ở giai đoạn trung cuộc và tàn cuộc khi bàn cờ đã thông thoáng.",
        comparison: "Chiến thuật: Xe đi dọc ngang như một pháo đài thép bảo vệ biên giới."
      },
      {
        title: "4. Tượng (Bishop) - Cận vệ đường chéo",
        value: "Giá trị: 3 điểm",
        desc: "Tượng chỉ di chuyển theo **các đường chéo không giới hạn số ô**. Mỗi bên sẽ có một Tượng đi ô Trắng và một Tượng đi ô Đen. Tượng không bao giờ thay đổi màu ô mà nó đứng từ đầu trận.",
        comparison: "Chiến thuật: Tượng hoạt động tốt nhất ở các góc chéo mở, kiểm soát đường dài."
      },
      {
        title: "5. Mã (Knight) - Kỵ binh nhảy rào",
        value: "Giá trị: 3 điểm",
        desc: "Mã di chuyển theo **hình chữ L** (đi 2 ô dọc rồi 1 ô ngang, hoặc 2 ô ngang rồi 1 ô dọc). Đặc quyền tối cao của Mã là **được phép nhảy qua đầu** các quân cờ khác (cả quân mình lẫn đối phương) mà không bị cản chân!",
        comparison: "Chiến thuật: Mã cực kỳ nguy hiểm trong các thế trận chật hẹp nhờ khả năng lách qua khe hở."
      },
      {
        title: "6. Tốt (Pawn) - Những chiến binh dũng cảm",
        value: "Giá trị: 1 điểm",
        desc: "Quân đông đảo nhất. Nước đầu tiên có thể chọn đi **1 hoặc 2 ô thẳng**, các nước tiếp theo chỉ đi **1 ô thẳng**. Tốt **đi thẳng nhưng ăn chéo 1 ô** phía trước. Tốt không được đi lùi.",
        comparison: "Chiến thuật: Tốt là lá chắn cho Vua và là nền tảng của cấu trúc trận địa."
      }
    ],
    starGame: {
      instructions: "Nhiệm vụ: Hãy điều khiển quân Mã (Kỵ binh) di chuyển hình chữ L để ăn hết toàn bộ Ngôi sao trên bàn cờ với số nước đi ít nhất có thể!",
      pieceType: "wN", // white Knight
      startPos: "d4",
      stars: ["c6", "b8", "a6", "b4", "d3", "f2"],
      parMoves: 6
    }
  },
  {
    id: "lesson2",
    title: "Bài 2: Các Pháp lệnh Đặc biệt",
    subtitle: "Nhập thành, Phong cấp, Bắt tốt qua đường & Luật chạm quân",
    intro: "Để chơi cờ vua chuyên nghiệp và bài bản, bạn và con cần nắm chắc các quy tắc thi đấu chính thức. Đây là những 'pháp lệnh' bắt buộc mà mọi kỳ thủ phải tuân thủ.",
    sections: [
      {
        title: "1. Pháp lệnh: Nhập thành (Castling)",
        desc: "Nước đi duy nhất di chuyển 2 quân cùng lúc: Vua dịch chuyển **2 ô** về phía Xe, và Xe nhảy qua đầu Vua đứng ở ô bên cạnh. Điều kiện: Vua và Xe chưa từng đi nước nào, đường đi ở giữa phải trống, Vua không bị chiếu và không đi qua ô bị đối phương kiểm soát.",
        benefit: "Mục đích: Đưa Vua vào góc an toàn và đưa Xe ra giữa chiến đấu."
      },
      {
        title: "2. Pháp lệnh: Phong cấp (Pawn Promotion)",
        desc: "Khi một quân Tốt dũng cảm tiến tới hàng cuối cùng ở bên kia chiến tuyến (hàng 8 với Trắng, hàng 1 với Đen), nó bắt buộc phải được biến hình ngay lập tức thành một quân mạnh hơn: **Hậu, Xe, Tượng, hoặc Mã** tùy bạn chọn (thường chọn Hậu).",
        benefit: "Mục đích: Tốt nhỏ bé có thể lội ngược dòng trở thành quân cờ thống trị."
      },
      {
        title: "3. Pháp lệnh: Bắt tốt qua đường (En Passant)",
        desc: "Nếu tốt đối phương nhảy vọt 2 ô từ vị trí xuất phát để đứng ngay bên cạnh tốt của bạn. Ở ngay nước đi tiếp theo đó (chỉ ngay nước đó thôi), bạn có quyền đi chéo ra sau lưng tốt đối phương 1 ô và ăn quân tốt đó như thể nó chỉ đi 1 ô.",
        benefit: "Mục đích: Tránh việc tốt lén lút né tránh giao chiến bằng cách đi 2 ô."
      },
      {
        title: "4. Kỷ luật thép: Pháp lệnh 'Chạm quân phải đi' (Touch-Move)",
        desc: "Trong các trận đấu bài bản, nếu bạn đã chủ động chạm tay vào một quân cờ của mình, bạn **bắt buộc phải di chuyển quân đó** (nếu có nước đi hợp lệ). Nếu bạn chạm quân đối phương, bạn **bắt buộc phải ăn quân đó**. Nếu quân cờ bị lệch, bạn phải hô 'Tôi sửa' (I adjust) trước khi chạm.",
        benefit: "Ý nghĩa giáo dục: Dạy trẻ tính chịu trách nhiệm, nghĩ kỹ trước khi hạ tay làm việc."
      }
    ],
    starGame: {
      instructions: "Nhiệm vụ Phong cấp: Hãy điều khiển quân Tốt tiến lên hàng cuối cùng (ô e8) để tiến hóa thành quân Hậu, sau đó dùng quân Hậu quét sạch các ngôi sao!",
      pieceType: "wP", // white Pawn
      startPos: "e6",
      stars: ["e8", "a8", "a1", "h1", "h8"],
      parMoves: 5 // e7, e8(Queen), a8, a1, h1, h8
    }
  },
  {
    id: "lesson3",
    title: "Bài 3: Các Đòn Chiến thuật Sát thủ",
    subtitle: "Fork, Pin, Skewer & Discovered Attack",
    intro: "Chiến thuật cờ vua là những đòn phối hợp ngắn giúp bạn giành ưu thế lực lượng ngay lập tức. Hãy ghi nhớ tên gọi và hình thái của 4 đòn sát thủ kinh điển này!",
    sections: [
      {
        title: "1. Đòn Chĩa (Fork - Đòn đôi)",
        desc: "Một quân cờ tấn công **cùng lúc hai hoặc nhiều quân** đối phương. Đối phương chỉ có thể chạy 1 quân, ta sẽ ăn quân còn lại. Quân Mã và Tốt là hai quân cờ cực kỳ đáng sợ với những cú chĩa đôi bất ngờ.",
        example: "Ví dụ: Mã nhảy vào ô tấn công cả Vua và Hậu của đối phương. Vua bắt buộc phải chạy, và ta được ăn Hậu miễn phí!"
      },
      {
        title: "2. Đòn Ghim (Pin)",
        desc: "Tấn công một quân cờ của đối phương mà phía sau nó có một quân cờ giá trị hơn (Vua hoặc Hậu). Quân bị ghim sẽ không dám di chuyển vì nếu di chuyển sẽ làm lộ quân lớn phía sau ra chịu chết. Nếu phía sau là Vua, quân bị ghim **bị cấm di chuyển tuyệt đối** theo luật.",
        example: "Ví dụ: Xe trắng đứng trên cột mở ghim Mã đen, vì phía sau Mã đen là Vua đen."
      },
      {
        title: "3. Đòn Xiên (Skewers)",
        desc: "Ngược lại hoàn toàn với đòn Ghim. Bạn tấn công quân có giá trị lớn hơn đứng trước (ví dụ Vua), bắt buộc quân lớn phải chạy đi, để lộ quân nhỏ hơn đứng phía sau cho bạn ăn.",
        example: "Ví dụ: Tượng chiếu Vua đối phương. Vua chạy sang ô bên cạnh, Tượng ăn quân Xe đứng ngay đằng sau trên cùng đường chéo."
      },
      {
        title: "4. Tấn công phát hiện (Discovered Attack)",
        desc: "Bạn di chuyển một quân cờ ra chỗ khác, nước đi đó đồng thời mở đường cho một quân cờ tầm xa phía sau (Xe, Tượng, Hậu) đang bị che khuất phát hỏa tấn công mục tiêu bất ngờ.",
        example: "Đòn Chiếu mở: Di chuyển Mã để mở đường cho Xe phía sau chiếu Vua đối phương. Đối thủ cuống cuồng chạy Vua, Mã tự do ăn quân cờ khác."
      }
    ],
    puzzles: [
      {
        id: "puzzle_fork",
        title: "Thử thách Đòn Chĩa (Fork Challenge)",
        description: "Trắng đi trước. Hãy tìm nước nhảy Mã (wN) tạo thế chĩa đôi cực mạnh, tấn công đồng thời cả Vua đen (bK) và Hậu đen (bQ)!",
        setup: {
          pieces: {
            "e8": "bK",
            "a5": "bQ",
            "d4": "wN"
          },
          stars: []
        },
        activePiece: "wN",
        startPos: "d4",
        solution: "c6", // Nc6+ forks e8 and a5
        successMsg: "Xuất sắc! Nhảy Mã vào c6 chiếu Vua và bắt Hậu. Đây chính là Đòn Chĩa (Fork) kinh điển!"
      },
      {
        id: "puzzle_pin",
        title: "Thử thách Đòn Ghim (Pin Challenge)",
        description: "Trắng đi trước. Hãy dùng quân Tượng (wB) ở c1 ghim chặt quân Xe đen (bR) khiến nó không thể di chuyển vì Vua đen (bK) đứng phía sau!",
        setup: {
          pieces: {
            "h8": "bK",
            "f6": "bR",
            "c1": "wB"
          },
          stars: []
        },
        activePiece: "wB",
        startPos: "c1",
        solution: "g5", // Bg5 pins Rf6 to Kh8
        successMsg: "Hoàn hảo! Tượng lên g5 ghim chặt Xe f6. Xe đen không thể chạy vì làm lộ Vua phía sau. Đòn Ghim (Pin) đã khóa chân đối thủ!"
      }
    ]
  },
  {
    id: "lesson4",
    title: "Bài 4: Sát chiêu Khai cuộc",
    subtitle: "Khai cuộc Ý & Đòn chiếu hết học trò Scholar's Mate",
    intro: "Khai cuộc là cách bạn dàn trận trong 10-15 nước đi đầu tiên. Học cách ra quân bài bản giúp bạn chiếm ưu thế trung tâm và tránh các cạm bẫy sát thủ chết người.",
    sections: [
      {
        title: "1. Khai cuộc Ý (Italian Game) - Chuẩn mực sơ khởi",
        desc: "Trận thế cân bằng, phát triển quân hài hòa nhất cho người mới bắt đầu. Gồm 3 nước đi cơ bản đầu tiên:\n1. **Trắng đi Tốt e4** (chiếm trung tâm và mở đường cho Hậu + Tượng).\n2. **Đen đối lại e5**.\n3. **Trắng nhảy Mã f3** (tấn công tốt e5, kiểm soát trung tâm).\n4. **Đen nhảy Mã c6** (bảo vệ tốt e5).\n5. **Trắng đi Tượng c4** (triển khai Tượng tấn công ô yếu f7 của Đen).",
        benefit: "Mục đích: Phát triển nhanh nhẹn Mã và Tượng để sẵn sàng Nhập thành bảo vệ Vua."
      },
      {
        title: "2. Cạm bẫy: Đòn chiếu hết 4 nước (Scholar's Mate)",
        desc: "Một đòn tấn công chớp nhoáng nhắm thẳng vào ô yếu `f7` (ô cờ chỉ có duy nhất Vua bảo vệ lúc đầu trận). Trắng kết hợp Hậu và Tượng cùng tấn công ô f7. Nếu Đen không biết cách phòng thủ, Hậu trắng sẽ ăn f7 chiếu hết Vua Đen ngay nước thứ 4!",
        benefit: "Mẹo nhớ nước đi:\n1. e4 e5\n2. Bc4 (Tượng nhắm f7)\n3. Qh5 (hoặc Qf3 - Hậu cùng nhắm f7)\n4. Qxf7# (Chiếu hết!)"
      },
      {
        title: "3. Cách hóa giải Đòn chiếu hết học trò",
        desc: "Đòn này cực kỳ lợi hại với trẻ nhỏ mới chơi vì các bé thường ham tấn công quên phòng thủ. Để khắc chế, ngay khi thấy Hậu đối phương lên `h5` hoặc `f3` để nhắm vào `f7`:\n- Hãy đi **Tốt g6** để chặn đường Hậu trắng (nếu Hậu ở h5).\n- Hoặc nhảy **Mã f6** để chặn và đuổi Hậu trắng.\n- Hoặc đi **Hậu e7 / Qf6** để tăng cường bảo vệ ô f7.",
        benefit: "Quy tắc vàng: Phát triển quân nhẹ (Mã, Tượng) trước, đừng vội đưa Hậu ra ngoài quá sớm."
      }
    ],
    puzzles: [
      {
        id: "puzzle_scholars",
        title: "Thực hành Đòn Chiếu Hết Học Trò",
        description: "Hậu trắng (wQ) và Tượng trắng (wB) đang cùng nhắm vào ô f7 của Đen. Hãy điều khiển quân Hậu ăn tốt f7 để kết liễu ván cờ ngay lập tức!",
        setup: {
          pieces: {
            "e8": "bK",
            "f7": "bP",
            "c4": "wB",
            "h5": "wQ",
            "a7": "bP",
            "b7": "bP",
            "c7": "bP"
          },
          stars: []
        },
        activePiece: "wQ",
        startPos: "h5",
        solution: "f7", // Qxf7#
        successMsg: "Chiếu hết! Hậu ăn f7 được Tượng c4 bảo kê, Vua đen không thể ăn Hậu và cũng không có đường chạy. Bạn đã thực hiện thành công Scholar's Mate!"
      }
    ]
  },
  {
    id: "lesson5",
    title: "Bài 5: Cẩm nang Mẹ cùng Gia Đình giao đấu",
    subtitle: "Bí quyết để Mẹ vui học và giao hữu cân sức cùng Bố & Bé",
    intro: "Ở nhà, Bố và Bé đều đã biết chơi cờ rồi, Mẹ mới học từ số 0 nên có vẻ bất lợi đúng không? Đừng lo! Cờ vua là cầu nối gắn kết gia đình tuyệt vời. Dưới đây là những cẩm nang tâm lý và tuyệt chiêu thiết lập kỹ năng giúp Mẹ vui học và tạo nên những tiếng cười gắn kết cùng hai bố con!",
    sections: [
      {
        title: "1. Phương pháp: 'Tập làm Học trò của Bé'",
        desc: "Trẻ con cực kỳ thích làm 'người lớn' và dạy lại người khác! Mẹ hãy chủ động nhờ Bé hướng dẫn lại cách di chuyển quân hoặc cùng giải các đòn thế (như đòn Chĩa, đòn Ghim) trong ứng dụng này. Việc dạy lại Mẹ sẽ giúp Bé củng cố kiến thức cờ cực nhanh, đồng thời giúp con phát triển lòng tự tin, tự hào và tinh thần trách nhiệm.",
        tip: "Hãy khích lệ con: 'Ôi con chỉ cho Mẹ đòn đôi của Mã siêu thế, Mẹ học mãi mới hiểu mà con nhìn một cái ra ngay này!'"
      },
      {
        title: "2. Cân bằng cờ: Chọn 'Mức độ kỹ năng của Mẹ'",
        desc: "Ứng dụng Đấu Trường hỗ trợ 3 cấp độ cho Mẹ. Nếu chọn 'Mới học cờ', Mẹ sẽ được cấp Thẻ bài ma thuật (Đi lại, Đi đôi) và hiển thị các chấm xanh gợi ý nước đi hợp lệ. Khi Mẹ nâng cấp lên 'Kỳ thủ thực thụ', các chấm gợi ý và thẻ bổ trợ sẽ tắt đi để Mẹ tự tính toán như trong ván đấu thực tế!",
        tip: "Mẹo nhỏ: Khi mới chơi, Mẹ nên để chế độ 'Mới học cờ' để làm quen các đường đi của quân Xe, Mã dễ dàng hơn."
      },
      {
        title: "3. Thử thách Bố & Bé: Cấp độ 'Cao thủ & Biết chơi tốt'",
        desc: "Vì Bố và Bé đã biết chơi, Mẹ hãy chọn trình độ 'Cao thủ' cho Bố (Bố sẽ bị chấp mất quân Hậu) và 'Biết chơi tốt' cho Bé (Bé sẽ chấp mất quân Xe). Cách chơi này giúp tạo thế trận cân bằng lực lượng, giúp Mẹ vừa học cờ vừa có cơ hội giành chiến thắng trước hai kỳ thủ lão luyện!",
        tip: "Bí quyết: Hãy tận dụng lợi thế hơn Hậu/Xe để triển khai các quân Mã nhảy cản đường và gài đòn chĩa đôi ăn quân đối phương."
      },
      {
        title: "4. Khen ngợi nỗ lực tư duy của con, không chỉ thắng thua",
        desc: "Khi Mẹ và Bé giao đấu, bất kể kết quả thế nào, hãy tập trung khen ngợi sự tập trung và kiên trì của Bé. Kể cả khi Mẹ phải dùng tới Thẻ Quyền Năng mới thắng được Bé, hãy khen ngợi con đã ép Mẹ vào thế bí, điều này giúp con học được tinh thần thể thao cao thượng.",
        tip: "Hãy nói: 'Nước đi của con chặt chẽ quá, Mẹ phải dùng tới Thẻ ma thuật sấm sét mới thắng nổi con đấy!'"
      }
    ],
    quiz: [
      {
        question: "Bí quyết tốt nhất để giúp Bé vừa củng cố kiến thức cờ vua, vừa hào hứng chơi cùng Mẹ là gì?",
        options: [
          "Mẹ đóng vai 'học trò' nhờ Bé dạy lại các đòn thế chiến thuật.",
          "Mẹ luôn nhường Bé thắng dễ dàng trong mọi ván cờ.",
          "Mẹ bắt Bé phải học thuộc lòng các cuốn sách dạy cờ dày cộp."
        ],
        answer: 0,
        explanation: "Hoàn hảo! Dạy lại người khác là phương pháp học tập đỉnh cao nhất (Kim tự tháp học tập). Khi Bé làm 'thầy giáo' dạy Mẹ, Bé sẽ tự củng cố tư duy cờ vua và cực kỳ gắn kết với Mẹ."
      },
      {
        question: "Khi đối thủ (Bố hoặc Bé) nhường Mẹ cờ bằng cách cất quân Hậu từ đầu trận do trình độ cao hơn (Chấp Hậu), điều này có ý nghĩa gì?",
        options: [
          "Bố/Bé coi thường khả năng của Mẹ.",
          "Là sự tôn trọng trình độ để ván cờ cân sức, giúp Mẹ luyện tập tư duy tấn công dễ thở hơn.",
          "Mẹ chắc chắn sẽ thắng 100% không cần suy nghĩ."
        ],
        answer: 1,
        explanation: "Chính xác! Đòn chấp cờ là nét đẹp văn hóa cờ vua, giúp các kỳ thủ chênh lệch trình độ vẫn có thể giao đấu hào hứng, bình đẳng và giúp người mới tiến bộ nhanh chóng."
      },
      {
        question: "Khi Mẹ nhỡ tay chạm vào một quân cờ của mình trên bàn cờ thật của gia đình, theo 'pháp lệnh kỷ luật' thi đấu, Mẹ nên làm gì?",
        options: [
          "Kêu lên 'Mẹ nhầm' rồi đi quân khác bình thường.",
          "Nghiêm túc tuân thủ pháp lệnh 'Chạm quân phải đi' để làm gương cho Bé.",
          "Giấu quân cờ đó đi và đi quân khác."
        ],
        answer: 1,
        explanation: "Đúng vậy! Việc Mẹ nghiêm túc tuân thủ luật chạm quân (Touch-Move) sẽ là bài học trực quan sinh động nhất làm gương cho Bé về tính tự trọng, kỷ luật và suy nghĩ cẩn trọng trước khi hạ tay làm việc."
      }
    ]
  }
];

// Xuất dữ liệu
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LESSONS_DATA };
}
