#!/bin/bash

# 切换到脚本所在目录
cd "$(dirname "$0")"

echo "🌿 启动个人生活管理平台..."

# 启动后端
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端就绪
sleep 2

# 启动前端
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ 前端已启动 (PID: $FRONTEND_PID)"

# 等待前端就绪
sleep 3

# 打开浏览器
open http://localhost:5173

echo ""
echo "🚀 已在浏览器打开 http://localhost:5173"
echo "   关闭此窗口即可停止所有服务"
echo ""

# 等待，关闭窗口时清理进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止所有服务'" EXIT
wait
