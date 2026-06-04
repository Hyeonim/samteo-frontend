# 1단계: Node.js 환경에서 리액트 소스코드를 완제품(dist 폴더)으로 빌드
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 가볍고 빠른 Nginx 웹서버를 상자 안에 같이 포장해서 배포
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 💡 리액트 라우터(SPA) 새로고침 시 화면이 하얗게 변하며 404 에러가 나는 것을 방지하는 필수 Nginx 설정
RUN rm /etc/nginx/conf.d/default.conf
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]