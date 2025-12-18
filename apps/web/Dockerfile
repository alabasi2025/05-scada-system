# =============================================
# نظام SCADA - Web Frontend Dockerfile
# =============================================

# المرحلة 1: البناء
FROM node:20-alpine AS builder

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات التبعيات
COPY package.json pnpm-lock.yaml ./

# تثبيت التبعيات
RUN pnpm install --frozen-lockfile

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN pnpm nx build web --prod

# المرحلة 2: التشغيل باستخدام Nginx
FROM nginx:alpine AS runner

# نسخ ملف إعدادات Nginx
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

# نسخ الملفات المبنية
COPY --from=builder /app/dist/apps/web/browser /usr/share/nginx/html

# فتح المنفذ
EXPOSE 80

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# تشغيل Nginx
CMD ["nginx", "-g", "daemon off;"]
