FROM nginx:alpine


# 删除默认的nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80 443

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 