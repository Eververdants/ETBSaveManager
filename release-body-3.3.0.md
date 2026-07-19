We're excited to announce **v3.3.0** — a major UI & intelligence overhaul with smarter search, pinyin fuzzy matching, paginated lazy loading, and a brand-new adaptive resource scheduler.

---

## ✨ What's New

### 🔍 Pinyin Fuzzy Search & Suggestions (拼音模糊搜索与搜索建议)
- Search your archives by pinyin initials or full pinyin — find saves faster even with hundreds of entries.
- Real-time search suggestions as you type.

### ⚡ Revamped Quick-Create Flow (重构快速创建存档流程)
- Streamlined step-by-step archive creation with clearer options and smoother navigation.

### 📜 Paginated Lazy Loading (分页懒加载)
- Archive lists now load on demand as you scroll — snappier startup and lower memory footprint on large libraries.

---

## 🔧 Improvements & Under the Hood

### 🎨 Continuous-Curvature Corner System (全局连续曲率圆角重构)
- Global rounded-corner system rebuilt with iOS-style continuous curvature (squircle) and a concentric 8px-decrement design (52→44→36→28→20→12).
- SVG alpha-mask polyfill for smooth, anti-aliased corners on every WebView version — no more hard edges.

### 🌗 Theme Refresh (重制浅色与深色主题)
- Refined light and dark themes for better contrast and visual comfort.

---

## 🐛 Bug Fixes
- Fixed squircles degrading to plain rounded corners or hard edges in production builds (polyfill now uses per-element SVG alpha mask with resize tracking).
- Fixed pill-shaped / circular elements incorrectly being clipped into squares by the corner polyfill.
- Fixed polyfill not applying to elements added to the DOM after initial scan (timing race).
- Various other bug fixes.

---

## ⚡ Performance
- New **Smart Resource Scheduler** (智能资源调度系统): dynamic CPU/memory allocation and adaptive animation quality tuning tuned to your machine.
- Additional under-the-hood performance optimizations.

---

## 🌍 Localization
- English
- Simplified Chinese (简体中文)
- Traditional Chinese (繁體中文)

---

## 📥 Download Now
👉 **Download v3.3.0**: [https://github.com/Eververdants/ETBSaveManager/releases/tag/v3.3.0](https://github.com/Eververdants/ETBSaveManager/releases/tag/v3.3.0)

Give it a try and let us know what you think!
