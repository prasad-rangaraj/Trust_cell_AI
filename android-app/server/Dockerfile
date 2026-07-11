# Use official Gradle image to build the project
FROM gradle:8.5-jdk21 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle installDist --no-daemon

# Use a lightweight JDK image for the runtime
FROM eclipse-temurin:21-jre-alpine
EXPOSE 8080
RUN mkdir /app
# Copy the compiled distribution from the build stage
COPY --from=build /home/gradle/src/build/install/server /app/

# Run the Ktor server
WORKDIR /app/bin
CMD ["./server"]
