# 🌿 Life Upupup

> 一个高度模块化的个人生活自我管理平台 · v1.0

---

## 📌 简介

Life Upupup 是一款专为个人打造的生活管理工具，帮助你系统地记录和追踪生活的方方面面——读书、纪录片、身材、饮食、理财、股票学习、语言学习……

这是 **v1.0 基础版本**，核心功能已全部就绪。更多功能正在路上，敬请期待 🚀

---

## ✨ 当前功能

| 模块 | 功能 |
|------|------|
| 🏠 首页仪表盘 | 今日数据汇总、本月概览、各模块最新动态 |
| ✅ 今日任务 | 手动添加每日任务，勾选完成 |
| 📚 读书 | 书单管理、阅读状态、评分、心得、自动记录最后阅读时间 |
| 🎬 纪录片 | 观影记录、状态追踪、视频链接跳转 |
| ⚖️ 身材管理 | 体重 & 围度记录、折线图趋势 |
| 🥗 饮食管理 | 三餐记录、饮水打卡、营养素手动录入 |
| 💰 理财管理 | 收支流水（JPY / USD / CNY 多币种）、资产总览、实时汇率换算、支出分类图表 |
| 📈 股票学习 | 持仓追踪、观察池（含每日高低点时间）、学习笔记 |
| 🇯🇵 日语学习 | 每日打卡、日历视图、学习目标、资源收藏 |
| 🇬🇧 英语学习 | 与日语模块同结构 |

---

## 🛠️ 技术栈

- **后端**：Python · FastAPI · SQLAlchemy · SQLite
- **前端**：React · TypeScript · Vite · Recharts
- **数据**：yfinance（股票）· Frankfurter API（汇率）

---

## 🚀 安装 & 启动

### 环境要求

- Python 3.9+
- Node.js 18+

### 第一步：安装后端依赖

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 第二步：安装前端依赖

```bash
cd frontend
npm install
```

### 第三步：启动

**方式一（推荐）：一键启动**

直接双击项目根目录下的 `启动.command`（macOS）

**方式二：手动启动**

打开两个终端分别运行：

```bash
# 终端 1 — 后端
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 终端 2 — 前端
cd frontend
npm run dev
```

启动后在浏览器打开：**http://localhost:5173**

---

## 📁 项目结构

```
life-upupup/
├── backend/
│   ├── main.py          # FastAPI 入口
│   ├── database.py      # 数据库配置
│   ├── models/          # 数据表模型
│   ├── routers/         # API 路由
│   └── start.sh         # 后端启动脚本
├── frontend/
│   └── src/
│       ├── pages/       # 各模块页面
│       ├── components/  # 通用组件
│       └── api/         # 接口请求
├── inception/           # 需求文档
├── prototype/           # 画面原型
└── 启动.command         # 一键启动（macOS）
```

---

## 🔮 即将到来

- 🤖 **AI 智能功能**：每日任务自动生成、营养素智能计算、股票学习分析、笔记整理
- 📊 **更丰富的图表**：资产变化曲线、年度收支对比、学习时长热力图
- 📱 **移动端优化**：底部导航、触屏交互优化
- 🌙 **深色模式**
- 🗂️ **数据导出**

---

## 📝 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-13 | 基础版本发布，10 个核心模块全部就绪 |

---

*持续更新中，敬请期待 ✨*
