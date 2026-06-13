FROM nginx:alpine

# Копируем всю статику (HTML, CSS, JS, картинки, шрифты)
COPY public/ /usr/share/nginx/html/

# Копируем конфиг Nginx
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]