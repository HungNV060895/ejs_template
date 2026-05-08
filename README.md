# Gulp Build System

Hệ thống build sử dụng Gulp 4+ với ES Modules, hỗ trợ phân tách môi trường **development** và **production**.

---

## Yêu cầu

- Node.js `>= 16`
- npm `>= 8`

---

## Cài đặt

```bash
npm install
```

Nếu chưa có `cross-env`, cài thêm:

```bash
npm install --save-dev cross-env
```

---

## Cấu hình `package.json`

Thêm các script sau vào `package.json`:

```json
{
  "scripts": {
    "dev":   "cross-env NODE_ENV=development npx gulp dev",
    "build": "cross-env NODE_ENV=production npx gulp build"
  }
}
```

---

## Cách dùng

### Khi phát triển (Development)

```bash
npm run dev
hoặc
npx gulp dev
```

Khởi động watch mode. Các file được theo dõi tự động, ảnh **không** tối ưu để tăng tốc độ.

### Khi build ra Production

```bash
npm run build
```

Chạy toàn bộ task bao gồm tối ưu ảnh và WebP. Không bật watch.

---

## So sánh Dev vs Production

| Task | `npm run dev` | `npm run build` |
|---|---|---|
| EJS → HTML | ✅ prettify (dễ đọc) | ✅ minify (nén nhỏ) |
| Sass → CSS | ✅ có sourcemap | ✅ không có sourcemap |
| JS (main) | ✅ babel + terser | ✅ babel + terser |
| JS (vendors) | ✅ copy only | ✅ copy only |
| Image optimize | ❌ không chạy | ✅ chạy |
| WebP convert | ❌ không chạy | ✅ chạy |
| Watch | ✅ bật tự động | ❌ không watch |

---

## Tối ưu ảnh thủ công (khi đang dev)

Trong quá trình development, ảnh không được tự động xử lý. Chạy thủ công khi cần:

```bash
# Tối ưu ảnh raster (jpg / png / gif)
npx gulp imgRasterTask

# Tối ưu SVG
npx gulp imgSvgTask

# Tất cả ảnh (raster + SVG)
npx gulp imgTask

# Convert sang WebP
npx gulp webpTask
```

---

## Cấu trúc thư mục

```
project/
├── ejs/
│   ├── template.ejs
│   └── data/
│       └── pages.json
├── scss/
│   ├── style.scss          # file chính (được compile)
│   └── _partial.scss       # partial (bị bỏ qua, chỉ dùng để @use/@forward)
├── src/
│   └── js/
│       ├── main.js         # được babel + terser
│       └── vendors/        # copy only, không qua babel
├── src/img/                # ảnh nguồn
├── css/                    # output CSS
│   └── maps/               # sourcemap (chỉ có ở dev)
├── js/                     # output JS
├── img/                    # output ảnh đã tối ưu
│   └── webp/               # output WebP
├── gulpfile.js
└── package.json
```

---

## Lưu ý

- Sass partial (`_*.scss`) **không** được compile trực tiếp thành CSS. Chỉ dùng để `@use` hoặc `@forward` trong file chính.
- Sourcemap chỉ được xuất ra ở môi trường development, tránh lộ cấu trúc source ở production.
- `changed()` được áp dụng cho image task — chỉ xử lý file thay đổi, bỏ qua file đã tối ưu trước đó.
- `browserslist` được quản lý tập trung trong `package.json`, dùng chung cho cả Babel và Autoprefixer.
