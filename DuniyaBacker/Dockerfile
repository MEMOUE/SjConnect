# Étape 1 : Build avec Gradle
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Copier les fichiers Gradle et configuration
COPY gradle gradle
COPY gradlew .
COPY gradlew.bat .
COPY build.gradle .
COPY settings.gradle .

# Rendre gradlew exécutable
RUN chmod +x ./gradlew

# Télécharger les dépendances (optimisation cache)
RUN ./gradlew dependencies --no-daemon || true

# Copier le code source
COPY src src

# Construire le JAR
RUN ./gradlew bootJar --no-daemon

# Étape 2 : Runtime avec JRE léger
FROM eclipse-temurin:17-jre

WORKDIR /app

# Créer un répertoire pour les logs
RUN mkdir -p /app/logs && chmod -R 777 /app/logs

# Copier le JAR depuis l’étape de build
COPY --from=build /app/build/libs/*.jar app.jar

# Exposer le port
EXPOSE 8080

# Démarrer l'application avec options mémoire
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xms256m -Xmx512m} -jar app.jar"]
