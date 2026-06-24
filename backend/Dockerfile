FROM node:20-alpine
# Image de base : Node.js 20 LTS sur Alpine Linux (ultra-légère ~50Mo)
# Téléchargée depuis Docker Hub au premier build

WORKDIR /app
# Tous les fichiers seront dans /app à l'intérieur du container

COPY package*.json ./
# On copie D'ABORD package.json et package-lock.json
# Raison : optimisation du cache Docker
# Si package.json ne change pas → npm install est mis en cache
# → rebuild 10x plus rapide si on modifie juste le code

RUN npm install 
# Installe les dépendances à l'intérieur du container
# Exécuté pendant le BUILD de l'image (pas au démarrage)

COPY . .
# Copie tout le code source dans /app
# Fait APRÈS npm install pour bénéficier du cache

EXPOSE 5000
# Documentation : ce container utilise le port 5000
# (la vraie exposition est dans docker-compose.yml)

CMD ["npm", "run", "dev"]
# Commande lancée au DÉMARRAGE du container
# npm run dev = nodemon server.js (redémarre à chaque modif .js)
# Forme JSON ["cmd","arg"] = pas de shell intermédiaire

