# P2Lan Transfer - Nghiên cứu chi tiết dự án

## Tổng quan dự án

**P2Lan Transfer** là một ứng dụng chuyển file peer-to-peer (P2P) đa nền tảng được phát triển bởi TrongAJTT, cho phép chia sẻ file trực tiếp qua mạng LAN mà không cần server trung gian.

- **Repository**: https://github.com/TrongAJTT/p2lan-transfer
- **Website demo**: https://trongajtt.github.io/p2lan-transfer/
- **License**: GPL-3.0
- **Stars**: 21 ⭐
- **Forks**: 9 🍴
- **Ngôn ngữ chính**: Dart (84.1%)

## Động lực phát triển

Tác giả đã tạo ra ứng dụng này để giải quyết các vấn đề thực tế khi chuyển file giữa các thiết bị:

### Vấn đề gặp phải:
1. **Sử dụng cáp USB**: Nhanh nhưng phải thao tác trên laptop, không trực quan
2. **Ứng dụng bên thứ 3** (Telegram, WhatsApp): Khó khăn khi gửi nhiều file, chất lượng bị nén
3. **Cloud storage** (Google Drive, OneDrive): Tiện lợi nhưng phải xóa sau khi dùng

### Giải pháp:
Tạo ra một "Cổng thần bí" (Mystical Gateway) cho phép chuyển file trực tiếp, nhanh chóng, chất lượng cao mà không cần trung gian.

## Tính năng chính

### 📁 Chuyển file (File Transfer)
- **Chia sẻ P2P trực tiếp**: Gửi file trực tiếp giữa các thiết bị cùng mạng
- **Hỗ trợ nhiều file**: Chia sẻ nhiều file cùng lúc
- **Khả năng tiếp tục**: Tiếp tục transfer bị gián đoạn
- **Lịch sử transfer**: Theo dõi các lần chuyển file gần đây

### 💬 Chat cơ bản (Basic Chat)
- **Nhắn tin đơn giản**: Gửi tin nhắn text giữa các thiết bị kết nối
- **Đồng bộ clipboard**: Tự động chia sẻ nội dung clipboard
- **Chia sẻ media**: Gửi hình ảnh qua chat với preview
- **Tùy chỉnh chat**: Cấu hình chia sẻ clipboard và tự động xóa

### 🔧 Cài đặt nâng cao (Advanced Settings)
- **Tùy chọn bảo mật**: Lựa chọn không mã hóa, AES-GCM, hoặc ChaCha20-Poly1305
- **Cài đặt nén**: Giảm thời gian transfer với nén có thể cấu hình
- **Cấu hình mạng**: Tùy chỉnh network discovery và transfer settings
- **Giao diện người dùng**: Chuyển đổi giữa layout thường và compact

### 🎨 Trải nghiệm người dùng (User Experience)
- **Thiết kế responsive**: Thích ứng với các kích thước màn hình khác nhau
- **Hỗ trợ theme**: Light, dark, và system theme
- **Đa ngôn ngữ**: Tiếng Anh và tiếng Việt
- **Lưu cài đặt**: Preferences được lưu tự động

## Hỗ trợ nền tảng

### 🖥️ Windows
- Windows 10 (1903) trở lên
- Hỗ trợ kiến trúc 64-bit

### 📱 Android
- Android 7.0 (API 24) trở lên
- Hỗ trợ kiến trúc ARM64/ARMv7

**Lưu ý**: Trên Android, cần restart app sau lần chạy đầu tiên để chat function hoạt động đúng.

## Công nghệ sử dụng

- **Flutter**: Framework UI đa nền tảng
- **Isar Database**: Lưu trữ dữ liệu local cho settings và chat history
- **Dart Isolates**: Xử lý background cho file transfers
- **UDP/TCP**: Giao thức giao tiếp mạng
- **Material Design 3**: Components UI hiện đại

## Cấu trúc dự án

```
lib/
├── main.dart                    # App entry point
├── controllers/                 # P2P and state management
├── models/                      # Data models and schemas
├── services/                    # Core services (P2P, settings, etc.)
├── screens/                     # App screens and UI
├── widgets/                     # Reusable UI components
├── layouts/                     # Layout components
├── utils/                       # Helper functions
└── l10n/                        # Localization files
```

## Hướng dẫn sử dụng

### Cho người dùng:
1. Tải phiên bản phù hợp cho nền tảng của bạn
2. Cài đặt và chạy ứng dụng
3. Đảm bảo các thiết bị cùng mạng LAN
4. Bắt đầu chia sẻ file và chat!

### Cho developers:
```bash
# Clone repository
git clone https://github.com/TrongAJTT/p2lan-transfer.git
cd p2lan-transfer

# Cài đặt dependencies
flutter pub get

# Generate required code
dart run build_runner build

# Chạy trên nền tảng mong muốn
flutter run
```

## Phân tích kỹ thuật

### Điểm mạnh:
1. **Không cần server**: Hoạt động hoàn toàn P2P
2. **Đa nền tảng**: Flutter cho phép deploy trên nhiều platform
3. **Bảo mật**: Hỗ trợ nhiều phương thức mã hóa
4. **Hiệu suất**: Sử dụng Dart Isolates cho background processing
5. **UX tốt**: Material Design 3, responsive, đa ngôn ngữ

### Hạn chế:
1. **Chỉ hỗ trợ 2 nền tảng**: Windows và Android (chưa có iOS, macOS, Linux)
2. **Cần cùng mạng LAN**: Không thể hoạt động qua internet
3. **Android bug**: Cần restart sau lần chạy đầu tiên

### Cơ hội phát triển:
1. **Mở rộng nền tảng**: iOS, macOS, Linux, Web
2. **Tính năng mới**: Video call, screen sharing, remote desktop
3. **Cải thiện UX**: Tự động discovery, QR code pairing
4. **Enterprise features**: User management, audit logs

## Đánh giá tổng thể

**P2Lan Transfer** là một dự án có ý tưởng tốt và giải quyết được vấn đề thực tế. Việc sử dụng Flutter cho phép phát triển nhanh và đa nền tảng. Tuy nhiên, dự án vẫn còn ở giai đoạn đầu với một số hạn chế về tính năng và platform support.

### Điểm số:
- **Ý tưởng**: 9/10
- **Thực hiện**: 7/10
- **Tính năng**: 6/10
- **UX/UI**: 8/10
- **Tiềm năng**: 8/10

**Tổng điểm**: 7.6/10

## Kết luận

P2Lan Transfer là một dự án đầy tiềm năng cho việc chia sẻ file P2P trong mạng LAN. Với sự phát triển thêm về tính năng và platform support, đây có thể trở thành một giải pháp hữu ích cho nhiều người dùng.

---

*Báo cáo nghiên cứu được thực hiện vào ngày: $(date)*
*Nguồn: https://github.com/TrongAJTT/p2lan-transfer*
