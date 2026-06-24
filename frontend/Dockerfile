FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
#Même stratégie de cache que le backend

RUN npm install
#Installe Ract, Vite, Typescript, Tailwind, Axios, recharts ...
#Ces dépendances font ~ 300mo -> le cache est crucial

COPY . .
#Copie le code source React

EXPOSE 3000
# Port du serveur de developpement Vite

CMD ["npm", "run", "dev"]
#Lance Vite en mode developpement
#Vite détectera les changements via le volume monté dans docker-compose.yml
# et rafraichira le navigateur automatiquement