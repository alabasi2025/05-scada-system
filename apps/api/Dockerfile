# =============================================
# نظام SCADA - API Dockerfile
# =============================================

# المرحلة 1: البناء
FROM node:20-alpine AS builder

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات التبعيات
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# تثبيت التبعيات
RUN pnpm install --frozen-lockfile

# نسخ الكود المصدري
COPY . .

# توليد Prisma Client
RUN npx prisma generate

# بناء التطبيق
RUN pnpm nx build api --prod

# المرحلة 2: التشغيل
FROM node:20-alpine AS runner

WORKDIR /app

# إنشاء مستخدم غير root للأمان
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# نسخ الملفات المطلوبة من مرحلة البناء
COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# تغيير المالك
RUN chown -R nestjs:nodejs /app

# التبديل للمستخدم غير root
USER nestjs

# تعريف المتغيرات البيئية
ENV NODE_ENV=production
ENV PORT=3000

# فتح المنفذ
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# تشغيل التطبيق
CMD ["node", "dist/main.js"]
