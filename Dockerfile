# ビルドステージ
FROM node:20-alpine AS build

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピーとビルド
COPY . .
RUN npm run build

# 配信ステージ
FROM nginx:alpine

# 管理用ディレクトリの作成
RUN mkdir -p /usr/share/nginx/html/admin

# ビルド成果物を Nginx の配信ディレクトリにコピー
# Vite の base 設定 (/shu-binran/) に合わせてサブディレクトリを作成
COPY --from=build /app/dist /usr/share/nginx/html/shu-binran

# カスタム Nginx 設定のコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
