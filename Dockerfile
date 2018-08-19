# build stage
FROM node:9.11.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 8081 3000
CMD ["npm", "start"]
