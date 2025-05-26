# Usa Node.js como base
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expón el puerto que usa tu backend (ajústalo si es diferente)
EXPOSE 3001

# Comando por defecto al arrancar el contenedor
CMD ["npm", "start"]
