#!/bin/bash
# 병뚜껑 성장 캐릭터 시스템 로컬 실행 스크립트

echo "=== 병뚜껑 성장 캐릭터 시스템 시작 ==="

# Docker Compose로 전체 실행
if command -v docker &> /dev/null; then
  echo "[1] Docker Compose로 전체 서비스 실행 중..."
  docker-compose up --build -d
  echo ""
  echo "서비스 실행 완료!"
  echo "  - 프론트엔드: http://localhost:3000"
  echo "  - 백엔드 API: http://localhost:4000"
  echo "  - DB:         localhost:5432"
  echo ""
  echo "로그 확인: docker-compose logs -f"
  echo "종료:      docker-compose down"
else
  echo "[!] Docker가 설치되어 있지 않습니다. 수동 실행 방법:"
  echo ""
  echo "1. PostgreSQL 실행 후 DB 생성:"
  echo "   createdb bottle_cap"
  echo "   psql bottle_cap < backend/src/db/schema.sql"
  echo ""
  echo "2. 백엔드 실행:"
  echo "   cd backend && npm install && npm run dev"
  echo ""
  echo "3. 프론트엔드 실행:"
  echo "   cd frontend && npm install && npm run dev"
fi
