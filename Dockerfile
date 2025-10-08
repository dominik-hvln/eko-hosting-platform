FROM node:20-alpine

WORKDIR /app

# Instalujemy zależności systemowe, w tym GIT do klonowania kolekcji
RUN apk add --no-cache python3 py3-pip ansible py3-pymysql git openssh-client

# Ręczne tworzenie struktury katalogów dla kolekcji Ansible
RUN mkdir -p /usr/share/ansible/collections/ansible_collections/community
RUN mkdir -p /usr/share/ansible/collections/ansible_collections/ansible

# Bezpośrednie klonowanie kolekcji z repozytoriów Git
RUN git clone --depth 1 https://github.com/ansible-collections/community.mysql.git /usr/share/ansible/collections/ansible_collections/community/mysql
RUN git clone --depth 1 https://github.com/ansible-collections/community.general.git /usr/share/ansible/collections/ansible_collections/community/general
RUN git clone --depth 1 https://github.com/ansible-collections/ansible.posix.git /usr/share/ansible/collections/ansible_collections/ansible/posix

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start:dev"]