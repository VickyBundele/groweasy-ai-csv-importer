FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=https://groweasy-ai-csv-importer-backend.onrender.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 10000

ENV PORT=10000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]