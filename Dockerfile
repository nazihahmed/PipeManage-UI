FROM node:8.11 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM mhart/alpine-node:base-9
COPY --from=build /app .
EXPOSE 3000
CMD ["node", "app.js"]
