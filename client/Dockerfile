# Stage 1: Build the React Application
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass environment variables to Vite during the build process
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Fix for React Router: Redirect all 404s back to index.html
RUN sed -i '/location \/ {/a \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]