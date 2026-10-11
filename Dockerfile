FROM node:20-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS api
COPY server ./server
EXPOSE 3000
CMD ["npm", "run", "server"]

FROM dependencies AS mobile
COPY App.tsx app.json tsconfig.json ./
COPY components ./components
EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--lan", "--port", "8081"]
