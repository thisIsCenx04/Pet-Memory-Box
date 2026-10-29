# Pet Memory Box – RDS & SRS (v2)

Oct 14, 2026 · @chef · Cập nhật v2: Oct 28, 2026

## Nhật ký thay đổi v2

Bản v2 chốt các câu hỏi mở của bản v1 và sửa các điểm mâu thuẫn giữa tài liệu và bản thiết kế.

| Mã | Quyết định | Phần bị ảnh hưởng |
| --- | --- | --- |
| D-01 | Sản phẩm dành cho cả thú cưng đang sống và đã mất; hồ sơ có chế độ tưởng niệm | F-28, UC-24, FR-36, BR-09, pets |
| D-02 | Dùng Supabase cho Postgres và Storage, đặt tại Singapore; chạy thật dùng gói Pro | 2.3, 7.4, NFR-13, R-10 |
| D-03 | Cho tải video lên trực tiếp (MP4/WebM, ≤ 100 MB, ≤ 3 phút, ≤ 5 video mỗi bé); vẫn cho dán link YouTube/Vimeo | F-15, UC-13, FR-20, 10.2, videos, API-14 |
| D-04 | Tự viết xác thực admin: bcrypt, bảng phiên admin_sessions, cookie httpOnly; không dùng Auth.js hay Supabase Auth | 7.4, UC-03, UC-05, FR-04, FR-07, admin_sessions |
| D-05 | Giai đoạn đầu dùng tên miền *.vercel.app; khi có tên miền riêng, tên miền cũ chuyển hướng vĩnh viễn | BR-10, FR-37, R-09 |
| D-06 | Đường dẫn QR luôn là /p/{token}, không dùng mã thẻ (sửa thiết kế A-03) | A-03, BR-02 |
| D-07 | Tạo hồ sơ chỉ nhận ảnh đại diện; thư viện ảnh, video, kỷ niệm thêm ở trang chi tiết sau khi lưu | UC-06, API-05, API-25 |
| D-08 | Chọn gói sản phẩm khi tạo hồ sơ sẽ tạo luôn đơn hàng; đơn hàng có ghi chú | UC-06, API-05, orders |
| D-09 | Kỷ niệm là nhiều bản ghi có tiêu đề và ngày (bỏ ô văn bản chung trong A-03) | A-03, memories |
| D-10 | Tách cấu hình hiển thị thành 8 công tắc: thêm show_media (ảnh, video) riêng với show_memories | UC-10, FR-15, visibility_settings |
| D-11 | Mọi mã không dùng được đều trả 404 để không lộ việc mã từng tồn tại; lý do thật chỉ ghi trong scan_logs | UC-21, FR-31, API-22 |
| D-12 | Token thống nhất 22 ký tự; nhật ký admin thêm restore, memorial, password_change | R-01, FR-35, audit_logs |

## Nhật ký thay đổi v3 (29/10/2026)

Đưa vào sản phẩm bốn tính năng v2 để ngoài phạm vi, và đổi tên website thành Furever.

| Mã | Thay đổi |
| --- | --- |
| D-13 | Tên website là Furever (logo trái tim dấu chân); "Pet Memory Box" là tên sản phẩm |
| D-14 | Tài khoản chủ nuôi: đăng nhập OTP 6 số qua email (hạn 10 phút, sai tối đa 5 lần, gửi lại sau 60 giây, tối đa 5 mã mỗi giờ); quyền theo owners.email; phiên 30 ngày ở owner_sessions |
| D-15 | Báo khi có người quét: email cho chủ nuôi tối đa 30 phút một lần (pets.last_scan_notified_at), chỉ với bé đang sống, tắt được trong cổng chủ nuôi (owners.notify_scan) |
| D-16 | Người nhặt gửi vị trí GPS, lời nhắn, số điện thoại (bảng found_reports), chỉ gửi riêng cho chủ nuôi, tối đa 5 lần mỗi giờ mỗi IP |
| D-17 | Đặt hàng online và thanh toán VietQR (bảng order_requests): mã đơn FVxxxxxx, đường dẫn xem đơn có token 22 ký tự, admin xác nhận tiền về thủ công, chuyển đơn thành hồ sơ |
| D-18 | Sổ lưu bút trang tưởng niệm (bảng guestbook_entries): lời nhắn chờ duyệt, công tắc show_guestbook; trang tưởng niệm dùng tông đen trắng |
| D-19 | audit_logs.admin_id cho phép null, thêm actor_email để ghi thao tác của chủ nuôi |

# PHẦN I – RDS (Requirements Definition Specification)

## 1. Tổng quan dự án

Pet Memory Box là website cho phép chủ nuôi lưu giữ kỷ niệm về thú cưng và giúp người nhặt được bé liên lạc ngay với chủ khi bé đi lạc, thông qua vòng cổ gắn mã QR. Hồ sơ của mỗi bé do admin nhập sau khi chủ nuôi nhắn tin riêng, nên hệ thống MVP không có chức năng tự đăng ký cho khách. Sản phẩm phục vụ cả thú cưng đang sống (vòng cổ giúp tìm bé khi đi lạc) và thú cưng đã mất (trang tưởng niệm lưu giữ kỷ niệm).

**Bối cảnh.** Sản phẩm vật lý Pet Memory Box là một hộp thiếc gồm đất sét in dấu chân, ảnh, lọ đựng lông, vòng cổ có mã QR và thẻ căn cước thú cưng. Website là phần số hóa (Digital Memory) đi kèm hộp.

**Vấn đề.** Kỷ vật vật lý khó lưu ảnh, video và câu chuyện. Vòng cổ thông thường không cho người lạ biết cách liên lạc với chủ. Việc nhận đơn qua tin nhắn chưa có nơi lưu hồ sơ tập trung.

**Giải pháp.** Mỗi bé có một trang riêng truy cập bằng QR, không cần cài ứng dụng hay đăng nhập. Admin có trang quản trị để nhập hồ sơ, tải ảnh, phát hành và khóa mã QR.

### 1.1 Thuật ngữ

| Thuật ngữ | Định nghĩa |
| --- | --- |
| Pet Memory Box (PMB) | Tên sản phẩm và tên hệ thống website |
| Digital Memory | Trang công khai của từng bé, mở khi quét QR |
| Hồ sơ thú cưng | Bản ghi gồm thông tin bé, chủ nuôi, nội dung kỷ niệm và cấu hình hiển thị |
| Mã thẻ | Mã định danh dạng PMB-xxxxxx in trên thẻ căn cước |
| Token | Chuỗi ngẫu nhiên khó đoán gắn trong đường dẫn QR |
| Admin | Nhân sự vận hành, duy nhất có tài khoản đăng nhập |
| Chủ nuôi | Khách hàng sở hữu thú cưng, không có tài khoản trong MVP |
| Người quét QR | Bất kỳ ai mở trang công khai của bé |
| Chế độ tưởng niệm | Trạng thái hồ sơ của bé đã mất: trang công khai tập trung vào kỷ niệm, ẩn phần liên lạc khi đi lạc |
| Tên miền gốc (SITE_URL) | Tên miền dùng để dựng mọi đường dẫn QR; giai đoạn đầu là *.vercel.app |
| MVP | Phiên bản tối thiểu để kiểm chứng ý tưởng |
| RDS | Đặc tả yêu cầu nghiệp vụ |
| SRS | Đặc tả yêu cầu phần mềm |

## 2. Mục tiêu, phạm vi, giả định và ràng buộc

MVP phải chứng minh được một điều: người lạ quét QR trên vòng cổ thì thấy được trang của bé và gọi được cho chủ trong vài giây, còn admin tạo hồ sơ và phát hành mã mà không cần can thiệp kỹ thuật.

### 2.1 Mục tiêu

| Mã | Mục tiêu | Tiêu chí đo |
| --- | --- | --- |
| G1 | Người quét QR liên lạc được với chủ nuôi nhanh | Từ lúc quét đến lúc bấm gọi ≤ 3 thao tác, trang tải xong ≤ 3 giây trên 4G |
| G2 | Chủ nuôi lưu giữ ảnh, video, câu chuyện của bé ở một nơi | Mỗi bé có một trang Digital Memory đầy đủ 4 tab |
| G3 | Admin quản lý tập trung hồ sơ và mã QR | Tạo một hồ sơ và phát hành QR trong một lần nhập liệu, không dùng công cụ ngoài |
| G4 | Bảo vệ riêng tư chủ nuôi | Chỉ hiển thị những mục chủ nuôi đồng ý; mã QR không đoán được |
| G5 | Giới thiệu sản phẩm và dẫn khách nhắn tin | Landing page có nút nhắn Zalo/Messenger |

### 2.2 Phạm vi

| Trong phạm vi MVP | Ngoài phạm vi MVP |
| --- | --- |
| Landing page giới thiệu sản phẩm | Tự đăng ký và tài khoản cho chủ nuôi |
| Trang công khai Digital Memory theo mã QR | Thanh toán trực tuyến và giỏ hàng |
| Trang quản trị có sidebar cho một vai trò admin | Chatbot, thông báo tự động khi có người quét |
| CRUD hồ sơ thú cưng, chủ nuôi, ảnh, video, câu chuyện | Ứng dụng di động, bản đồ vị trí GPS |
| Tải video lên trực tiếp (giới hạn dung lượng, thời lượng) | Chuyển mã (transcode) video tự động |
| Chế độ tưởng niệm cho bé đã mất | Trang tưởng niệm cộng đồng, bình luận của người xem |
| Sinh, tải, khóa và phát hành lại mã QR | Đa ngôn ngữ, nhiều admin phân quyền chi tiết |
| Theo dõi trạng thái đơn hộp kỷ vật | Trách nhiệm vận chuyển và sản xuất hộp vật lý |
| Ghi nhận lượt quét cơ bản | Phân tích hành vi nâng cao |

### 2.3 Giả định và ràng buộc

- Chủ nuôi giao tiếp với admin qua Zalo hoặc Messenger; admin là người duy nhất nhập liệu.
- Người quét QR dùng camera điện thoại có sẵn và trình duyệt hiện đại, có kết nối mạng.
- Website triển khai theo kiến trúc serverless trên Vercel, dùng Supabase (Postgres và Storage) đặt tại Singapore cho ảnh và video.
- Giai đoạn phát triển dùng gói Free của Supabase; trước khi giao vòng cổ đầu tiên phải chuyển sang gói Pro, vì gói Free tự tạm dừng sau 1 tuần không hoạt động và không có sao lưu tự động.
- Giai đoạn đầu dùng tên miền miễn phí *.vercel.app; tên miền riêng sẽ được mua khi mở rộng sản phẩm vòng tay.
- Giao diện bắt buộc tone màu be, không dùng biểu tượng kiểu AI; trang admin bắt buộc có sidebar.
- Ngôn ngữ giao diện là tiếng Việt.
- Thông tin liên hệ của chủ nuôi là dữ liệu cá nhân, phải có sự đồng ý của chủ nuôi trước khi hiển thị công khai.

## 3. Các bên liên quan và nhóm người dùng

Hệ thống có ba nhóm người dùng trực tiếp (khách truy cập, người quét QR, admin) và một bên ngoài hệ thống (chủ nuôi). Chủ nuôi không đăng nhập mà gửi thông tin cho admin qua tin nhắn.

| Nhóm | Vai trò | Nhu cầu chính | Tương tác với hệ thống |
| --- | --- | --- | --- |
| Admin | Nhân sự vận hành | Nhập hồ sơ nhanh, không sai; phát hành, khóa, cấp lại QR; theo dõi đơn | Đăng nhập trang quản trị và dùng toàn bộ chức năng quản lý |
| Chủ nuôi | Khách hàng, sở hữu thú cưng | Lưu kỷ niệm; được liên lạc khi bé đi lạc; kiểm soát thông tin công khai | Nhắn tin cho admin (Zalo, Messenger), xem trang của bé như người quét |
| Người quét QR | Người nhặt được bé hoặc người được chia sẻ đường dẫn | Biết bé là ai, gọi chủ ngay; xem kỷ niệm nếu được chia sẻ | Mở trang công khai, bấm gọi, nhắn tin |
| Khách truy cập | Người quan tâm đến sản phẩm | Hiểu sản phẩm, xem trang mẫu, biết cách đặt | Xem landing page, bấm nút nhắn tin |
| Nhà phát triển/vận hành | Đội kỹ thuật | Triển khai, theo dõi lỗi, sao lưu dữ liệu | Vercel, cơ sở dữ liệu, storage (không dùng giao diện web) |

### 3.1 Hệ thống và dịch vụ bên ngoài

- **Zalo / Messenger:** kênh nhận yêu cầu của khách, nằm ngoài hệ thống; website chỉ dẫn liên kết.
- **Trình duyệt/camera điện thoại:** nền tảng quét QR và gọi điện qua liên kết `tel:` và `sms:`.
- **Supabase:** Postgres lưu dữ liệu; Storage lưu ảnh và video do admin tải lên.
- **Nền tảng video (YouTube, Vimeo):** lựa chọn phụ cho video dài, hệ thống chỉ nhúng liên kết.
- **Vercel:** chạy ứng dụng và quản lý tên miền.

## 4. Quy trình nghiệp vụ

Quy trình đặt hàng và phát hành QR do admin làm trung tâm: mọi hồ sơ bắt đầu từ một tin nhắn riêng và kết thúc khi viên QR đã gắn lên vòng cổ giao cho khách.

### 4.1 Các bước nghiệp vụ

1. Chủ nuôi nhắn tin cho admin, gửi ảnh và thông tin của bé cùng cách liên lạc.
2. Admin xác nhận gói sản phẩm và thông tin hiển thị công khai với chủ nuôi.
3. Admin nhập biểu mẫu đăng ký trên trang quản trị, tải ảnh và nội dung kỷ niệm.
4. Hệ thống lưu hồ sơ, tạo mã thẻ và token, sinh mã QR.
5. Admin tải QR, in lên mặt vòng cổ, đóng gói hộp kỷ vật và giao cho khách.
6. Admin cập nhật trạng thái đơn và báo khách qua tin nhắn.
7. Khi có người quét QR, hệ thống hiển thị trang của bé theo cấu hình đã chọn.

&#91;embedded content: quy trình nghiệp vụ · 4 làn, 8 bước\]

Admin xử lý bốn bước nằm giữa tin nhắn của khách và vòng cổ QR; người quét chỉ xuất hiện khi bé đi lạc.

### 4.2 Quy tắc nghiệp vụ

| Mã | Quy tắc |
| --- | --- |
| BR-01 | Mỗi hồ sơ thú cưng có đúng một mã QR đang hoạt động tại một thời điểm. |
| BR-02 | Mã thẻ có dạng PMB-xxxxxx, tăng dần và không tái sử dụng. Đường dẫn QR phải kèm token ngẫu nhiên. |
| BR-03 | Mã bị khóa hoặc đã thay thế thì trang công khai không hiển thị thông tin của bé. |
| BR-04 | Chỉ những mục được bật trong cấu hình hiển thị mới xuất hiện trên trang công khai. |
| BR-05 | Số điện thoại chủ nuôi là bắt buộc để phát hành QR. |
| BR-06 | Khi đổi thông tin hồ sơ, mã QR hiện tại không đổi. |
| BR-07 | Hồ sơ bị lưu trữ thì trang công khai ngừng hiển thị nhưng dữ liệu được giữ lại. |
| BR-08 | Chỉ admin đã đăng nhập mới được tạo, sửa, khóa hồ sơ và mã QR. |
| BR-09 | Hồ sơ ở chế độ tưởng niệm mặc định ẩn nút gọi, số điện thoại và lời nhắn tìm bé đi lạc; mã QR giữ nguyên. |
| BR-10 | Đường dẫn QR đã in phải dùng được vĩnh viễn: khi đổi tên miền, tên miền cũ chuyển hướng sang tên miền mới và giữ nguyên /p/{token}. |

## 5. Danh sách tính năng (Features)

MVP gồm 28 tính năng chia thành 8 module, trong đó 17 tính năng bắt buộc (Must). Ưu tiên theo MoSCoW: Must = phải có để phát hành, Should = nên có, Could = có thì tốt.

| Mã | Module | Tính năng | Mô tả ngắn | Người dùng | Ưu tiên |
| --- | --- | --- | --- | --- | --- |
| F-01 | M1 Landing | Landing page giới thiệu | Giới thiệu hộp kỷ vật, Digital Memory, cách hoạt động | Khách truy cập | Must |
| F-02 | M1 Landing | Nút nhắn tin Zalo/Messenger | Dẫn khách sang kênh nhắn tin với admin | Khách truy cập | Must |
| F-03 | M1 Landing | Xem trang Digital Memory mẫu | Liên kết tới trang demo không chứa dữ liệu thật | Khách truy cập | Could |
| F-04 | M1 Landing | Hỏi đáp (FAQ) | Giải đáp câu hỏi thường gặp | Khách truy cập | Should |
| F-05 | M2 Xác thực | Đăng nhập admin | Xác thực bằng email và mật khẩu | Admin | Must |
| F-06 | M2 Xác thực | Đăng xuất | Kết thúc phiên làm việc | Admin | Must |
| F-07 | M2 Xác thực | Đổi mật khẩu | Admin tự đổi mật khẩu | Admin | Should |
| F-08 | M3 Hồ sơ | Tạo hồ sơ thú cưng | Nhập thông tin bé và chủ nuôi, lưu hồ sơ | Admin | Must |
| F-09 | M3 Hồ sơ | Danh sách, tìm kiếm, lọc hồ sơ | Tìm theo mã thẻ, tên bé, tên chủ, số điện thoại; lọc theo trạng thái | Admin | Must |
| F-10 | M3 Hồ sơ | Xem chi tiết hồ sơ | Xem toàn bộ thông tin, QR, nội dung | Admin | Must |
| F-11 | M3 Hồ sơ | Chỉnh sửa hồ sơ | Sửa thông tin bé và chủ nuôi | Admin | Must |
| F-12 | M3 Hồ sơ | Cấu hình hiển thị công khai | Bật/tắt từng mục hiển thị khi quét mã | Admin | Must |
| F-13 | M3 Hồ sơ | Lưu trữ và khôi phục hồ sơ | Ẩn hồ sơ khỏi trang công khai mà không xóa dữ liệu | Admin | Should |
| F-14 | M4 Nội dung | Quản lý ảnh | Tải lên, đặt ảnh đại diện, sắp xếp, xóa ảnh | Admin | Must |
| F-15 | M4 Nội dung | Quản lý video | Tải video lên trực tiếp hoặc dán link YouTube/Vimeo; sửa, xóa, sắp xếp | Admin | Should |
| F-16 | M4 Nội dung | Quản lý câu chuyện kỷ niệm | Thêm, sửa, xóa, sắp xếp kỷ niệm | Admin | Should |
| F-17 | M5 Mã QR | Sinh mã thẻ, token và QR | Tự động khi lưu hồ sơ mới | Hệ thống | Must |
| F-18 | M5 Mã QR | Tải mã QR | Xuất PNG hoặc SVG để in lên mặt vòng | Admin | Must |
| F-19 | M5 Mã QR | Khóa / mở khóa mã QR | Vô hiệu hóa mã khi mất vòng, mở lại khi tìm thấy | Admin | Must |
| F-20 | M5 Mã QR | Phát hành lại mã QR | Cấp mã mới, mã cũ chuyển thành đã thay thế | Admin | Should |
| F-21 | M6 Đơn hàng | Gói sản phẩm và trạng thái đơn | Chọn gói (hộp đầy đủ / chỉ vòng QR), cập nhật tiến độ | Admin | Should |
| F-22 | M7 Trang công khai | Hiển thị Digital Memory theo mã | Mở đường dẫn QR, hiển thị theo cấu hình | Người quét QR | Must |
| F-23 | M7 Trang công khai | Gọi / nhắn tin chủ nuôi | Nút gọi và nhắn tin một chạm | Người quét QR | Must |
| F-24 | M7 Trang công khai | Tab Ảnh, Video, Kỷ niệm, Hồ sơ | Chuyển nội dung không tải lại trang | Người quét QR | Must |
| F-25 | M7 Trang công khai | Thông báo mã không hợp lệ | Trang thân thiện khi mã sai, bị khóa hoặc hồ sơ lưu trữ | Người quét QR | Must |
| F-26 | M7 Trang công khai | Ghi nhận lượt quét | Lưu thời gian và kết quả mỗi lần mở trang | Hệ thống | Should |
| F-27 | M8 Tổng quan | Dashboard thống kê | Số hồ sơ, mã đã phát hành, lượt quét, đơn đang làm | Admin | Could |
| F-28 | M3 Hồ sơ | Chế độ tưởng niệm | Đánh dấu bé đã mất, trang công khai chuyển sang bố cục tưởng niệm | Admin, Người quét QR | Should |

### 5.1 Ngoài phạm vi (Won't have)

Tự đăng ký cho chủ nuôi, thanh toán trực tuyến, chatbot, thông báo tự động khi có người quét, ứng dụng di động, nhiều vai trò admin.

## 6. Rủi ro và tiêu chí chấp nhận MVP

Rủi ro lớn nhất là lộ thông tin cá nhân của chủ nuôi qua trang công khai, nên bảo mật token và cấu hình hiển thị được ưu tiên hàng đầu.

### 6.1 Rủi ro

| Mã | Rủi ro | Ảnh hưởng | Biện pháp |
| --- | --- | --- | --- |
| R-01 | Đoán được đường dẫn của bé khác và xem trái phép | Lộ số điện thoại, địa chỉ | Dùng token ngẫu nhiên 22 ký tự base62; giới hạn tốc độ truy cập; không liệt kê công khai |
| R-02 | Admin nhập sai thông tin liên hệ | Người nhặt được bé không gọi được | Bắt buộc định dạng số điện thoại, có bước xem trước trang công khai trước khi phát hành |
| R-03 | Mất vòng cổ | Người lạ dùng mã để xem thông tin | Cho phép khóa mã và phát hành mã mới |
| R-04 | Ảnh, video dung lượng lớn làm chậm trang | Quét xong mở trang quá lâu | Nén ảnh khi tải lên, tải ảnh lazy; video giới hạn 100 MB, có ảnh bìa và chỉ tải khi bấm phát (preload="none") |
| R-05 | Giới hạn của nền tảng serverless (thời gian chạy, kích thước request) | Tải ảnh thất bại | Upload trực tiếp từ trình duyệt lên storage, không qua hàm server |
| R-06 | Mất dữ liệu | Mất hồ sơ khách | Bật sao lưu định kỳ của nhà cung cấp cơ sở dữ liệu; xóa mềm hồ sơ |
| R-07 | Chưa có sự đồng ý rõ ràng của chủ nuôi | Vi phạm quy định dữ liệu cá nhân | Admin xác nhận mục hiển thị với khách và ghi nhận trong hồ sơ |
| R-08 | Video quay bằng iPhone (HEVC/.mov) không phát được trên Android; video tốn dung lượng và băng thông | Người xem không xem được video; chi phí Supabase tăng | Chỉ nhận MP4/WebM, kiểm tra trình duyệt phát được trước khi tải lên, hướng dẫn admin xuất lại H.264; giới hạn 5 video mỗi bé |
| R-09 | Đổi từ *.vercel.app sang tên miền riêng làm hỏng các QR đã in | Người nhặt được bé không mở được trang | Không bao giờ xóa hay đổi tên dự án Vercel; giữ tên miền vercel.app trong dự án và chuyển hướng 308 sang tên miền mới (FR-37) |
| R-10 | Dự án Supabase gói Free tự tạm dừng sau 1 tuần không hoạt động | Quét QR không mở được trang | Chuyển sang gói Pro trước khi giao vòng cổ đầu tiên |

### 6.2 Tiêu chí chấp nhận MVP

- [ ] Admin tạo được hồ sơ đầy đủ và tải được QR trong một phiên làm việc.
- [ ] Quét QR trên ít nhất hai dòng điện thoại (iOS, Android) mở đúng trang của bé.
- [ ] Nút gọi và nhắn tin mở đúng ứng dụng gọi trên điện thoại.
- [ ] Mã bị khóa không hiển thị bất kỳ thông tin nào của bé hay chủ nuôi.
- [ ] Chỉ mục được bật trong cấu hình hiển thị mới xuất hiện trên trang công khai.
- [ ] Trang admin không truy cập được khi chưa đăng nhập.
- [ ] Video tải lên phát được trên cả iOS và Android.
- [ ] Hồ sơ ở chế độ tưởng niệm không hiển thị lời nhắn tìm bé đi lạc.
- [ ] Toàn bộ chức năng Must đã được kiểm thử trên bản triển khai thật trên Vercel.

# PHẦN II – SRS (Software Requirements Specification)

## 7. Giới thiệu SRS và kiến trúc tổng thể

SRS mô tả chi tiết hệ thống cần xây dựng để đội phát triển lập trình và kiểm thử mà không phải hỏi lại nghiệp vụ. Hệ thống là một ứng dụng Next.js chạy serverless trên Vercel, dùng Supabase Postgres và Supabase Storage.

### 7.1 Mục đích và đối tượng đọc

Tài liệu dành cho nhà phát triển, người kiểm thử, admin và giảng viên hướng dẫn. Phần RDS ở trên là căn cứ nghiệp vụ; mọi yêu cầu trong SRS đều truy vết được về một tính năng F-xx (xem mục 17).

### 7.2 Quy ước đánh mã

| Tiền tố | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| F-xx | Tính năng | F-08 Tạo hồ sơ |
| UC-xx | Use case | UC-06 Tạo hồ sơ thú cưng |
| FR-xx | Yêu cầu chức năng | FR-10 Sinh token ngẫu nhiên |
| NFR-xx | Yêu cầu phi chức năng | NFR-03 Thời gian tải trang |
| BR-xx | Quy tắc nghiệp | BR-03 Mã bị khóa |
| API-xx | Điểm cuối API | API-05 GET /api/public/pets/{code} |

### 7.3 Kiến trúc tổng thể

Trình duyệt gọi tới một ứng dụng Next.js duy nhất trên Vercel. Trang công khai và trang admin là hai nhóm route khác nhau; cả hai đọc ghi vào cùng một Postgres, còn ảnh đi thẳng lên object storage.

&#91;embedded content: kiến trúc triển khai · 3 lớp\]

Mọi yêu cầu đi qua Vercel; chỉ ảnh và video đi đường riêng (trình duyệt tải thẳng lên Supabase Storage bằng URL có chữ ký) để tránh giới hạn kích thước request của hàm serverless.

### 7.4 Công nghệ đề xuất

| Lớp | Công nghệ | Lý do |
| --- | --- | --- |
| Giao diện và route | Next.js (App Router), React, TypeScript | Triển khai Vercel sẵn, SSR/ISR cho trang QR |
| Chạy máy chủ | Vercel Functions (serverless), region sin1 | Không quản lý máy chủ, tự co giãn, gần cơ sở dữ liệu |
| Cơ sở dữ liệu | Supabase Postgres (ap-southeast-1, Singapore) + Prisma | Có transaction, sequence, pg_trgm; sao lưu hằng ngày ở gói Pro |
| Lưu ảnh và video | Supabase Storage, URL tải lên có chữ ký | Tệp không đi qua máy chủ serverless |
| Xác thực admin | Tự viết: bcryptjs, bảng admin_sessions, cookie httpOnly chứa token phiên ngẫu nhiên (lưu dạng băm SHA-256) | Một vai trò; phiên lưu trong cơ sở dữ liệu nên hủy được các phiên khác khi đổi mật khẩu (FR-07), Auth.js với Credentials chỉ dùng phiên JWT nên không hỗ trợ sẵn việc này |
| Tên miền | Biến môi trường SITE_URL; giai đoạn đầu https://{tên dự án}.vercel.app | Đổi tên miền không cần sửa mã (FR-37) |
| Sinh QR | Thư viện `qrcode` chạy trong route handler | Tạo PNG/SVG từ đường dẫn |
| Kiểm tra dữ liệu | Zod | Dùng chung cho form và API |
| Giao diện | CSS thuần hoặc Tailwind theo thiết kế be | Khớp thiết kế đã duyệt |

## 8. Sơ đồ Use Case

Hệ thống có 24 use case: 5 use case công khai (khách truy cập và người quét QR), 17 use case của Admin và 2 use case nội bộ do hệ thống tự thực hiện (UC-14 Sinh mã QR, UC-22 Ghi nhận lượt quét).

### 8.1 Tác nhân

| Tác nhân | Loại | Mô tả |
| --- | --- | --- |
| Khách truy cập | Chính | Người xem landing page, chưa là khách hàng |
| Người quét QR | Chính | Người mở trang công khai của bé bằng QR hoặc đường dẫn |
| Admin | Chính | Nhân sự vận hành, đăng nhập để quản lý hồ sơ và mã QR |
| Hệ thống | Nội bộ | Thực hiện bước tự động: sinh mã, ghi nhận lượt quét |
| Chủ nuôi | Ngoài hệ thống | Không đăng nhập, giao tiếp với admin qua tin nhắn |

### 8.2 Danh sách use case

| Mã | Use case | Tác nhân | Tính năng | Quan hệ |
| --- | --- | --- | --- | --- |
| UC-01 | Xem landing page | Khách truy cập | F-01, F-03, F-04 |  |
| UC-02 | Liên hệ qua Zalo/Messenger | Khách truy cập | F-02 | extend UC-01 |
| UC-03 | Đăng nhập | Admin | F-05 |  |
| UC-04 | Đăng xuất | Admin | F-06 |  |
| UC-05 | Đổi mật khẩu | Admin | F-07 |  |
| UC-06 | Tạo hồ sơ thú cưng | Admin | F-08 | include UC-14 |
| UC-07 | Xem danh sách và tìm kiếm hồ sơ | Admin | F-09 |  |
| UC-08 | Xem chi tiết hồ sơ | Admin | F-10 |  |
| UC-09 | Chỉnh sửa hồ sơ | Admin | F-11 |  |
| UC-10 | Cấu hình hiển thị công khai | Admin | F-12 |  |
| UC-11 | Lưu trữ và khôi phục hồ sơ | Admin | F-13 |  |
| UC-12 | Quản lý ảnh | Admin | F-14 |  |
| UC-13 | Quản lý video và kỷ niệm | Admin | F-15, F-16 |  |
| UC-14 | Sinh mã thẻ, token và QR | Hệ thống | F-17 | được include bởi UC-06, UC-17 |
| UC-15 | Tải mã QR | Admin | F-18 |  |
| UC-16 | Khóa / mở khóa mã QR | Admin | F-19 |  |
| UC-17 | Phát hành lại mã QR | Admin | F-20 | include UC-14 |
| UC-18 | Cập nhật gói và trạng thái đơn | Admin | F-21 |  |
| UC-19 | Xem trang Digital Memory | Người quét QR | F-22, F-24 | include UC-22 |
| UC-20 | Gọi / nhắn tin chủ nuôi | Người quét QR | F-23 | extend UC-19 |
| UC-21 | Xem thông báo mã lỗi | Người quét QR | F-25 | extend UC-19 |
| UC-22 | Ghi nhận lượt quét | Hệ thống | F-26 | được include bởi UC-19 |
| UC-23 | Xem tổng quan | Admin | F-27 |  |
| UC-24 | Chuyển chế độ tưởng niệm | Admin | F-28 |  |

### 8.3 Use case tổng quát

Admin có năm nhóm chức năng, còn khách và người quét QR chỉ dùng ba nhóm công khai.

&#91;embedded content: use case tổng quát · 3 tác nhân, 8 nhóm\]

### 8.4 Use case nhóm công khai

UC-02 mở rộng UC-01; UC-20 và UC-21 mở rộng UC-19 tùy theo trạng thái mã; mỗi lần UC-19 chạy đều gọi UC-22.

&#91;embedded content: use case nhóm công khai · 6 use case\]

### 8.5 Use case nhóm Admin

Mọi use case trong khung dưới đây yêu cầu Admin đã đăng nhập (UC-03), trừ chính UC-03.

&#91;embedded content: use case nhóm Admin · 16 use case, 5 nhóm\]

### 8.6 Quan hệ sinh mã QR

Tạo hồ sơ mới và phát hành lại mã đều dùng chung một bước sinh mã QR (UC-14).

&#91;embedded content: quan hệ include · UC-06, UC-17, UC-14\]

## 9. Đặc tả Use Case

Cả 24 use case được đặc tả theo cùng một mẫu gồm bảng thông tin, luồng chính và luồng thay thế (A) hoặc ngoại lệ (E). Mọi use case của Admin (UC-04 đến UC-18, UC-23, UC-24) có điều kiện trước chung là Admin đã đăng nhập (UC-03).

### 9.1 Nhóm landing page và xác thực

#### UC-01 Xem landing page

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Khách truy cập |
| Mô tả | Khách xem giới thiệu sản phẩm, trang mẫu và hỏi đáp |
| Điều kiện trước | Có kết nối internet |
| Điều kiện sau | Trang hiển thị đầy đủ các mục |
| Tham chiếu | F-01, F-03, F-04; FR-01, FR-03 |

**Luồng chính**

1. Khách mở tên miền chính của website.
2. Hệ thống hiển thị landing page: hero, bên trong hộp, Digital Memory, cách hoạt động, giá trị sản phẩm, hỏi đáp, kêu gọi nhắn tin.
3. Khách cuộn trang và xem nội dung.
4. Khách bấm "Xem trang Digital Memory mẫu" để mở trang demo.

**Luồng thay thế và ngoại lệ**

- A1: Khách dùng điện thoại, bố cục chuyển thành một cột.
- E1: Ảnh không tải được, hệ thống hiển thị khung thay thế và nội dung chữ vẫn đọc được.

#### UC-02 Liên hệ qua Zalo/Messenger

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Khách truy cập |
| Mô tả | Khách mở cuộc trò chuyện với admin để đặt hộp |
| Điều kiện trước | Đang xem landing page (UC-01) |
| Điều kiện sau | Ứng dụng nhắn tin mở đúng cuộc trò chuyện với admin |
| Tham chiếu | F-02; FR-02 |

**Luồng chính**

1. Khách bấm "Nhắn qua Zalo" hoặc "Nhắn qua Messenger".
2. Hệ thống mở liên kết đã cấu hình trong tab mới.
3. Ứng dụng nhắn tin mở cuộc trò chuyện với tài khoản của admin.

**Luồng thay thế và ngoại lệ**

- A1: Khách chưa cài ứng dụng, liên kết mở bản web.
- E1: Liên kết chưa được cấu hình, hệ thống ẩn nút tương ứng.

#### UC-03 Đăng nhập

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin xác thực để vào trang quản trị |
| Điều kiện trước | Admin đã có tài khoản |
| Điều kiện sau | Phiên làm việc được tạo, chuyển tới trang Tổng quan |
| Tham chiếu | F-05; FR-04, FR-05, FR-08; NFR-05 |

**Luồng chính**

1. Admin mở /admin/login.
2. Admin nhập email, mật khẩu và bấm Đăng nhập.
3. Hệ thống kiểm tra định dạng dữ liệu.
4. Hệ thống đối chiếu mật khẩu với giá trị băm đã lưu.
5. Hệ thống sinh token phiên ngẫu nhiên, lưu giá trị băm vào admin_sessions (hết hạn sau 8 giờ), đặt cookie httpOnly chứa token và đặt lại số lần sai về 0.
6. Hệ thống chuyển tới trang Tổng quan.

**Luồng thay thế và ngoại lệ**

- E1: Sai email hoặc mật khẩu, hệ thống báo chung "Email hoặc mật khẩu không đúng", không nêu cái nào sai.
- E2: Sai 5 lần liên tiếp, hệ thống khóa đăng nhập 15 phút.
- E3: Truy cập /admin khi chưa đăng nhập, hệ thống chuyển về trang đăng nhập và quay lại trang đó sau khi đăng nhập.

#### UC-04 Đăng xuất

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin kết thúc phiên làm việc |
| Điều kiện sau | Phiên bị hủy, không vào được /admin khi chưa đăng nhập lại |
| Tham chiếu | F-06; FR-06 |

**Luồng chính**

1. Admin bấm Đăng xuất ở cuối sidebar.
2. Hệ thống xóa dòng phiên trong admin_sessions và xóa cookie.
3. Hệ thống chuyển về /admin/login.

**Luồng thay thế và ngoại lệ**

- A1: Phiên hết hạn sau 8 giờ, hệ thống tự đăng xuất và chuyển về trang đăng nhập.

#### UC-05 Đổi mật khẩu

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin tự đổi mật khẩu đăng nhập |
| Điều kiện sau | Mật khẩu mới có hiệu lực, các phiên khác bị hủy |
| Tham chiếu | F-07; FR-07; NFR-05 |

**Luồng chính**

1. Admin mở mục Tài khoản admin trên sidebar.
2. Admin nhập mật khẩu hiện tại, mật khẩu mới và xác nhận.
3. Hệ thống kiểm tra mật khẩu hiện tại.
4. Hệ thống kiểm tra mật khẩu mới: từ 8 ký tự, khác mật khẩu cũ, trùng với xác nhận.
5. Hệ thống lưu mật khẩu băm mới, xóa mọi dòng admin_sessions khác phiên hiện tại và ghi nhật ký password_change.
6. Hệ thống hiển thị thông báo thành công.

**Luồng thay thế và ngoại lệ**

- E1: Mật khẩu hiện tại sai, hệ thống báo lỗi và không đổi.
- E2: Mật khẩu mới quá ngắn hoặc trùng mật khẩu cũ, hệ thống báo lỗi cụ thể cạnh trường.

### 9.2 Nhóm hồ sơ thú cưng và nội dung

#### UC-06 Tạo hồ sơ thú cưng

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin nhập thông tin khách gửi qua tin nhắn để tạo hồ sơ và phát hành mã QR |
| Điều kiện trước | Đã đăng nhập; đã có thông tin từ khách |
| Điều kiện sau | Hồ sơ trạng thái active, mã thẻ và QR đã sinh, cấu hình hiển thị mặc định và đơn hàng đã tạo |
| Quan hệ | include UC-14 |
| Tham chiếu | F-08, F-17, F-21; FR-09, FR-10, FR-11, FR-26, FR-35; BR-01, BR-02, BR-05 |

**Luồng chính**

1. Admin chọn Đăng ký mới trên sidebar.
2. Admin chọn gói sản phẩm (hộp đầy đủ hoặc chỉ vòng QR) và ghi chú đơn nếu có.
3. Admin nhập thông tin bé (kể cả bé đang sống hay đã mất), thông tin chủ nuôi và câu ngắn dưới tên bé.
4. Admin chọn ảnh đại diện; trình duyệt tải ảnh lên vùng tạm của Storage (API-25).
5. Admin chọn các mục hiển thị công khai (mặc định bật: nút gọi, số điện thoại chính, khu vực, lưu ý, ảnh và video, kỷ niệm; mặc định tắt: số điện thoại phụ, địa chỉ đầy đủ; bé đã mất thì nút gọi mặc định tắt).
6. Admin bấm "Lưu và phát hành mã QR".
7. Hệ thống kiểm tra dữ liệu theo FR-10.
8. Hệ thống lưu chủ nuôi, hồ sơ, cấu hình hiển thị, đơn hàng (trạng thái received) và gọi UC-14 để sinh mã, trong cùng một giao dịch; ảnh đại diện được chuyển từ vùng tạm sang thư mục của hồ sơ.
9. Hệ thống mở trang chi tiết hồ sơ vừa tạo kèm QR để tải; thư viện ảnh, video và kỷ niệm được bổ sung tại đây (UC-12, UC-13).

**Luồng thay thế và ngoại lệ**

- A1: Chưa có ảnh đại diện, hồ sơ vẫn lưu được và ảnh được bổ sung sau ở UC-12.
- E1: Thiếu trường bắt buộc hoặc số điện thoại sai định dạng, hệ thống báo lỗi cạnh trường và không lưu.
- E2: Lỗi lưu cơ sở dữ liệu, hệ thống không sinh mã, báo lỗi và giữ nguyên dữ liệu đã nhập.
- E3: Trùng số điện thoại và tên bé đã có, hệ thống cảnh báo và admin xác nhận mới tiếp tục.

#### UC-07 Xem danh sách và tìm kiếm hồ sơ

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin tìm và lọc hồ sơ đã đăng ký |
| Điều kiện sau | Danh sách hiển thị đúng theo từ khóa và bộ lọc |
| Tham chiếu | F-09; FR-12 |

**Luồng chính**

1. Admin mở Hồ sơ thú cưng trên sidebar.
2. Hệ thống hiển thị 20 hồ sơ mới nhất gồm mã thẻ, tên bé, chủ nuôi, trạng thái mã, trạng thái đơn.
3. Admin nhập từ khóa (mã thẻ, tên bé, tên chủ, số điện thoại) hoặc chọn bộ lọc trạng thái.
4. Hệ thống trả kết quả theo trang.
5. Admin bấm một dòng để mở chi tiết (UC-08).

**Luồng thay thế và ngoại lệ**

- A1: Không có kết quả, hệ thống hiển thị thông báo trống và gợi ý đổi từ khóa.

#### UC-08 Xem chi tiết hồ sơ

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin xem toàn bộ thông tin một hồ sơ và chọn thao tác tiếp theo |
| Điều kiện trước | Hồ sơ tồn tại |
| Điều kiện sau | Chi tiết hiển thị đầy đủ |
| Tham chiếu | F-10; FR-13 |

**Luồng chính**

1. Admin mở hồ sơ từ danh sách.
2. Hệ thống hiển thị thông tin bé, chủ nuôi, QR và trạng thái mã, cấu hình hiển thị, ảnh, video, kỷ niệm, đơn hàng và lịch sử mã.
3. Admin chọn thao tác: sửa (UC-09), cấu hình hiển thị (UC-10), lưu trữ (UC-11), tải QR (UC-15), khóa mã (UC-16), phát hành lại (UC-17), cập nhật đơn (UC-18).

**Luồng thay thế và ngoại lệ**

- E1: Hồ sơ không tồn tại, hệ thống hiển thị trang 404 trong khu vực admin.

#### UC-09 Chỉnh sửa hồ sơ

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin cập nhật thông tin bé và chủ nuôi theo yêu cầu của khách |
| Điều kiện trước | Hồ sơ tồn tại và đang mở chi tiết |
| Điều kiện sau | Dữ liệu mới được lưu; mã thẻ và token không đổi |
| Tham chiếu | F-11; FR-10, FR-14, FR-35; BR-06 |

**Luồng chính**

1. Admin bấm Sửa ở trang chi tiết.
2. Hệ thống nạp dữ liệu hiện tại vào biểu mẫu.
3. Admin sửa các trường cần thay đổi và bấm Lưu.
4. Hệ thống kiểm tra dữ liệu, lưu, cập nhật thời điểm sửa và xóa bộ nhớ đệm của trang công khai.
5. Hệ thống hiển thị thông báo thành công.

**Luồng thay thế và ngoại lệ**

- E1: Dữ liệu không hợp lệ, hệ thống báo lỗi cạnh trường và không lưu.
- E2: Hai admin sửa cùng lúc, bản lưu sau bị từ chối nếu thời điểm sửa đã đổi, hệ thống yêu cầu tải lại trang.

#### UC-10 Cấu hình hiển thị công khai

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin chọn mục nào xuất hiện khi người khác quét mã |
| Điều kiện trước | Hồ sơ tồn tại; đã xác nhận với chủ nuôi |
| Điều kiện sau | Cấu hình mới có hiệu lực trên trang công khai |
| Tham chiếu | F-12; FR-15, FR-16; BR-04; NFR-08 |

**Luồng chính**

1. Admin mở mục Hiển thị công khai trong chi tiết hồ sơ.
2. Hệ thống hiển thị 8 công tắc theo cấu hình hiện tại.
3. Admin bật hoặc tắt từng mục.
4. Admin bấm Xem trước, hệ thống dựng trang công khai theo cấu hình chưa lưu.
5. Admin bấm Lưu.
6. Hệ thống lưu cấu hình và xóa bộ nhớ đệm của trang công khai.

**Luồng thay thế và ngoại lệ**

- A1: Tắt nút gọi nhưng vẫn bật số điện thoại chính là hợp lệ, số hiển thị dưới dạng chữ.
- E1: Tắt cả nút gọi và hai số điện thoại, hệ thống cảnh báo "Người quét sẽ không liên lạc được với chủ" và yêu cầu xác nhận.

#### UC-11 Lưu trữ và khôi phục hồ sơ

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin ẩn hồ sơ khỏi trang công khai mà không xóa dữ liệu, hoặc đưa hồ sơ trở lại |
| Điều kiện sau | Trạng thái hồ sơ là archived hoặc active |
| Tham chiếu | F-13; FR-17; BR-07 |

**Luồng chính (lưu trữ)**

1. Admin chọn Lưu trữ hồ sơ trong chi tiết.
2. Hệ thống hỏi xác nhận và nêu rõ trang công khai sẽ ngừng hiển thị.
3. Admin xác nhận.
4. Hệ thống đặt trạng thái archived, xóa bộ nhớ đệm và ghi nhật ký.

**Luồng thay thế và ngoại lệ**

- A1: Khôi phục, admin chọn Khôi phục hồ sơ, hệ thống đặt lại active.
- A2: Hồ sơ có mã đang bị khóa, khôi phục không tự mở khóa mã.
- A3: Mỗi lần lưu trữ hoặc khôi phục, hệ thống ghi nhật ký archive hoặc restore.

#### UC-12 Quản lý ảnh

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin tải ảnh lên, chọn ảnh đại diện, sắp xếp và xóa ảnh của bé |
| Điều kiện trước | Hồ sơ tồn tại |
| Điều kiện sau | Thư viện ảnh cập nhật và hiển thị đúng thứ tự trên tab Ảnh |
| Tham chiếu | F-14; FR-18, FR-19; NFR-02; R-04, R-05 |

**Luồng chính**

1. Admin mở tab Ảnh trong chi tiết hồ sơ.
2. Admin chọn tối đa 10 ảnh một lần.
3. Trình duyệt kiểm tra loại tệp và dung lượng, rồi xin API cấp quyền tải lên.
4. Trình duyệt tải ảnh thẳng lên storage.
5. Hệ thống lưu bản ghi ảnh (đường dẫn, thứ tự).
6. Admin chọn ảnh đại diện, sửa chú thích, kéo để sắp xếp hoặc xóa ảnh.

**Luồng thay thế và ngoại lệ**

- E1: Sai định dạng hoặc quá 5 MB, hệ thống báo lỗi từng ảnh và các ảnh còn lại vẫn được tải.
- E2: Đủ 30 ảnh, hệ thống chặn thêm ảnh.
- E3: Tải lỗi giữa chừng, ảnh lỗi không tạo bản ghi.

#### UC-13 Quản lý video và kỷ niệm

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin tải video lên hoặc dán link video, và viết câu chuyện, kỷ niệm cho bé |
| Điều kiện trước | Hồ sơ tồn tại |
| Điều kiện sau | Video và kỷ niệm hiển thị trên tab tương ứng |
| Tham chiếu | F-15, F-16; FR-20, FR-21; R-04, R-08 |

**Luồng chính (tải video lên)**

1. Admin mở tab Video trong chi tiết hồ sơ và chọn tệp video, đặt tiêu đề.
2. Trình duyệt kiểm tra định dạng (MP4, WebM), dung lượng (≤ 100 MB) và đọc thời lượng (≤ 3 phút); thử phát tệp để phát hiện codec trình duyệt không hỗ trợ.
3. Trình duyệt chụp một khung hình làm ảnh bìa (JPEG).
4. Trình duyệt xin API cấp URL tải lên có chữ ký cho video và ảnh bìa (API-14).
5. Trình duyệt tải video và ảnh bìa thẳng lên Storage, hiển thị tiến độ.
6. Hệ thống xác nhận tệp đã có trên Storage và lưu bản ghi video (source = upload).

**Luồng thay thế và ngoại lệ**

- A1: Dán link, admin chọn "Dán liên kết" và nhập link YouTube hoặc Vimeo; hệ thống kiểm tra tên miền, chuyển thành liên kết nhúng và lưu bản ghi (source = youtube hoặc vimeo).
- A2: Kỷ niệm, admin mở tab Kỷ niệm, nhập tiêu đề, ngày và nội dung rồi lưu; có thể sửa, xóa và sắp xếp.
- A3: Xóa video tải lên, hệ thống xóa bản ghi và cả tệp video, ảnh bìa trên Storage.
- E1: Liên kết không thuộc tên miền được phép, hệ thống từ chối và nêu lý do.
- E2: Nội dung có mã HTML, hệ thống escape khi hiển thị, không chạy mã.
- E3: Sai định dạng, quá 100 MB hoặc quá 3 phút, hệ thống báo lỗi và không tải lên.
- E4: Trình duyệt không phát được tệp (thường là video HEVC từ iPhone), hệ thống báo "Video này có thể không xem được trên mọi điện thoại, hãy xuất lại dạng MP4 (H.264)" và không tải lên.
- E5: Đủ 5 video tải lên, hệ thống chặn thêm (link YouTube/Vimeo không tính vào giới hạn này).
- E6: Tải lỗi giữa chừng, không tạo bản ghi; tệp dở dang được dọn khi xác nhận thất bại.

### 9.3 Nhóm mã QR và đơn hàng

#### UC-14 Sinh mã thẻ, token và QR

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Hệ thống |
| Mô tả | Tạo mã thẻ dễ đọc, token công khai khó đoán và đường dẫn dùng cho mã QR |
| Điều kiện trước | Có hồ sơ hợp lệ và chưa có mã đang hoạt động (hoặc mã cũ đã được đặt replaced) |
| Điều kiện sau | Có đúng một mã active gắn với hồ sơ |
| Quan hệ | được include bởi UC-06, UC-17 |
| Tham chiếu | F-17; FR-11, FR-22; BR-01, BR-02; NFR-06 |

**Luồng chính**

1. Hệ thống lấy số thứ tự kế tiếp và tạo mã thẻ PMB-xxxxxx (6 chữ số).
2. Hệ thống sinh token bằng bộ sinh số ngẫu nhiên mật mã (từ 22 ký tự base62).
3. Hệ thống tạo bản ghi QR trạng thái active.
4. Hệ thống dựng URL công khai {SITE_URL}/p/{token}.

**Luồng thay thế và ngoại lệ**

- E1: Trùng token (xác suất cực nhỏ), hệ thống sinh lại tối đa 3 lần.
- E2: Lỗi lấy số thứ tự, hệ thống hủy toàn bộ giao dịch và báo lỗi cho use case gọi.

#### UC-15 Tải mã QR

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin tải ảnh QR để in lên mặt vòng cổ |
| Điều kiện trước | Hồ sơ có mã QR |
| Điều kiện sau | Tệp QR được lưu trên máy admin |
| Tham chiếu | F-18; FR-22, FR-23 |

**Luồng chính**

1. Admin bấm Tải mã QR trong chi tiết hồ sơ.
2. Admin chọn định dạng PNG hoặc SVG.
3. Hệ thống sinh ảnh QR từ URL công khai.
4. Trình duyệt tải tệp về, tên tệp theo mã thẻ (ví dụ PMB-000129.png).

**Luồng thay thế và ngoại lệ**

- A1: Mã đang bị khóa hoặc đã thay thế, vẫn tải được nhưng hệ thống cảnh báo trạng thái mã trước khi tải.

#### UC-16 Khóa / mở khóa mã QR

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin vô hiệu hóa mã khi mất vòng cổ và mở lại khi tìm thấy |
| Điều kiện trước | Mã ở trạng thái active (để khóa) hoặc locked (để mở khóa) |
| Điều kiện sau | Trạng thái mã đổi, trang công khai phản ánh ngay |
| Tham chiếu | F-19; FR-24, FR-35; BR-03; R-03 |

**Luồng chính (khóa)**

1. Admin chọn Khóa mã trong chi tiết hồ sơ.
2. Admin nhập lý do (mất vòng, theo yêu cầu của chủ nuôi).
3. Admin xác nhận.
4. Hệ thống đặt trạng thái locked, ghi thời điểm và lý do, xóa bộ nhớ đệm trang công khai.
5. Từ lúc này quét mã sẽ hiển thị thông báo mã lỗi (UC-21).

**Luồng thay thế và ngoại lệ**

- A1: Mở khóa, admin chọn Mở khóa, hệ thống đưa mã về active.
- E1: Mã đã ở trạng thái replaced, hệ thống không cho mở khóa.

#### UC-17 Phát hành lại mã QR

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin cấp mã mới cho bé khi mất vòng hoặc nghi ngờ lộ mã |
| Điều kiện trước | Hồ sơ đang active và có mã hiện tại |
| Điều kiện sau | Mã cũ ở trạng thái replaced, mã mới active |
| Quan hệ | include UC-14 |
| Tham chiếu | F-20; FR-25, FR-35; BR-01, BR-03 |

**Luồng chính**

1. Admin chọn Phát hành lại mã trong chi tiết hồ sơ.
2. Hệ thống cảnh báo mã cũ sẽ ngừng hoạt động và vòng cũ không dùng được nữa.
3. Admin xác nhận.
4. Hệ thống đặt mã cũ thành replaced, gọi UC-14 để tạo mã mới và ghi liên kết mã cũ sang mã mới.
5. Hệ thống hiển thị QR mới để tải (UC-15).

**Luồng thay thế và ngoại lệ**

- E1: Hồ sơ đang được lưu trữ, hệ thống yêu cầu khôi phục hồ sơ trước.
- E2: Lỗi sinh mã mới, hệ thống hoàn tác giao dịch, mã cũ giữ nguyên trạng thái.

#### UC-18 Cập nhật gói và trạng thái đơn

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin chọn gói sản phẩm và cập nhật tiến độ làm hộp cho từng hồ sơ |
| Điều kiện sau | Trạng thái đơn mới được lưu cùng thời điểm đổi |
| Tham chiếu | F-21; FR-26 |

**Luồng chính**

1. Admin mở khối Đơn hàng trong chi tiết hồ sơ.
2. Admin chọn gói (hộp đầy đủ hoặc chỉ vòng QR) và trạng thái (Đã nhận, Đang làm, Đã phát hành, Đã giao).
3. Admin nhập ghi chú nếu cần.
4. Admin bấm Lưu, hệ thống lưu và ghi thời điểm đổi trạng thái.

**Luồng thay thế và ngoại lệ**

- A1: Chuyển lùi trạng thái được phép nhưng hệ thống ghi nhật ký.

### 9.4 Nhóm trang công khai và tổng quan

#### UC-19 Xem trang Digital Memory

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Người quét QR |
| Mô tả | Người quét mở trang thông tin của bé qua mã QR |
| Điều kiện trước | Có mã QR hoặc đường dẫn, có kết nối internet |
| Điều kiện sau | Trang hiển thị theo cấu hình hoặc thông báo lỗi (UC-21); lượt quét được ghi (UC-22) |
| Quan hệ | include UC-22; được extend bởi UC-20, UC-21 |
| Tham chiếu | F-22, F-24; FR-28, FR-29, FR-32, FR-34; BR-03, BR-04; NFR-01, NFR-08 |

**Luồng chính**

1. Người quét mở camera, quét QR; trình duyệt mở /p/{token}.
2. Hệ thống kiểm tra giới hạn tốc độ truy cập.
3. Hệ thống tìm mã theo token, kiểm tra mã active và hồ sơ active.
4. Hệ thống nạp thông tin bé, chủ nuôi và cấu hình hiển thị.
5. Hệ thống chỉ dựng các mục được bật trong cấu hình.
6. Hệ thống hiển thị trang theo chế độ của hồ sơ: bé đang sống thì lời nhắn tìm bé và nút gọi, nhắn tin ở đầu trang; bé đã mất thì bố cục tưởng niệm (FR-36).
7. Hệ thống ghi nhận lượt quét (UC-22).
8. Người quét chuyển giữa các tab Ảnh, Video, Kỷ niệm, Hồ sơ.

**Luồng thay thế và ngoại lệ**

- A1: Tab không có nội dung hoặc bị tắt hiển thị, hệ thống ẩn tab đó.
- A2: Người quét bấm gọi hoặc nhắn tin, chuyển sang UC-20.
- E1: Mã không tồn tại, bị khóa, đã thay thế hoặc hồ sơ lưu trữ, chuyển sang UC-21.
- E2: Vượt giới hạn tốc độ, hệ thống trả mã 429 kèm thông báo thử lại sau.
- E3: Lỗi hệ thống, hiển thị trang lỗi chung và không lộ chi tiết kỹ thuật.

#### UC-20 Gọi / nhắn tin chủ nuôi

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Người quét QR |
| Mô tả | Người quét liên lạc ngay với chủ nuôi bằng một chạm |
| Điều kiện trước | Đang xem trang của bé (UC-19) và cấu hình bật nút gọi |
| Điều kiện sau | Ứng dụng gọi hoặc nhắn tin trên điện thoại mở sẵn số của chủ nuôi |
| Quan hệ | extend UC-19 |
| Tham chiếu | F-23; FR-30 |

**Luồng chính**

1. Người quét bấm Gọi cho chủ nuôi.
2. Trình duyệt mở ứng dụng gọi với số điện thoại chính (liên kết tel:).

**Luồng thay thế và ngoại lệ**

- A1: Người quét bấm Nhắn tin, trình duyệt mở ứng dụng tin nhắn (liên kết sms:).
- A2: Thiết bị không hỗ trợ cuộc gọi (máy tính), hệ thống hiển thị số để sao chép.
- E1: Cấu hình tắt nút gọi, hệ thống ẩn nút; nếu số điện thoại vẫn bật thì hiển thị dạng chữ.

#### UC-21 Xem thông báo mã lỗi

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Người quét QR |
| Mô tả | Người quét thấy thông báo thân thiện khi mã không dùng được |
| Điều kiện trước | Mã không tồn tại, bị khóa, đã thay thế hoặc hồ sơ đã lưu trữ |
| Điều kiện sau | Không có thông tin nào của bé hay chủ nuôi bị lộ |
| Quan hệ | extend UC-19 |
| Tham chiếu | F-25; FR-31; BR-03; NFR-08 |

**Luồng chính**

1. Hệ thống xác định lý do không hiển thị (không tồn tại, khóa, đã thay thế, lưu trữ).
2. Hệ thống hiển thị trang thông báo: mã này hiện không khả dụng, kèm kênh liên hệ chung của Pet Memory Box.
3. Hệ thống trả mã HTTP 404 cho mọi trường hợp, với cùng một nội dung.

**Luồng thay thế và ngoại lệ**

- A1: Trang không đưa ra lý do chi tiết và không phân biệt mã HTTP để tránh lộ việc mã từng tồn tại; lý do thật chỉ ghi trong scan_logs.

#### UC-22 Ghi nhận lượt quét

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Hệ thống |
| Mô tả | Lưu vết mỗi lần mở trang để admin thống kê |
| Điều kiện sau | Có một bản ghi lượt quét cho mỗi lần mở trang |
| Quan hệ | được include bởi UC-19 |
| Tham chiếu | F-26; FR-33 |

**Luồng chính**

1. Sau khi xác định kết quả, hệ thống ghi thời điểm, kết quả (ok, not\_found, locked, replaced, archived), mã QR nếu có, giá trị băm của IP và user-agent rút gọn.
2. Việc ghi chạy sau khi đã trả trang, không làm chậm người quét.

**Luồng thay thế và ngoại lệ**

- E1: Ghi lỗi, hệ thống bỏ qua, ghi log lỗi và trang vẫn hiển thị bình thường.

#### UC-23 Xem tổng quan

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin xem số liệu tổng hợp ngay sau khi đăng nhập |
| Điều kiện sau | Số liệu hiển thị đúng với dữ liệu hiện tại |
| Tham chiếu | F-27; FR-27 |

**Luồng chính**

1. Admin mở Tổng quan trên sidebar.
2. Hệ thống hiển thị số hồ sơ, số mã active, lượt quét 7 ngày, số đơn theo từng trạng thái và 5 hồ sơ mới nhất.
3. Admin bấm vào một số liệu để mở danh sách đã lọc tương ứng.

**Luồng thay thế và ngoại lệ**

- A1: Chưa có dữ liệu, hệ thống hiển thị 0 và gợi ý tạo hồ sơ đầu tiên.

#### UC-24 Chuyển chế độ tưởng niệm

| Mục | Nội dung |
| --- | --- |
| Tác nhân | Admin |
| Mô tả | Admin đánh dấu bé đã mất theo yêu cầu của chủ nuôi, hoặc hoàn tác khi đánh dấu nhầm |
| Điều kiện trước | Hồ sơ tồn tại; đã xác nhận với chủ nuôi |
| Điều kiện sau | Hồ sơ ở chế độ memorial, trang công khai dùng bố cục tưởng niệm; mã QR không đổi |
| Tham chiếu | F-28; FR-36, FR-35; BR-09 |

**Luồng chính**

1. Admin chọn "Chuyển sang trang tưởng niệm" trong chi tiết hồ sơ.
2. Admin nhập ngày mất (tùy chọn) và câu tưởng niệm (tùy chọn, thay cho câu ngắn).
3. Hệ thống cảnh báo nút gọi và lời nhắn tìm bé sẽ bị ẩn trên trang công khai.
4. Admin xác nhận.
5. Hệ thống đặt life\_status = memorial, tắt show\_call\_button, show\_phone, show\_phone2 và ghi nhật ký memorial.

**Luồng thay thế và ngoại lệ**

- A1: Hoàn tác, admin chọn "Chuyển về bé đang sống", hệ thống đặt lại alive; nút gọi không tự bật lại, admin bật trong cấu hình hiển thị (UC-10).
- A2: Admin vẫn có thể bật lại nút gọi ở chế độ tưởng niệm nếu chủ nuôi muốn người xem liên lạc với gia đình; khi đó nút có nhãn "Liên hệ gia đình".
- E1: Ngày mất ở tương lai hoặc trước ngày sinh, hệ thống báo lỗi và không lưu.

## 10. Yêu cầu chức năng (FR)

Hệ thống có 37 yêu cầu chức năng, mỗi yêu cầu truy vết được về ít nhất một use case và một tính năng. Ưu tiên kế thừa từ tính năng (xem mục 5).

### 10.1 Danh sách yêu cầu chức năng

| Mã | Yêu cầu | Use case | Tính năng | Ưu tiên |
| --- | --- | --- | --- | --- |
| FR-01 | Landing page hiển thị hero, năm món trong hộp, Digital Memory, cách hoạt động, giá trị sản phẩm, hỏi đáp và kêu gọi nhắn tin | UC-01 | F-01, F-04 | Must |
| FR-02 | Hiển thị nút nhắn Zalo và Messenger, mở liên kết đã cấu hình trong tab mới; ẩn nút nếu chưa cấu hình | UC-02 | F-02 | Must |
| FR-03 | Có trang Digital Memory mẫu dùng dữ liệu giả, không chứa dữ liệu khách thật | UC-01 | F-03 | Could |
| FR-04 | Đăng nhập admin bằng email và mật khẩu; phiên lưu trong admin\_sessions (token băm SHA-256), cookie httpOnly, hết hạn sau 8 giờ | UC-03 | F-05 | Must |
| FR-05 | Khóa đăng nhập 15 phút sau 5 lần sai liên tiếp | UC-03 | F-05 | Should |
| FR-06 | Đăng xuất hủy phiên và chuyển về trang đăng nhập | UC-04 | F-06 | Must |
| FR-07 | Đổi mật khẩu yêu cầu mật khẩu hiện tại, mật khẩu mới từ 8 ký tự; hủy các phiên khác | UC-05 | F-07 | Should |
| FR-08 | Middleware chặn mọi route /admin/\* và /api/admin/\* khi chưa đăng nhập | UC-03 | F-05 | Must |
| FR-09 | Tạo hồ sơ gồm thông tin bé (tên, loài, giống, giới tính, ngày sinh, màu lông, đặc điểm, lưu ý, câu ngắn, đang sống hay đã mất, ngày mất, ảnh đại diện), chủ nuôi (họ tên, hai số điện thoại, Zalo/Messenger, khu vực, địa chỉ) và gói sản phẩm; tạo đơn hàng cùng lúc | UC-06 | F-08, F-21 | Must |
| FR-10 | Kiểm tra dữ liệu theo mục 10.2; tên bé, loài, tên chủ và số điện thoại chính là bắt buộc | UC-06, UC-09 | F-08, F-11 | Must |
| FR-11 | Khi lưu hồ sơ mới, sinh mã thẻ PMB-xxxxxx tăng dần và token ngẫu nhiên mật mã từ 22 ký tự base62 | UC-14 | F-17 | Must |
| FR-12 | Danh sách hồ sơ phân trang 20 dòng, tìm theo mã thẻ, tên bé, tên chủ, số điện thoại; lọc theo trạng thái hồ sơ và trạng thái mã | UC-07 | F-09 | Must |
| FR-13 | Chi tiết hồ sơ hiển thị thông tin, QR, ảnh, video, kỷ niệm, cấu hình hiển thị, đơn hàng và lịch sử mã | UC-08 | F-10 | Must |
| FR-14 | Chỉnh sửa thông tin bé và chủ nuôi; không đổi mã thẻ và token; từ chối bản lưu cũ khi có sửa đồng thời | UC-09 | F-11 | Must |
| FR-15 | Cấu hình hiển thị công khai 8 mục: nút gọi, số điện thoại chính, số điện thoại phụ, khu vực, địa chỉ đầy đủ, lưu ý, ảnh và video, kỷ niệm | UC-10 | F-12 | Must |
| FR-16 | Xem trước trang công khai theo cấu hình chưa lưu | UC-10 | F-12 | Should |
| FR-17 | Lưu trữ (xóa mềm) và khôi phục hồ sơ; hồ sơ lưu trữ không hiển thị công khai | UC-11 | F-13 | Should |
| FR-18 | Tải ảnh JPEG, PNG, WebP tối đa 5 MB mỗi ảnh, 30 ảnh mỗi bé, trực tiếp từ trình duyệt lên storage | UC-12 | F-14 | Must |
| FR-19 | Chọn ảnh đại diện, sắp xếp, sửa chú thích, xóa ảnh | UC-12 | F-14 | Should |
| FR-20 | Quản lý video: tải lên trực tiếp MP4/WebM ≤ 100 MB, ≤ 3 phút, tối đa 5 video tải lên mỗi bé, kèm ảnh bìa; hoặc dán link YouTube/Vimeo; sửa tiêu đề, xóa, sắp xếp | UC-13 | F-15 | Should |
| FR-21 | Quản lý kỷ niệm gồm tiêu đề, ngày, nội dung văn bản: thêm, sửa, xóa, sắp xếp | UC-13 | F-16 | Should |
| FR-22 | Sinh ảnh QR từ URL {SITE\_URL}/p/{token}, mức sửa lỗi từ M trở lên | UC-14, UC-15 | F-17, F-18 | Must |
| FR-23 | Tải QR dạng PNG 1024 x 1024 px và SVG, tên tệp theo mã thẻ | UC-15 | F-18 | Must |
| FR-24 | Khóa mã kèm lý do, mở khóa đưa mã về active; mã replaced không mở khóa được | UC-16 | F-19 | Must |
| FR-25 | Phát hành lại mã: tạo token mới, mã cũ thành replaced và không dùng lại | UC-17 | F-20 | Should |
| FR-26 | Gán gói (full\_box, tag\_only) và trạng thái đơn (received, preparing, issued, delivered), ghi thời điểm đổi | UC-18 | F-21 | Should |
| FR-27 | Tổng quan: số hồ sơ, số mã active, lượt quét 7 ngày, số đơn theo trạng thái, 5 hồ sơ mới nhất | UC-23 | F-27 | Could |
| FR-28 | Trang /p/{token} hiển thị tên, ảnh đại diện, câu ngắn, loài, giống, giới tính và các mục chủ nuôi đã bật | UC-19 | F-22 | Must |
| FR-29 | Trang công khai có bốn tab Ảnh, Video, Kỷ niệm, Hồ sơ; chỉ hiện tab có nội dung và được bật | UC-19 | F-24 | Must |
| FR-30 | Nút Gọi (tel:) và Nhắn tin (sms:) luôn ở đầu trang khi cấu hình bật | UC-20 | F-23 | Must |
| FR-31 | Mã không tồn tại, bị khóa, đã thay thế hoặc hồ sơ lưu trữ: trả cùng một trang thông báo với HTTP 404, không lộ thông tin | UC-21 | F-25 | Must |
| FR-32 | Trang công khai gắn noindex và không nằm trong sitemap | UC-19 | F-22 | Must |
| FR-33 | Ghi lượt quét gồm thời điểm, kết quả, IP đã băm, user-agent rút gọn; lỗi ghi không chặn hiển thị trang | UC-22 | F-26 | Should |
| FR-34 | Giới hạn 60 yêu cầu mỗi phút trên mỗi IP cho /p/{token}; vượt thì trả 429 | UC-19 | F-22 | Should |
| FR-35 | Ghi nhật ký thao tác admin: tạo, sửa, khóa, mở khóa, phát hành lại, lưu trữ, khôi phục, chuyển chế độ tưởng niệm, đổi mật khẩu | UC-05 đến UC-17, UC-24 | F-07 đến F-20, F-28 | Should |
| FR-36 | Chế độ tưởng niệm: trang công khai hiển thị ngày sinh – ngày mất, câu tưởng niệm, ưu tiên tab Ảnh và Kỷ niệm; ẩn lời nhắn tìm bé; nút gọi và số điện thoại mặc định tắt, mang nhãn "Liên hệ gia đình" nếu được bật lại | UC-19, UC-24 | F-28 | Should |
| FR-37 | Mọi URL công khai và QR dựng từ biến SITE\_URL; khi request tới tên miền khác SITE\_URL (ví dụ tên miền *.vercel.app cũ), middleware chuyển hướng 308 sang SITE\_URL giữ nguyên đường dẫn | UC-14, UC-19 | F-17, F-22 | Must |

### 10.2 Quy tắc kiểm tra dữ liệu

| Trường | Quy tắc |
| --- | --- |
| Tên bé | Bắt buộc, 1 đến 50 ký tự |
| Loài | Bắt buộc, chọn một trong chó, mèo, khác |
| Giống, màu lông | Tùy chọn, tối đa 50 ký tự |
| Giới tính | Đực, cái hoặc chưa rõ |
| Ngày sinh | Tùy chọn, định dạng dd/mm/yyyy, không ở tương lai |
| Đặc điểm nhận dạng | Tùy chọn, tối đa 200 ký tự |
| Lưu ý, nội dung kỷ niệm | Tùy chọn; lưu ý tối đa 1.000 ký tự, kỷ niệm tối đa 5.000 ký tự |
| Câu ngắn dưới tên bé | Tùy chọn, tối đa 80 ký tự |
| Họ tên chủ nuôi | Bắt buộc, 2 đến 80 ký tự |
| Số điện thoại chính | Bắt buộc, số Việt Nam gồm 10 chữ số bắt đầu bằng 0 (hoặc +84); chuẩn hóa về dạng 0xxxxxxxxx |
| Số điện thoại phụ | Tùy chọn, cùng định dạng số chính |
| Zalo / Messenger | Tùy chọn, là số Zalo hoặc đường dẫn https |
| Khu vực | Tùy chọn, tối đa 100 ký tự (phường, quận, tỉnh/thành) |
| Địa chỉ đầy đủ | Tùy chọn, tối đa 200 ký tự |
| Ảnh | JPEG, PNG, WebP; tối đa 5 MB; tối đa 30 ảnh mỗi bé |
| Ngày mất | Tùy chọn, dd/mm/yyyy, không ở tương lai, không trước ngày sinh |
| Video tải lên | MP4 hoặc WebM; tối đa 100 MB; tối đa 3 phút; tối đa 5 video tải lên mỗi bé; tiêu đề tối đa 100 ký tự |
| Liên kết video | Bắt đầu bằng https; tên miền youtube.com, youtu.be hoặc vimeo.com |
| Tiêu đề kỷ niệm | Bắt buộc khi có kỷ niệm, tối đa 100 ký tự |

## 11. Yêu cầu phi chức năng (NFR)

Tiêu chí quan trọng nhất là tốc độ mở trang quét QR và bảo vệ thông tin chủ nuôi; các yêu cầu dưới đây có cách kiểm tra để nghiệm thu trên bản triển khai thật.

| Mã | Nhóm | Yêu cầu | Cách kiểm tra |
| --- | --- | --- | --- |
| NFR-01 | Hiệu năng | Trang /p/{token} có LCP tối đa 2,5 giây trên mạng 4G, TTFB tối đa 800 ms khi đã có cache | Lighthouse trên bản triển khai, mô phỏng 4G |
| NFR-02 | Hiệu năng | Ảnh hiển thị trên trang công khai được nén và tải trì hoãn; ảnh nhỏ không quá 200 KB; video dùng preload="none" kèm ảnh bìa, không tải byte video nào trước khi người xem bấm phát | Kiểm tra tab Network |
| NFR-03 | Khả dụng | Trang công khai sẵn sàng tối thiểu 99,5% mỗi tháng, dựa trên cam kết của nền tảng | Theo dõi bằng dịch vụ uptime |
| NFR-04 | Bảo mật | Toàn bộ lưu lượng dùng HTTPS, bật HSTS | Kiểm tra header phản hồi |
| NFR-05 | Bảo mật | Mật khẩu băm bcrypt với cost từ 10; token phiên sinh bằng CSPRNG, chỉ lưu giá trị băm SHA-256; cookie phiên httpOnly, secure, sameSite=lax | Review mã nguồn, kiểm tra cookie và bảng admin\_sessions |
| NFR-06 | Bảo mật | Token công khai sinh bằng CSPRNG, ít nhất 128 bit độ ngẫu nhiên (22 ký tự base62) | Review mã nguồn, thử và độ dài token |
| NFR-07 | Bảo mật | Kiểm tra dữ liệu bằng schema, escape khi hiển thị, chống CSRF cho thao tác ghi, giới hạn loại và kích thước tệp | Kiểm thử với dữ liệu độc hại |
| NFR-08 | Riêng tư | Chỉ hiển thị mục được bật; không có API hay trang liệt kê hồ sơ công khai; noindex | Kiểm thử truy cập trái phép và xem nguồn trang |
| NFR-09 | Tương thích | Chạy trên hai phiên bản mới nhất của Chrome, Safari, Firefox, Edge; iOS 15 trở lên, Android 9 trở lên | Kiểm thử trên thiết bị thật |
| NFR-10 | Giao diện | Trang công khai thiết kế mobile-first, dùng được từ 360 px; trang admin tối ưu từ 1.024 px và vẫn dùng được trên máy tính bảng | Kiểm tra ở các kích thước màn hình |
| NFR-11 | Khả năng truy cập | Độ tương phản chữ tối thiểu 4,5:1; vùng chạm từ 44 px; mọi ô nhập có nhãn | Công cụ kiểm tra tương phản, duyệt thủ công |
| NFR-12 | Bảo trì | Dùng TypeScript, lint, và kiểm thử tự động cho các luồng Must | Báo cáo CI |
| NFR-13 | Sao lưu | Cơ sở dữ liệu sao lưu tự động mỗi ngày, giữ ít nhất 7 ngày (Supabase gói Pro); dự án không bị tạm dừng khi ít truy cập | Kiểm tra gói và cấu hình Supabase, thử khôi phục |
| NFR-14 | Mở rộng | Chịu được ít nhất 100 lượt quét đồng thời mà không lỗi | Kiểm thử tải |
| NFR-15 | Địa phương hóa | Giao diện tiếng Việt, múi giờ Asia/Ho\_Chi\_Minh, ngày dạng dd/mm/yyyy | Duyệt giao diện |
| NFR-16 | Quan sát | Ghi log lỗi máy chủ và lỗi tải ảnh, video, xem được trên bảng log của nền tảng | Gây lỗi thử và kiểm tra log |
| NFR-17 | Bền vững đường dẫn | Mọi QR đã in tiếp tục mở được trang của bé sau khi đổi tên miền; dự án Vercel không bị xóa hay đổi tên | Quét QR in bằng tên miền cũ sau khi đổi, kiểm tra chuyển hướng 308 |

## 12. Sơ đồ Sequence

Ba sơ đồ dưới đây mô tả các luồng quan trọng nhất của hệ thống. Mỗi sơ đồ ghi rõ mã UC/FR tương ứng để truy vết.

### 12.1 Quét mã QR và xem trang Digital Memory (UC-19 đến UC-22, FR-28 đến FR-34)

Luồng công khai, không cần đăng nhập. Hệ thống tra cứu theo token, trả hai kết quả với người quét: hợp lệ (200) hoặc không khả dụng (404, gồm không tồn tại, bị khóa, đã thay thế, hồ sơ lưu trữ); lý do chi tiết chỉ ghi vào scan\_logs. Việc ghi lượt quét chạy sau khi đã phản hồi nên không làm chậm trang.

&#91;embedded content: sequence · quét QR, 3 kết quả\]

### 12.2 Admin đăng ký hồ sơ và phát hành mã QR (UC-06, UC-12, UC-14, UC-15; FR-09 đến FR-11, FR-18, FR-22, FR-23)

Ảnh được tải thẳng từ trình duyệt lên kho lưu trữ bằng URL ký sẵn, nên hàm serverless không phải chịu giới hạn dung lượng request. Token chỉ sinh ở máy chủ.

&#91;embedded content: sequence · đăng ký hồ sơ và phát hành QR\]

### 12.3 Đăng nhập admin và khóa / cấp lại mã QR (UC-03, UC-16, UC-17; FR-04, FR-24, FR-25)

Phiên đăng nhập lưu trong admin\_sessions, trình duyệt giữ token trong cookie httpOnly. Cấp lại mã tạo token mới và đánh dấu mã cũ là đã thay thế, vì vậy mã cũ trả về 404.

&#91;embedded content: sequence · đăng nhập, khóa, cấp lại mã\]

## 13. Sơ đồ lớp (Class diagram)

### 13.1 Lớp miền (domain)

Hồ sơ thú cưng (Pet) là trung tâm: chủ nuôi, mã QR, cấu hình hiển thị, ảnh, video, kỷ niệm và đơn hàng đều gắn với nó. Đơn hàng tham chiếu Owner và Pet qua ownerId, petId. Quan hệ 1 — \* là một-nhiều; VisibilitySettings là quan hệ một-một với Pet.

&#91;embedded content: class diagram · 10 lớp miền\]

### 13.2 Lớp dịch vụ (service)

| Lớp dịch vụ | Trách nhiệm | Lớp miền sử dụng | FR liên quan |
| --- | --- | --- | --- |
| AuthService | Đăng nhập, băm và so khớp mật khẩu, cấp, kiểm tra và hủy phiên trong admin\_sessions, đổi mật khẩu, khóa tạm khi sai nhiều lần | AdminUser, AdminSession | FR-04 đến FR-08 |
| PetService | Tạo, sửa, liệt kê, tìm kiếm, lưu trữ hồ sơ, chuyển chế độ tưởng niệm; kiểm tra dữ liệu bằng Zod | Pet, Owner | FR-09, FR-10, FR-12 đến FR-14, FR-17, FR-36 |
| VisibilityService | Đọc, lưu và xem trước cấu hình 8 mục hiển thị | VisibilitySettings | FR-15, FR-16 |
| QrService | Sinh mã thẻ và token CSPRNG, tạo ảnh QR, tải PNG/SVG, khóa, mở khóa, phát hành lại | QrTag | FR-11, FR-22 đến FR-25 |
| MediaService | Cấp URL tải ảnh và video có chữ ký, xác nhận tệp, lưu metadata ảnh, ảnh đại diện, video, kỷ niệm; xóa tệp trên Storage | MediaAsset, Video, Memory | FR-18 đến FR-21 |
| OrderService | Gán gói, đổi trạng thái đơn và ghi thời điểm | Order | FR-26 |
| PublicProfileService | Tra cứu theo token, lọc theo cấu hình và chế độ hồ sơ, trả 200 / 404, giới hạn tần suất | QrTag, Pet, VisibilitySettings | FR-28 đến FR-32, FR-34, FR-36 |
| ScanLogService | Ghi lượt quét với IP đã băm, thống kê cho trang tổng quan | ScanLog | FR-27, FR-33 |
| AuditService | Ghi nhật ký thao tác của admin | AuditLog | FR-35 |

## 14. ERD và thiết kế cơ sở dữ liệu

Cơ sở dữ liệu là Supabase Postgres, truy cập qua Prisma (kết nối qua connection pooler của Supabase cho Vercel Functions). Khóa chính dùng uuid, riêng scan\_logs và audit\_logs dùng số nguyên tự tăng vì chỉ thêm vào. Thời gian lưu dạng timestamptz (UTC).

### 14.1 Sơ đồ ERD

Sáu bảng con (qr\_tags, orders, media\_assets, videos, memories, visibility\_settings) đều có khóa ngoại pet\_id; admin\_sessions có khóa ngoại admin\_id. Hồ sơ không bao giờ bị xóa vật lý: lưu trữ bằng status = archived (FR-17).

&#91;embedded content: ERD · 11 bảng\]

### 14.2 Từ điển dữ liệu

#### admin\_users

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK, mặc định gen\_random\_uuid() | Mã nội bộ |
| email | citext | UNIQUE, NOT NULL | Tên đăng nhập, không phân biệt hoa thường |
| password\_hash | text | NOT NULL | Mật khẩu đã băm bằng bcrypt |
| failed\_attempts | int | NOT NULL, mặc định 0 | Số lần sai liên tiếp (FR-05) |
| locked\_until | timestamptz | NULL | Thời điểm hết khóa đăng nhập |
| created\_at | timestamptz | NOT NULL, mặc định now() | Ngày tạo |

#### admin\_sessions

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| admin\_id | uuid | FK admin\_users, NOT NULL, ON DELETE CASCADE | Admin sở hữu phiên |
| token\_hash | text | UNIQUE, NOT NULL | SHA-256 của token phiên; token thô chỉ nằm trong cookie |
| expires\_at | timestamptz | NOT NULL | Hết hạn sau 8 giờ (FR-04) |
| user\_agent | text | NULL | User-agent rút gọn, để nhận biết phiên |
| created\_at | timestamptz | NOT NULL, mặc định now() | Thời điểm đăng nhập |

#### owners

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| full\_name | text | NOT NULL | Họ tên chủ nuôi |
| phone | text | NOT NULL | Số điện thoại chính |
| phone2 | text | NULL | Số điện thoại phụ |
| zalo\_messenger | text | NULL | Liên kết Zalo hoặc Messenger |
| area | text | NULL | Khu vực (quận, thành phố), có thể công khai |
| address | text | NULL | Địa chỉ đầy đủ, mặc định không công khai |
| created\_at, updated\_at | timestamptz | NOT NULL | Mốc thời gian |

#### pets

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ, không đưa lên URL công khai |
| card\_no | text | UNIQUE, NOT NULL | Mã thẻ PMB-xxxxxx, sinh từ sequence (FR-11) |
| owner\_id | uuid | FK owners, NOT NULL, ON DELETE RESTRICT | Chủ nuôi |
| name | text | NOT NULL | Tên bé |
| species | text | NOT NULL | Loài |
| breed | text | NULL | Giống |
| gender | text | NULL | male, female hoặc unknown |
| birth\_date | date | NULL | Ngày sinh |
| coat\_color | text | NULL | Màu lông |
| traits | text | NULL | Đặc điểm nhận dạng |
| note | text | NULL | Lưu ý (thói quen, sức khỏe cần biết) |
| tagline | text | NULL | Câu ngắn hiển thị trên trang công khai |
| life\_status | text | NOT NULL, mặc định alive | alive hoặc memorial (FR-36) |
| passed\_date | date | NULL | Ngày mất, chỉ dùng khi memorial |
| status | text | NOT NULL, mặc định active | active hoặc archived |
| archived\_at | timestamptz | NULL | Thời điểm lưu trữ |
| version | int | NOT NULL, mặc định 1 | Khóa lạc quan, chống ghi đè khi sửa (FR-14) |
| created\_at, updated\_at | timestamptz | NOT NULL | Mốc thời gian |

#### visibility\_settings

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| pet\_id | uuid | PK, FK pets, ON DELETE CASCADE | Một hồ sơ có đúng một dòng cấu hình |
| show\_call\_button | boolean | NOT NULL, mặc định true | Nút gọi và nhắn tin |
| show\_phone | boolean | NOT NULL, mặc định true | Số điện thoại chính |
| show\_phone2 | boolean | NOT NULL, mặc định false | Số điện thoại phụ |
| show\_area | boolean | NOT NULL, mặc định true | Khu vực |
| show\_address | boolean | NOT NULL, mặc định false | Địa chỉ đầy đủ |
| show\_note | boolean | NOT NULL, mặc định true | Lưu ý |
| show\_media | boolean | NOT NULL, mặc định true | Tab Ảnh và tab Video |
| show\_memories | boolean | NOT NULL, mặc định true | Tab Kỷ niệm |

Các giá trị mặc định trên là đề xuất thiết kế theo nguyên tắc riêng tư mặc định: địa chỉ và số phụ tắt cho đến khi admin và chủ nuôi đồng ý bật.

#### qr\_tags

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| pet\_id | uuid | FK pets, NOT NULL, ON DELETE RESTRICT | Hồ sơ sở hữu mã |
| token | char(22) | UNIQUE, NOT NULL | Token base62 sinh bằng CSPRNG, nằm trong URL của QR |
| status | text | NOT NULL, mặc định active | active, locked hoặc replaced |
| lock\_reason | text | NULL | Lý do khóa (FR-24) |
| issued\_at | timestamptz | NOT NULL, mặc định now() | Ngày phát hành |
| locked\_at | timestamptz | NULL | Thời điểm khóa |
| replaced\_at | timestamptz | NULL | Thời điểm bị thay bằng mã mới |

#### media\_assets

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| pet\_id | uuid | FK pets, NOT NULL, ON DELETE CASCADE | Hồ sơ |
| storage\_key | text | NOT NULL | Khóa đối tượng trong kho ảnh, dùng khi xóa |
| url | text | NOT NULL | Địa chỉ công khai của ảnh |
| mime\_type | text | NOT NULL, CHECK in (image/jpeg, image/png, image/webp) | Định dạng (FR-18) |
| size\_bytes | int | NOT NULL, CHECK ≤ 5242880 | Dung lượng tối đa 5 MB |
| caption | text | NULL | Chú thích |
| sort\_order | int | NOT NULL, mặc định 0 | Thứ tự hiển thị |
| is\_cover | boolean | NOT NULL, mặc định false | Ảnh đại diện, tối đa một ảnh mỗi hồ sơ |
| created\_at | timestamptz | NOT NULL | Ngày tải |

#### videos

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| pet\_id | uuid | FK pets, NOT NULL, ON DELETE CASCADE | Hồ sơ |
| source | text | NOT NULL, CHECK in (upload, youtube, vimeo) | Nguồn video (FR-20) |
| title | text | NULL | Tiêu đề, tối đa 100 ký tự |
| url | text | NOT NULL | Địa chỉ phát: URL tệp trên Storage hoặc liên kết nhúng |
| storage\_key | text | NULL, bắt buộc khi source = upload | Khóa tệp video trên Storage, dùng khi xóa |
| poster\_key | text | NULL | Khóa ảnh bìa trên Storage |
| mime\_type | text | NULL, CHECK in (video/mp4, video/webm) | Định dạng khi tải lên |
| size\_bytes | bigint | NULL, CHECK ≤ 104857600 | Dung lượng tối đa 100 MB |
| duration\_sec | int | NULL, CHECK ≤ 180 | Thời lượng tối đa 3 phút |
| sort\_order | int | NOT NULL, mặc định 0 | Thứ tự hiển thị |
| created\_at | timestamptz | NOT NULL | Ngày thêm |

#### memories

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| pet\_id | uuid | FK pets, NOT NULL, ON DELETE CASCADE | Hồ sơ |
| title | text | NOT NULL | Tiêu đề kỷ niệm |
| memory\_date | date | NULL | Ngày xảy ra |
| content | text | NOT NULL | Nội dung văn bản thuần (FR-21) |
| sort\_order | int | NOT NULL, mặc định 0 | Thứ tự hiển thị |
| created\_at, updated\_at | timestamptz | NOT NULL | Mốc thời gian |

#### orders

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | uuid | PK | Mã nội bộ |
| owner\_id | uuid | FK owners, NOT NULL, ON DELETE RESTRICT | Người đặt |
| pet\_id | uuid | FK pets, NOT NULL, ON DELETE RESTRICT | Hồ sơ liên quan |
| package | text | NOT NULL, CHECK in (full\_box, tag\_only) | Gói sản phẩm (FR-26) |
| status | text | NOT NULL, mặc định received | received, preparing, issued, delivered |
| status\_changed\_at | timestamptz | NOT NULL | Thời điểm đổi trạng thái gần nhất |
| note | text | NULL | Ghi chú của admin, tối đa 1.000 ký tự (UC-18) |
| created\_at | timestamptz | NOT NULL | Ngày tạo đơn |

#### scan\_logs

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | bigint | PK, identity | Thứ tự ghi |
| qr\_tag\_id | uuid | FK qr\_tags, NULL | Trống khi token không tồn tại |
| scanned\_at | timestamptz | NOT NULL, mặc định now() | Thời điểm quét |
| result | text | NOT NULL | ok, not\_found, locked, replaced hoặc archived |
| ip\_hash | text | NOT NULL | IP đã băm có muối, không lưu IP thô (FR-33) |
| user\_agent | text | NULL | User-agent đã rút gọn |

#### audit\_logs

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| id | bigint | PK, identity | Thứ tự ghi |
| admin\_id | uuid | FK admin\_users, NOT NULL | Người thực hiện |
| action | text | NOT NULL | create, update, lock, unlock, reissue, archive, restore, memorial hoặc password\_change (FR-35) |
| target\_type | text | NOT NULL | pet, qr\_tag, order ... |
| target\_id | uuid | NOT NULL | Đối tượng bị tác động |
| created\_at | timestamptz | NOT NULL, mặc định now() | Thời điểm |

#### site\_settings

| Cột | Kiểu | Ràng buộc | Mô tả |
| --- | --- | --- | --- |
| key | text | PK | Khóa cài đặt, ví dụ zalo\_url, messenger\_url (FR-02) |
| value | text | NOT NULL | Giá trị cài đặt |
| updated\_at | timestamptz | NOT NULL | Lần sửa gần nhất |

Bảng site\_settings không có khóa ngoại nên không vẽ trong sơ đồ ERD; tổng cộng có 13 bảng (thêm admin\_sessions so với v1; video\_links đổi tên thành videos). Sơ đồ ERD nhúng phía trên vẫn là bản v1, cần vẽ lại.

### 14.3 Chỉ mục và ràng buộc bổ sung

| Đối tượng | Chỉ mục / ràng buộc | Lý do |
| --- | --- | --- |
| qr\_tags | UNIQUE (token) | Đường tra cứu nhanh nhất khi quét QR (FR-28) |
| qr\_tags | UNIQUE (pet\_id) WHERE status <> 'replaced' | Mỗi hồ sơ chỉ có một mã đang dùng hoặc bị khóa (FR-25) |
| media\_assets | UNIQUE (pet\_id) WHERE is\_cover | Tối đa một ảnh đại diện |
| media\_assets | INDEX (pet\_id, sort\_order) | Hiển thị ảnh theo thứ tự |
| videos | INDEX (pet\_id, sort\_order) | Hiển thị video theo thứ tự |
| admin\_sessions | UNIQUE (token\_hash); INDEX (admin\_id); INDEX (expires\_at) | Kiểm tra phiên mỗi request, hủy phiên khác, dọn phiên hết hạn |
| pets | INDEX (owner\_id); INDEX (status, created\_at DESC) | Danh sách và lọc theo trạng thái (FR-12) |
| pets, owners | GIN pg\_trgm trên pets.name, owners.full\_name; INDEX owners (phone) | Tìm kiếm theo tên và số điện thoại (FR-12) |
| scan\_logs | INDEX (qr\_tag\_id, scanned\_at DESC); INDEX (scanned\_at) | Thống kê lượt quét 7 ngày (FR-27) |
| orders | INDEX (status); INDEX (pet\_id) | Đếm đơn theo trạng thái (FR-27) |
| audit\_logs | INDEX (target\_type, target\_id, created\_at DESC) | Xem lịch sử của một đối tượng |

### 14.4 Quy tắc toàn vẹn dữ liệu

- Không xóa vật lý hồ sơ, chủ nuôi, mã QR và đơn hàng; chỉ lưu trữ hoặc đổi trạng thái. Khóa ngoại dùng ON DELETE RESTRICT để chặn xóa nhầm.
- Mã replaced không được đổi lại thành active (FR-24); token không bao giờ được tái sử dụng.
- Các giá trị liệt kê (status, package, provider, result, action) được ràng buộc bằng CHECK hoặc enum của Prisma.
- Sinh mã thẻ bằng sequence của Postgres, không lấy MAX + 1, để an toàn khi hai admin lưu cùng lúc.
- Storage chia hai bucket: pet-media (ảnh, video, ảnh bìa của hồ sơ, đọc công khai, đường dẫn tệp chứa uuid ngẫu nhiên) và uploads-tmp (ảnh đại diện tải lên trước khi hồ sơ được lưu, dọn tệp quá 24 giờ). Chỉ máy chủ giữ service key để cấp URL tải lên có chữ ký.

## 15. Thiết kế giao diện (UI)

Bản thiết kế đã dựng thành artifact “Pet Memory Box MVP” gồm ba màn: Landing page, Digital Memory (màn hình điện thoại khi quét QR) và trang admin đăng ký thú cưng có sidebar. Các màn còn lại sẽ dùng cùng hệ màu, chữ và thành phần.

### 15.1 Sơ đồ trang (sitemap)

&#91;embedded content: sitemap · 4 màn công khai, 9 màn admin\]

### 15.2 Danh sách màn hình

| Mã | Màn hình | Đường dẫn | Thiết kế | UC | FR |
| --- | --- | --- | --- | --- | --- |
| S-01 | Landing page | / | Đã có (Landing page) | UC-01, UC-02 | FR-01, FR-02 |
| S-02 | Digital Memory mẫu | /demo | Dùng bố cục S-03 với dữ liệu giả, chưa vẽ riêng | UC-01 | FR-03 |
| S-03 | Digital Memory khi quét QR | /p/\[token\] | Đã có (Digital Memory); biến thể tưởng niệm chưa vẽ | UC-19, UC-20 | FR-28 đến FR-30, FR-32, FR-34, FR-36 |
| S-04 | Thông báo mã không hợp lệ | /p/\[token\] trả 404 | Chưa vẽ | UC-21 | FR-31 |
| A-01 | Đăng nhập admin | /admin/login | Chưa vẽ | UC-03 | FR-04, FR-05, FR-08 |
| A-02 | Tổng quan | /admin | Chưa vẽ (mục sidebar đã có) | UC-23 | FR-27 |
| A-03 | Đăng ký mới | /admin/pets/new | Đã có (Admin: đăng ký thú cưng) | UC-06, UC-14 | FR-09 đến FR-11 |
| A-04 | Danh sách hồ sơ | /admin/pets | Chưa vẽ (có bảng hồ sơ gần đây trong A-03) | UC-07 | FR-12 |
| A-05 | Chi tiết hồ sơ | /admin/pets/\[id\] | Chưa vẽ | UC-08 đến UC-13 | FR-13 đến FR-21 |
| A-06 | Mã QR đã phát hành | /admin/qr | Chưa vẽ (có lưới QR trong A-03) | UC-15 đến UC-17 | FR-23 đến FR-25 |
| A-07 | Đơn hàng hộp kỷ vật | /admin/orders | Chưa vẽ | UC-18 | FR-26 |
| A-08 | Cài đặt trang web | /admin/settings | Chưa vẽ | UC-02 | FR-02 |
| A-09 | Tài khoản admin | /admin/account | Chưa vẽ | UC-04, UC-05 | FR-06, FR-07 |

A-05 dùng các tab: Thông tin, Hiển thị công khai, Ảnh, Video, Kỷ niệm, Mã QR và đơn hàng; nút "Chuyển sang trang tưởng niệm" nằm ở tab Thông tin.

Sửa bản thiết kế A-03 cho khớp v2:

- Đường dẫn xem trước đổi từ [TÊN MIỀN]/p/PMB-000129 thành {SITE\_URL}/p/{token}; mã thẻ chỉ hiển thị riêng.
- Thêm ô Khu vực (cột area của owners), lựa chọn "Bé đang sống / Bé đã mất" và ô Ngày mất, ô Ghi chú đơn hàng.
- Bỏ khối "Thư viện ảnh", "Liên kết video" và "Câu chuyện, kỷ niệm"; thay bằng dòng hướng dẫn "Thêm ảnh, video và kỷ niệm sau khi lưu".
- Khối hiển thị công khai có 8 công tắc, tách "Ảnh và video" với "Kỷ niệm".

### 15.3 Luồng điều hướng chính

- Khách xem S-01, bấm nút nhắn Zalo hoặc Messenger để chat riêng với admin (ngoài hệ thống).
- Admin đăng nhập A-01, vào A-03 nhập hồ sơ theo nội dung chat, lưu để hệ thống sinh mã thẻ và QR.
- Admin tải PNG hoặc SVG của QR, in lên mặt vòng, tiếp tục bổ sung ảnh, video, kỷ niệm ở A-05.
- Người nhặt được thú cưng quét QR và mở S-03; mã sai, bị khóa hoặc đã thay thế mở S-04.

### 15.4 Nguyên tắc giao diện

- Tone màu be làm nền, kết hợp xanh rêu (sage) và hồng đào (peach) làm màu nhấn, lấy từ mẫu infographic của sản phẩm.
- Không dùng icon kiểu bộ icon hàng loạt; biểu tượng là logo dấu chân và hình minh họa vẽ riêng dạng SVG.
- Chữ: Baloo 2 cho tiêu đề, Be Vietnam Pro cho nội dung, Patrick Hand cho điểm nhấn viết tay.
- Trang công khai thiết kế cho màn hình điện thoại (rộng 390 px), nút Gọi và Nhắn tin luôn ở đầu trang.
- Trang admin thiết kế cho máy tính, luôn có sidebar bên trái với các mục: Tổng quan, Hồ sơ thú cưng, Đăng ký mới, Mã QR đã phát hành, Đơn hàng hộp kỷ vật, Cài đặt trang web, Tài khoản admin, Đăng xuất.

## 16. Đặc tả API

### 16.1 Quy ước chung

- API là Route Handler của Next.js chạy trên Vercel Functions, dữ liệu JSON UTF-8, thời gian theo ISO 8601 (UTC).
- Mọi đường dẫn /api/admin/\* cần cookie phiên httpOnly; thiếu hoặc hết hạn trả 401 (FR-08). Riêng /api/auth/login và /api/public/\* không cần phiên.
- Lỗi dùng chung một dạng: `{ "error": { "code": "validation_failed", "message": "...", "fields": { "phone": "Bắt buộc" } } }`; trường fields chỉ có khi lỗi dữ liệu.
- Mã trạng thái: 200, 201, 204 thành công; 400 dữ liệu sai; 401 chưa đăng nhập; 404 không tìm thấy (kể cả mã đã khóa, thay thế, hồ sơ lưu trữ ở API công khai); 409 xung đột phiên bản hoặc trạng thái; 422 vượt giới hạn nghiệp vụ; 429 quá nhiều yêu cầu.
- {id} là uuid nội bộ của bảng tương ứng; \[token\] là token công khai 22 ký tự của mã QR, khác với mã thẻ PMB-xxxxxx in trên thẻ.

### 16.2 Danh sách API

| Mã | Phương thức và đường dẫn | Mô tả | Phản hồi chính | FR |
| --- | --- | --- | --- | --- |
| API-01 | POST /api/auth/login | Nhận email, password; đặt cookie phiên 8 giờ | 200; 401 sai thông tin; 429 khi đang bị khóa 15 phút | FR-04, FR-05 |
| API-02 | POST /api/auth/logout | Hủy phiên | 204 | FR-06 |
| API-03 | POST /api/admin/account/password | Nhận currentPassword, newPassword (từ 8 ký tự); hủy các phiên khác | 204; 400; 401 | FR-07 |
| API-04 | GET /api/admin/pets | Tham số q, status, qrStatus, page; 20 dòng mỗi trang | 200 { items, page, pageSize, total } | FR-12 |
| API-05 | POST /api/admin/pets | Tạo hồ sơ gồm owner, pet, visibility, order (package, note), coverStorageKey tùy chọn; sinh mã thẻ, token; tạo đơn hàng | 201 { id, cardNo, token, qrUrl, orderId }; 400 | FR-09 đến FR-11, FR-26, FR-35 |
| API-06 | GET /api/admin/pets/{id} | Chi tiết hồ sơ kèm QR, ảnh, video, kỷ niệm, cấu hình, đơn, lịch sử mã | 200; 404 | FR-13 |
| API-07 | PATCH /api/admin/pets/{id} | Sửa thông tin bé và chủ nuôi, kèm version hiện tại | 200; 400; 409 khi version cũ | FR-14 |
| API-08 | PUT /api/admin/pets/{id}/visibility | Lưu 8 cờ hiển thị; làm mới cache trang công khai | 200 | FR-15 |
| API-09 | POST /api/admin/pets/{id}/preview | Nhận cấu hình chưa lưu, trả dữ liệu trang công khai tương ứng | 200 | FR-16 |
| API-10 | POST /api/admin/pets/{id}/archive và /restore | Lưu trữ hoặc khôi phục hồ sơ | 204 | FR-17 |
| API-11 | POST /api/admin/pets/{id}/photos/upload-url | Nhận mimeType, sizeBytes; kiểm tra JPEG, PNG, WebP ≤ 5 MB, tối đa 30 ảnh; trả URL tải lên có chữ ký | 200 { uploadUrl, storageKey }; 400; 422 | FR-18 |
| API-12 | POST /api/admin/pets/{id}/photos | Xác nhận ảnh đã tải lên bằng storageKey, caption | 201 | FR-18 |
| API-13 | PATCH, DELETE /api/admin/photos/{photoId} | Sửa caption, sortOrder, isCover; xóa ảnh và đối tượng trong kho | 200; 204 | FR-19 |
| API-14 | POST /api/admin/pets/{id}/videos/upload-url; POST /api/admin/pets/{id}/videos; PATCH, DELETE /api/admin/videos/{videoId} | upload-url nhận mimeType, sizeBytes, durationSec, kiểm tra giới hạn và trả URL có chữ ký cho video và ảnh bìa; POST tạo bản ghi (source upload kèm storageKey, posterKey; hoặc source youtube/vimeo kèm url); PATCH sửa title, sortOrder; DELETE xóa bản ghi và tệp | 200 { videoUploadUrl, videoKey, posterUploadUrl, posterKey }; 201; 200; 204; 400; 422 | FR-20 |
| API-15 | POST /api/admin/pets/{id}/memories; PATCH, DELETE /api/admin/memories/{memoryId} | Quản lý kỷ niệm (title, memoryDate, content) | 201; 200; 204 | FR-21 |
| API-16 | GET /api/admin/pets/{id}/qr?format=png\|svg | Trả ảnh QR; PNG 1024 x 1024; tên tệp theo mã thẻ | 200 image/png hoặc image/svg+xml | FR-22, FR-23 |
| API-17 | POST /api/admin/qr/{qrId}/lock | Khóa mã kèm reason | 200; 409 nếu mã đã replaced | FR-24 |
| API-18 | POST /api/admin/qr/{qrId}/unlock | Mở khóa, đưa mã về active | 200; 409 nếu mã đã replaced | FR-24 |
| API-19 | POST /api/admin/pets/{id}/reissue | Phát hành lại: token mới, mã cũ thành replaced | 200 { token, qrUrl } | FR-25 |
| API-20 | GET, POST /api/admin/orders; PATCH /api/admin/orders/{orderId} | Danh sách, tạo đơn, đổi gói và trạng thái | 200; 201 | FR-26 |
| API-21 | GET /api/admin/dashboard | Số hồ sơ, mã active, lượt quét 7 ngày, đơn theo trạng thái, 5 hồ sơ mới nhất | 200 | FR-27 |
| API-22 | GET /api/public/pets/\[token\] | Dữ liệu trang công khai đã lọc theo cấu hình và chế độ hồ sơ; không cần đăng nhập; trang /p/\[token\] gọi cùng dịch vụ này | 200; 404; 429 | FR-28 đến FR-34, FR-36 |
| API-23 | GET, PUT /api/admin/settings | Đọc và lưu liên kết Zalo, Messenger cho landing page | 200 | FR-02 |
| API-24 | PUT /api/admin/pets/{id}/life-status | Nhận lifeStatus (alive, memorial), passedDate, tagline; tắt nút gọi khi chuyển sang memorial; làm mới cache | 200; 400 | FR-36, FR-35 |
| API-25 | POST /api/admin/uploads/cover-url | Cấp URL có chữ ký để tải ảnh đại diện vào bucket uploads-tmp trước khi hồ sơ được tạo | 200 { uploadUrl, storageKey }; 400 | FR-09, FR-18 |

### 16.3 Ví dụ hợp đồng chính

API-05, tạo hồ sơ (rút gọn):

```json
// POST /api/admin/pets
{
  "owner": { "fullName": "...", "phone": "...", "area": "...", "address": "..." },
  "pet": { "name": "...", "species": "...", "breed": "...", "tagline": "...", "lifeStatus": "alive", "passedDate": null },
  "visibility": { "showCallButton": true, "showPhone": true, "showAddress": false, "showMedia": true, "showMemories": true },
  "order": { "package": "full_box", "note": "..." },
  "coverStorageKey": "<khóa trong uploads-tmp, tùy chọn>"
}
// 201
{ "id": "<uuid>", "cardNo": "PMB-000129", "token": "<22 ký tự base62>", "qrUrl": "<SITE_URL>/p/<token>", "orderId": "<uuid>" }
```

API-22, dữ liệu công khai: chỉ trả những mục đang bật; mục tắt không xuất hiện trong JSON chứ không chỉ bị ẩn ở giao diện.

```json
// GET /api/public/pets/<token>  → 200
{
  "name": "...", "tagline": "...", "species": "...", "breed": "...", "gender": "...",
  "lifeStatus": "alive", "birthDate": "...", "passedDate": null,
  "coverUrl": "...",
  "photos": [ { "url": "...", "caption": "..." } ],
  "videos": [
    { "source": "upload", "url": "...", "posterUrl": "...", "title": "..." },
    { "source": "youtube", "url": "...", "title": "..." }
  ],
  "memories": [ { "title": "...", "date": "...", "content": "..." } ],
  "contact": { "callButton": true, "phone": "...", "area": "..." }
}
// 404 { "error": { "code": "tag_unavailable", "message": "Mã này hiện không khả dụng" } }
```

Phản hồi 404 giống hệt nhau cho mọi lý do và không chứa bất kỳ thông tin nào về thú cưng hay chủ nuôi (FR-31).

## 17. Ma trận truy vết và phụ lục

### 17.1 Truy vết tính năng, use case, yêu cầu, API và màn hình

| Tính năng | Use case | Yêu cầu chức năng | API | Màn hình |
| --- | --- | --- | --- | --- |
| F-01 Landing page | UC-01 | FR-01 |  | S-01 |
| F-02 Nhắn tin Zalo/Messenger | UC-02 | FR-02 | API-23 | S-01, A-08 |
| F-03 Digital Memory mẫu | UC-01 | FR-03 |  | S-02 |
| F-04 Hỏi đáp | UC-01 | FR-01 |  | S-01 |
| F-05 Đăng nhập admin | UC-03 | FR-04, FR-05, FR-08 | API-01 | A-01 |
| F-06 Đăng xuất | UC-04 | FR-06 | API-02 | Sidebar, A-09 |
| F-07 Đổi mật khẩu | UC-05 | FR-07 | API-03 | A-09 |
| F-08 Tạo hồ sơ | UC-06 | FR-09, FR-10 | API-05 | A-03 |
| F-09 Danh sách, tìm kiếm, lọc | UC-07 | FR-12 | API-04 | A-04 |
| F-10 Chi tiết hồ sơ | UC-08 | FR-13 | API-06 | A-05 |
| F-11 Chỉnh sửa hồ sơ | UC-09 | FR-10, FR-14 | API-07 | A-05 |
| F-12 Cấu hình hiển thị | UC-10 | FR-15, FR-16 | API-08, API-09 | A-05 |
| F-13 Lưu trữ, khôi phục | UC-11 | FR-17 | API-10 | A-05 |
| F-14 Quản lý ảnh | UC-12 | FR-18, FR-19 | API-11, API-12, API-13 | A-05 |
| F-15 Quản lý video | UC-13 | FR-20 | API-14 | A-05 |
| F-16 Kỷ niệm | UC-13 | FR-21 | API-15 | A-05 |
| F-17 Sinh mã thẻ, token, QR | UC-14 | FR-11, FR-35 | API-05 | A-03 |
| F-18 Tải mã QR | UC-14, UC-15 | FR-22, FR-23 | API-16 | A-03, A-06 |
| F-19 Khóa, mở khóa mã | UC-16 | FR-24 | API-17, API-18 | A-05, A-06 |
| F-20 Phát hành lại mã | UC-17 | FR-25 | API-19 | A-05, A-06 |
| F-21 Gói sản phẩm, đơn hàng | UC-18 | FR-26 | API-20 | A-07 |
| F-22 Hiển thị Digital Memory theo mã | UC-19 | FR-28, FR-32, FR-34 | API-22 | S-03 |
| F-23 Gọi, nhắn tin chủ nuôi | UC-20 | FR-30 | API-22 | S-03 |
| F-24 Tab nội dung | UC-19 | FR-29 | API-22 | S-03 |
| F-25 Thông báo mã không hợp lệ | UC-21 | FR-31 | API-22 | S-04 |
| F-26 Ghi nhận lượt quét | UC-22 | FR-33 | API-22 | S-03 |
| F-27 Dashboard thống kê | UC-23 | FR-27 | API-21 | A-02 |
| F-28 Chế độ tưởng niệm | UC-24, UC-19 | FR-36 | API-24, API-22 | A-05, S-03 |

FR-35 (nhật ký thao tác admin) áp dụng cho các thao tác ghi từ UC-05 đến UC-17 và UC-24 nên không lặp lại ở từng dòng. FR-37 (tên miền gốc và chuyển hướng) áp dụng cho mọi đường dẫn công khai. Các yêu cầu phi chức năng (NFR-01 đến NFR-17) áp dụng chung cho toàn hệ thống, xem mục 11.

### 17.2 Câu hỏi đã chốt (v2)

- Đối tượng: cả thú cưng đang sống và đã mất (D-01).
- Cơ sở dữ liệu và kho tệp: Supabase (D-02).
- Video: cho tải lên trực tiếp, vẫn nhận link YouTube/Vimeo (D-03).
- Xác thực admin: tự viết (D-04).
- Tên miền: giai đoạn đầu dùng *.vercel.app; tên miền riêng mua khi mở rộng sản phẩm vòng tay, tên miền cũ chuyển hướng vĩnh viễn (D-05, FR-37).

### 17.3 Câu hỏi còn mở

- Tên dự án Vercel (quyết định tên miền *.vercel.app in trên các vòng đầu tiên, không đổi được về sau).
- Có cần chuyển mã video tự động (Mux, Cloudflare Stream) ở giai đoạn sau không.
- Giá và mô tả gói "Chỉ vòng cổ QR" cho mục hỏi đáp trên landing page.

### 17.4 Giả định khi soạn tài liệu

- RDS được hiểu là tài liệu yêu cầu nghiệp vụ (Phần I) và SRS là đặc tả yêu cầu phần mềm (Phần II), gộp trong một tài liệu.
- Giá trị mặc định của 8 cờ hiển thị, tên cột và kiểu dữ liệu ở mục 14 là đề xuất thiết kế, có thể điều chỉnh khi lập trình.
- Chưa có thanh toán trực tuyến: khách nhắn tin riêng, admin nhập hồ sơ và quản lý đơn thủ công.
